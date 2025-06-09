from flask import current_app
from bson.objectid import ObjectId
import datetime

class Activity:
    """Activity model for database operations"""
    
    ACTIVITY_TYPES = [
        "meeting",
        "paper_correction",
        "administrative",
        "research",
        "other"
    ]
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def create(activity_data):
        """Create a new activity"""
        now = datetime.datetime.utcnow()
        
        # Validate activity type
        if "activity_type" in activity_data and activity_data["activity_type"] not in Activity.ACTIVITY_TYPES:
            activity_data["activity_type"] = "other"
        
        # Set timestamps
        activity_data["created_at"] = now
        activity_data["updated_at"] = now
        
        # Convert string IDs to ObjectId if needed
        if "faculty_id" in activity_data and isinstance(activity_data["faculty_id"], str):
            activity_data["faculty_id"] = ObjectId(activity_data["faculty_id"])
        
        # Insert activity
        result = Activity.get_db().activities.insert_one(activity_data)
        
        return {
            **activity_data,
            "_id": result.inserted_id
        }
    
    @staticmethod
    def get_by_id(activity_id):
        """Get an activity by ID"""
        try:
            activity = Activity.get_db().activities.find_one({"_id": ObjectId(activity_id)})
            if activity:
                activity["_id"] = str(activity["_id"])
                activity["faculty_id"] = str(activity["faculty_id"])
            return activity
        except:
            return None
    
    @staticmethod
    def update(activity_id, update_data):
        """Update an activity"""
        update_data["updated_at"] = datetime.datetime.utcnow()
        
        result = Activity.get_db().activities.update_one(
            {"_id": ObjectId(activity_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def delete(activity_id):
        """Delete an activity"""
        result = Activity.get_db().activities.delete_one({"_id": ObjectId(activity_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def get_faculty_activities(faculty_id, start_date=None, end_date=None, activity_type=None):
        """Get activities for a faculty member with optional filters"""
        query = {"faculty_id": ObjectId(faculty_id)}
        
        # Apply date filters
        if start_date or end_date:
            date_query = {}
            if start_date:
                start_datetime = datetime.datetime.combine(start_date, datetime.time.min)
                date_query["$gte"] = start_datetime
            if end_date:
                end_datetime = datetime.datetime.combine(end_date, datetime.time.max)
                date_query["$lte"] = end_datetime
            query["start_time"] = date_query
        
        # Apply activity type filter
        if activity_type and activity_type in Activity.ACTIVITY_TYPES:
            query["activity_type"] = activity_type
        
        # Get activities
        activities = list(Activity.get_db().activities.find(query).sort("start_time", 1))
        
        # Convert ObjectId to string for JSON serialization
        for a in activities:
            a["_id"] = str(a["_id"])
            a["faculty_id"] = str(a["faculty_id"])
        
        return activities
    
    @staticmethod
    def get_activities_by_date_range(faculty_id, start_date, end_date):
        """Get activities for a faculty member within a date range"""
        start_datetime = datetime.datetime.combine(start_date, datetime.time.min)
        end_datetime = datetime.datetime.combine(end_date, datetime.time.max)
        
        activities = list(Activity.get_db().activities.find({
            "faculty_id": ObjectId(faculty_id),
            "start_time": {"$gte": start_datetime},
            "end_time": {"$lte": end_datetime}
        }).sort("start_time", 1))
        
        # Convert ObjectId to string for JSON serialization
        for a in activities:
            a["_id"] = str(a["_id"])
            a["faculty_id"] = str(a["faculty_id"])
        
        return activities
    
    @staticmethod
    def check_conflict(faculty_id, start_time, end_time):
        """Check if there's a conflict with existing activities"""
        # Find activities that overlap with the given time range
        activities = list(Activity.get_db().activities.find({
            "faculty_id": ObjectId(faculty_id),
            "start_time": {"$lt": end_time},
            "end_time": {"$gt": start_time}
        }))
        
        # Check if there are classes during this time
        date = start_time.date()
        day_name = date.strftime("%A").lower()
        
        # Get faculty timetable
        timetable = current_app.config['MONGO_DB'].timetables.find_one({"faculty_id": ObjectId(faculty_id)})
        
        classes_conflict = False
        if timetable and day_name in timetable["weekly_schedule"]:
            for period, data in timetable["weekly_schedule"][day_name].items():
                period_start = datetime.datetime.combine(date, datetime.time(int(period), 0))
                period_end = period_start + datetime.timedelta(hours=data.get("duration", 1))
                
                if period_start < end_time and period_end > start_time:
                    classes_conflict = True
                    break
        
        # Check for existing class sessions
        class_sessions = list(current_app.config['MONGO_DB'].class_sessions.find({
            "faculty_id": ObjectId(faculty_id),
            "date": {"$gte": start_time, "$lt": end_time},
            "status": {"$nin": ["cancelled", "rescheduled"]}
        }))
        
        return len(activities) > 0 or classes_conflict or len(class_sessions) > 0