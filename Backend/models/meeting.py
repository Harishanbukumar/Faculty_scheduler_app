from flask import current_app
from bson.objectid import ObjectId
import datetime

class Meeting:
    """Meeting model for database operations"""
    
    STATUS = {
        "PENDING": "pending",
        "APPROVED": "approved",
        "REJECTED": "rejected",
        "COMPLETED": "completed",
        "CANCELLED": "cancelled"
    }
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def create(meeting_data):
        """Create a new meeting request"""
        now = datetime.datetime.utcnow()
        
        # Set default status if not provided
        if "status" not in meeting_data:
            meeting_data["status"] = Meeting.STATUS["PENDING"]
        
        # Set timestamps
        meeting_data["created_at"] = now
        meeting_data["updated_at"] = now
        
        # Validate preferred_time
        if "preferred_time" in meeting_data and isinstance(meeting_data["preferred_time"], str):
            try:
                meeting_data["preferred_time"] = datetime.datetime.fromisoformat(
                    meeting_data["preferred_time"].replace('Z', '+00:00')
                )
            except ValueError:
                # Default to current time + 1 day if time is invalid
                meeting_data["preferred_time"] = now + datetime.timedelta(days=1)
        
        # Convert string IDs to ObjectId if needed
        if "faculty_id" in meeting_data and isinstance(meeting_data["faculty_id"], str):
            try:
                meeting_data["faculty_id"] = ObjectId(meeting_data["faculty_id"])
            except Exception:
                pass  # Keep as string if conversion fails
        
        if "student_id" in meeting_data and isinstance(meeting_data["student_id"], str):
            try:
                meeting_data["student_id"] = ObjectId(meeting_data["student_id"])
            except Exception:
                pass  # Keep as string if conversion fails
        
        # Insert meeting
        try:
            result = Meeting.get_db().meetings.insert_one(meeting_data)
            
            # Create an activity for the faculty if the meeting is approved
            if meeting_data["status"] == Meeting.STATUS["APPROVED"]:
                try:
                    from models.activity import Activity
                    
                    activity_data = {
                        "faculty_id": meeting_data["faculty_id"],
                        "activity_type": "meeting",
                        "title": f"Meeting with student {meeting_data.get('student_name', '')}",
                        "description": meeting_data.get("reason", ""),
                        "start_time": meeting_data["preferred_time"],
                        "end_time": meeting_data["preferred_time"] + datetime.timedelta(minutes=meeting_data.get("duration", 30)),
                        "created_at": now,
                        "updated_at": now
                    }
                    
                    Activity.create(activity_data)
                except Exception as e:
                    print(f"Error creating activity for meeting: {e}")
            
            return {
                **meeting_data,
                "_id": result.inserted_id
            }
        except Exception as e:
            print(f"Error creating meeting: {e}")
            return None
    
    @staticmethod
    def get_by_id(meeting_id):
        """Get a meeting by ID"""
        try:
            meeting = Meeting.get_db().meetings.find_one({"_id": ObjectId(meeting_id)})
            if meeting:
                meeting["_id"] = str(meeting["_id"])
                meeting["faculty_id"] = str(meeting["faculty_id"])
                meeting["student_id"] = str(meeting["student_id"])
            return meeting
        except Exception:
            return None
    
    @staticmethod
    def update_status(meeting_id, status, response_message=None):
        """Update meeting status"""
        if status not in Meeting.STATUS.values():
            return False
        
        update_data = {
            "status": status,
            "updated_at": datetime.datetime.utcnow()
        }
        
        if response_message:
            update_data["response_message"] = response_message
        
        # Get current meeting data
        meeting = Meeting.get_by_id(meeting_id)
        if not meeting:
            return False
        
        try:
            result = Meeting.get_db().meetings.update_one(
                {"_id": ObjectId(meeting_id)},
                {"$set": update_data}
            )
            
            # Create or update activity based on new status
            if status == Meeting.STATUS["APPROVED"]:
                try:
                    from models.activity import Activity
                    
                    # Convert string IDs to ObjectId if needed
                    faculty_id = meeting["faculty_id"]
                    if isinstance(faculty_id, str):
                        try:
                            faculty_id = ObjectId(faculty_id)
                        except Exception:
                            pass
                    
                    # Check if activity already exists
                    existing_activity = current_app.config['MONGO_DB'].activities.find_one({
                        "faculty_id": faculty_id,
                        "activity_type": "meeting",
                        "meeting_id": str(meeting_id)
                    })
                    
                    if existing_activity:
                        # Update existing activity
                        Activity.update(str(existing_activity["_id"]), {
                            "title": f"Meeting with student {meeting.get('student_name', '')}",
                            "description": meeting.get("reason", ""),
                            "start_time": meeting["preferred_time"],
                            "end_time": meeting["preferred_time"] + datetime.timedelta(minutes=meeting.get("duration", 30))
                        })
                    else:
                        # Create new activity
                        activity_data = {
                            "faculty_id": faculty_id,
                            "activity_type": "meeting",
                            "title": f"Meeting with student {meeting.get('student_name', '')}",
                            "description": meeting.get("reason", ""),
                            "start_time": meeting["preferred_time"],
                            "end_time": meeting["preferred_time"] + datetime.timedelta(minutes=meeting.get("duration", 30)),
                            "meeting_id": str(meeting_id),
                            "created_at": datetime.datetime.utcnow(),
                            "updated_at": datetime.datetime.utcnow()
                        }
                        
                        Activity.create(activity_data)
                except Exception as e:
                    print(f"Error creating/updating activity for meeting: {e}")
            
            elif status in [Meeting.STATUS["REJECTED"], Meeting.STATUS["CANCELLED"]]:
                try:
                    # Remove associated activity if exists
                    current_app.config['MONGO_DB'].activities.delete_many({
                        "meeting_id": str(meeting_id)
                    })
                except Exception as e:
                    print(f"Error removing activity for meeting: {e}")
            
            # Send notification to the student
            if status in [Meeting.STATUS["APPROVED"], Meeting.STATUS["REJECTED"]]:
                try:
                    from services.notification import NotificationService
                    
                    student_id = meeting["student_id"]
                    if isinstance(student_id, str):
                        try:
                            student_id = ObjectId(student_id)
                        except Exception:
                            pass
                    
                    # Get faculty name
                    faculty = current_app.config['MONGO_DB'].users.find_one({"_id": ObjectId(meeting["faculty_id"])})
                    faculty_name = faculty.get("name", "Faculty") if faculty else "Faculty"
                    
                    if status == Meeting.STATUS["APPROVED"]:
                        message = f"Your meeting request with {faculty_name} has been approved for {meeting['preferred_time'].strftime('%Y-%m-%d %H:%M')}."
                    else:
                        message = f"Your meeting request with {faculty_name} has been rejected."
                        if response_message:
                            message += f" Reason: {response_message}"
                    
                    NotificationService.notify_user(student_id, message)
                except Exception as e:
                    print(f"Error sending notification for meeting: {e}")
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating meeting status: {e}")
            return False
    
    @staticmethod
    def get_student_meetings(student_id, status=None):
        """Get meetings requested by a student"""
        try:
            query = {"student_id": ObjectId(student_id)}
            
            # Apply status filter
            if status and status in Meeting.STATUS.values():
                query["status"] = status
            
            # Get meetings
            meetings = list(Meeting.get_db().meetings.find(query).sort("preferred_time", 1))
            
            # Convert ObjectId to string for JSON serialization
            for m in meetings:
                m["_id"] = str(m["_id"])
                m["faculty_id"] = str(m["faculty_id"])
                m["student_id"] = str(m["student_id"])
                
                # Get faculty details
                try:
                    faculty = current_app.config['MONGO_DB'].users.find_one({"_id": ObjectId(m["faculty_id"])})
                    if faculty:
                        m["faculty_name"] = faculty.get("name", "")
                except Exception:
                    pass
            
            return meetings
        except Exception as e:
            print(f"Error getting student meetings: {e}")
            return []
    
    @staticmethod
    def get_faculty_meetings(faculty_id, status=None, start_date=None, end_date=None):
        """Get meetings requested to a faculty member"""
        try:
            query = {"faculty_id": ObjectId(faculty_id)}
            
            # Apply status filter
            if status and status in Meeting.STATUS.values():
                query["status"] = status
            
            # Apply date filters
            if start_date or end_date:
                date_query = {}
                
                # Process start date
                if start_date:
                    try:
                        if isinstance(start_date, str):
                            start_date = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                        date_query["$gte"] = start_date
                    except Exception:
                        pass  # Skip invalid date
                
                # Process end date
                if end_date:
                    try:
                        if isinstance(end_date, str):
                            end_date = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                        date_query["$lte"] = end_date
                    except Exception:
                        pass  # Skip invalid date
                
                if date_query:
                    query["preferred_time"] = date_query
            
            # Get meetings
            meetings = list(Meeting.get_db().meetings.find(query).sort("preferred_time", 1))
            
            # Convert ObjectId to string for JSON serialization
            for m in meetings:
                m["_id"] = str(m["_id"])
                m["faculty_id"] = str(m["faculty_id"])
                m["student_id"] = str(m["student_id"])
                
                # Get student details
                try:
                    student = current_app.config['MONGO_DB'].users.find_one({"_id": ObjectId(m["student_id"])})
                    if student:
                        m["student_name"] = student.get("name", "")
                        m["student_reg_number"] = student.get("registration_number", "")
                except Exception:
                    pass
            
            return meetings
        except Exception as e:
            print(f"Error getting faculty meetings: {e}")
            return []