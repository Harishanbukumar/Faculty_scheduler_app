from flask import current_app
from bson.objectid import ObjectId
import datetime

class ClassSession:
    """Class session model for database operations"""
    
    STATUS = {
        "COMPLETED": "completed",
        "NOT_COMPLETED": "not_completed",
        "CANCELLED": "cancelled",
        "RESCHEDULED": "rescheduled"
    }
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def create(class_data):
        """Create a new class session"""
        now = datetime.datetime.utcnow()
        
        # Set default status if not provided
        if "status" not in class_data:
            class_data["status"] = ClassSession.STATUS["NOT_COMPLETED"]
        
        # Set timestamps
        class_data["created_at"] = now
        class_data["updated_at"] = now
        
        # Convert string IDs to ObjectId if needed
        if "faculty_id" in class_data and isinstance(class_data["faculty_id"], str):
            class_data["faculty_id"] = ObjectId(class_data["faculty_id"])
        
        # Insert class session
        result = ClassSession.get_db().class_sessions.insert_one(class_data)
        
        return {
            **class_data,
            "_id": result.inserted_id
        }
    
    @staticmethod
    def create_from_timetable(faculty_id, semester_start_date, semester_end_date):
        """Create class sessions for a semester based on the weekly timetable"""
        # Get faculty timetable
        timetable = current_app.config['MONGO_DB'].timetables.find_one({"faculty_id": ObjectId(faculty_id)})
        
        if not timetable:
            return False
        
        # Convert dates to datetime objects
        start_date = datetime.datetime.fromisoformat(semester_start_date)
        end_date = datetime.datetime.fromisoformat(semester_end_date)
        
        # Get holidays
        holidays = list(current_app.config['MONGO_DB'].holidays.find({}))
        holiday_dates = [holiday["date"].date() for holiday in holidays]
        
        # Create class sessions for each day in the semester
        class_sessions = []
        current_date = start_date
        
        while current_date <= end_date:
            day_name = current_date.strftime("%A").lower()
            
            # Skip if it's a holiday
            if current_date.date() in holiday_dates:
                current_date += datetime.timedelta(days=1)
                continue
            
            # Check if there are classes scheduled for this day
            if day_name in timetable["weekly_schedule"]:
                day_schedule = timetable["weekly_schedule"][day_name]
                
                for period, class_data in day_schedule.items():
                    # Create datetime for this class
                    hour = int(period)
                    class_time = current_date.replace(hour=hour, minute=0, second=0)
                    
                    # Create class session
                    class_session = {
                        "faculty_id": ObjectId(faculty_id),
                        "group_id": class_data.get("group_id"),
                        "subject": class_data.get("subject"),
                        "date": class_time,
                        "duration": class_data.get("duration", 1),  # Default 1 hour
                        "status": ClassSession.STATUS["NOT_COMPLETED"],
                        "topic": class_data.get("topic", ""),
                        "notes": "",
                        "created_at": datetime.datetime.utcnow(),
                        "updated_at": datetime.datetime.utcnow()
                    }
                    
                    class_sessions.append(class_session)
            
            # Move to next day
            current_date += datetime.timedelta(days=1)
        
        # Insert all class sessions
        if class_sessions:
            ClassSession.get_db().class_sessions.insert_many(class_sessions)
        
        return len(class_sessions)
    
    @staticmethod
    def get_by_id(class_id):
        """Get a class session by ID"""
        try:
            class_session = ClassSession.get_db().class_sessions.find_one({"_id": ObjectId(class_id)})
            if class_session:
                class_session["_id"] = str(class_session["_id"])
                class_session["faculty_id"] = str(class_session["faculty_id"])
            return class_session
        except:
            return None
    
    @staticmethod
    def update(class_id, update_data):
        """Update a class session"""
        update_data["updated_at"] = datetime.datetime.utcnow()
        
        result = ClassSession.get_db().class_sessions.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def mark_complete(class_id, topic=None, notes=None):
        """Mark a class as completed"""
        update_data = {
            "status": ClassSession.STATUS["COMPLETED"],
            "updated_at": datetime.datetime.utcnow()
        }
        
        if topic:
            update_data["topic"] = topic
        
        if notes:
            update_data["notes"] = notes
        
        result = ClassSession.get_db().class_sessions.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def mark_incomplete(class_id, notes=None):
        """Mark a class as not completed"""
        update_data = {
            "status": ClassSession.STATUS["NOT_COMPLETED"],
            "updated_at": datetime.datetime.utcnow()
        }
        
        if notes:
            update_data["notes"] = notes
        
        result = ClassSession.get_db().class_sessions.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def cancel_class(class_id, reason=None):
        """Cancel a class session"""
        update_data = {
            "status": ClassSession.STATUS["CANCELLED"],
            "updated_at": datetime.datetime.utcnow()
        }
        
        if reason:
            update_data["notes"] = reason
        
        result = ClassSession.get_db().class_sessions.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": update_data}
        )
        
        # Trigger student notification here
        class_session = ClassSession.get_by_id(class_id)
        if class_session:
            from services.notification import NotificationService
            group_id = class_session.get("group_id")
            if group_id:
                message = f"Class cancelled: {class_session.get('subject')} on {class_session.get('date').strftime('%Y-%m-%d %H:%M')}"
                if reason:
                    message += f" Reason: {reason}"
                NotificationService.notify_group(group_id, message)
        
        return result.modified_count > 0
    
    @staticmethod
    def reschedule_class(class_id, new_date, notes=None):
        """Reschedule a class session"""
        # Get current class info
        class_session = ClassSession.get_by_id(class_id)
        if not class_session:
            return False
        
        # Mark original class as rescheduled
        ClassSession.get_db().class_sessions.update_one(
            {"_id": ObjectId(class_id)},
            {"$set": {
                "status": ClassSession.STATUS["RESCHEDULED"],
                "rescheduled_to": new_date,
                "updated_at": datetime.datetime.utcnow(),
                "notes": notes or class_session.get("notes", "")
            }}
        )
        
        # Create new class session
        new_class = {
            "faculty_id": ObjectId(class_session["faculty_id"]) if isinstance(class_session["faculty_id"], str) else class_session["faculty_id"],
            "group_id": class_session.get("group_id"),
            "subject": class_session.get("subject"),
            "date": new_date,
            "duration": class_session.get("duration", 1),
            "status": ClassSession.STATUS["NOT_COMPLETED"],
            "topic": class_session.get("topic", ""),
            "notes": notes or class_session.get("notes", ""),
            "rescheduled_from": str(class_session["_id"]),
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        
        result = ClassSession.get_db().class_sessions.insert_one(new_class)
        
        # Trigger student notification
        if class_session.get("group_id"):
            from services.notification import NotificationService
            message = f"Class rescheduled: {class_session.get('subject')} moved to {new_date.strftime('%Y-%m-%d %H:%M')}"
            NotificationService.notify_group(class_session.get("group_id"), message)
        
        return str(result.inserted_id)
    
    @staticmethod
    def get_faculty_classes(faculty_id, start_date=None, end_date=None, status=None):
        """Get class sessions for a faculty member with optional filters"""
        query = {"faculty_id": ObjectId(faculty_id)}
        
        # Apply date filters
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["date"] = date_query
        
        # Apply status filter
        if status:
            query["status"] = status
        
        # Get classes
        classes = list(ClassSession.get_db().class_sessions.find(query).sort("date", 1))
        
        # Convert ObjectId to string for JSON serialization
        for c in classes:
            c["_id"] = str(c["_id"])
            c["faculty_id"] = str(c["faculty_id"])
        
        return classes
    
    @staticmethod
    def get_student_classes(group_id, start_date=None, end_date=None):
        """Get class sessions for a student group with optional date filters"""
        query = {"group_id": group_id}
        
        # Apply date filters
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["date"] = date_query
        
        # Get classes
        classes = list(ClassSession.get_db().class_sessions.find(query).sort("date", 1))
        
        # Convert ObjectId to string for JSON serialization
        for c in classes:
            c["_id"] = str(c["_id"])
            c["faculty_id"] = str(c["faculty_id"])
        
        return classes
