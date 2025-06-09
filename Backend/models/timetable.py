from flask import current_app
from bson.objectid import ObjectId
import datetime

class Timetable:
    """Timetable model for database operations"""
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def create_weekly_timetable(faculty_id, timetable_data):
        """Create a weekly timetable for a faculty member"""
        now = datetime.datetime.utcnow()
        timetable = {
            "faculty_id": ObjectId(faculty_id),
            "weekly_schedule": timetable_data,
            "created_at": now,
            "updated_at": now
        }
        
        # Insert timetable
        result = Timetable.get_db().timetables.insert_one(timetable)
        
        return {
            **timetable,
            "_id": result.inserted_id
        }
    
    @staticmethod
    def get_faculty_timetable(faculty_id):
        """Get the timetable for a faculty member"""
        timetable = Timetable.get_db().timetables.find_one({"faculty_id": ObjectId(faculty_id)})
        if timetable:
            timetable["_id"] = str(timetable["_id"])
            timetable["faculty_id"] = str(timetable["faculty_id"])
        return timetable
    
    @staticmethod
    def update_timetable(timetable_id, update_data):
        """Update a timetable by ID"""
        update_data['updated_at'] = datetime.datetime.utcnow()
        
        result = Timetable.get_db().timetables.update_one(
            {"_id": ObjectId(timetable_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def update_weekly_schedule(faculty_id, day, period, data):
        """Update a specific time slot in the weekly schedule"""
        # Find the timetable
        timetable = Timetable.get_db().timetables.find_one({"faculty_id": ObjectId(faculty_id)})
        
        if not timetable:
            return False
        
        # Update the specific slot
        timetable['weekly_schedule'][day][period] = data
        timetable['updated_at'] = datetime.datetime.utcnow()
        
        # Save the updated timetable
        result = Timetable.get_db().timetables.update_one(
            {"_id": timetable["_id"]},
            {"$set": {
                f"weekly_schedule.{day}.{period}": data,
                "updated_at": datetime.datetime.utcnow()
            }}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def get_student_timetable(student_id):
        """Get the timetable for a student based on group assignment"""
        # Get student with group info
        student = current_app.config['MONGO_DB'].users.find_one(
            {"_id": ObjectId(student_id), "role": "student"},
            {"group_id": 1}
        )
        
        if not student or not student.get("group_id"):
            return None
        
        group_id = student["group_id"]
        
        # Get all faculty timetables that include this group
        faculty_timetables = list(Timetable.get_db().timetables.find({}))
        
        # Build student timetable from faculty timetables
        student_timetable = {
            "student_id": str(student_id),
            "group_id": group_id,
            "weekly_schedule": {
                "monday": {},
                "tuesday": {},
                "wednesday": {},
                "thursday": {},
                "friday": {},
                "saturday": {}
            }
        }
        
        # Loop through all faculty timetables
        for faculty_timetable in faculty_timetables:
            faculty_id = str(faculty_timetable["faculty_id"])
            
            # Loop through days and periods
            for day in faculty_timetable["weekly_schedule"]:
                for period, data in faculty_timetable["weekly_schedule"][day].items():
                    # Check if this slot is for the student's group
                    if data.get("group_id") == group_id:
                        # Add to student timetable
                        student_timetable["weekly_schedule"][day][period] = {
                            **data,
                            "faculty_id": faculty_id
                        }
        
        return student_timetable
    
    @staticmethod
    def find_available_slots(faculty_id, duration=1):
        """Find available time slots for a faculty member"""
        # Get faculty timetable
        timetable = Timetable.get_db().timetables.find_one({"faculty_id": ObjectId(faculty_id)})
        
        if not timetable:
            return []
        
        # Get faculty activities
        activities = list(current_app.config['MONGO_DB'].activities.find(
            {"faculty_id": ObjectId(faculty_id)}
        ))
        
        # Get holidays
        holidays = list(current_app.config['MONGO_DB'].holidays.find({}))
        
        # Calculate available slots
        available_slots = []
        
        # Define working hours (e.g., 9 AM to 5 PM)
        working_hours = range(9, 17)
        
        # Get current date
        today = datetime.datetime.now().date()
        
        # Check for available slots for the next 7 days
        for i in range(7):
            date = today + datetime.timedelta(days=i)
            day_name = date.strftime("%A").lower()
            
            # Skip if it's a holiday
            is_holiday = any(holiday["date"].date() == date for holiday in holidays)
            if is_holiday:
                continue
            
            # Check each hour in working hours
            for hour in working_hours:
                # Skip if there's a class scheduled in weekly timetable
                if day_name in timetable["weekly_schedule"]:
                    if str(hour) in timetable["weekly_schedule"][day_name]:
                        continue
                
                # Skip if there's an activity scheduled
                time_slot = datetime.datetime.combine(date, datetime.time(hour, 0))
                is_activity = any(
                    activity["start_time"] <= time_slot and 
                    activity["end_time"] >= time_slot 
                    for activity in activities
                )
                
                if is_activity:
                    continue
                
                # This slot is available
                available_slots.append({
                    "date": date.isoformat(),
                    "day": day_name,
                    "time": f"{hour}:00"
                })
        
        return available_slots
    
    @staticmethod
    def check_conflict(faculty_id, date, start_time, end_time):
        """Check if there's a conflict in the schedule"""
        # Convert inputs to datetime objects
        date_obj = datetime.datetime.fromisoformat(date)
        day_name = date_obj.strftime("%A").lower()
        
        # Get faculty timetable
        timetable = Timetable.get_db().timetables.find_one({"faculty_id": ObjectId(faculty_id)})
        
        # Check if there are classes in the weekly schedule
        if timetable and day_name in timetable["weekly_schedule"]:
            for period, data in timetable["weekly_schedule"][day_name].items():
                period_hour = int(period)
                if period_hour >= start_time.hour and period_hour < end_time.hour:
                    return True, "Class scheduled at this time"
        
        # Check if there are activities
        activities = list(current_app.config['MONGO_DB'].activities.find({
            "faculty_id": ObjectId(faculty_id),
            "start_time": {"$lt": end_time},
            "end_time": {"$gt": start_time}
        }))
        
        if activities:
            return True, "Activity scheduled at this time"
        
        # Check if it's a holiday
        holidays = list(current_app.config['MONGO_DB'].holidays.find({
            "date": {"$gte": date_obj.replace(hour=0, minute=0, second=0),
                    "$lt": date_obj.replace(hour=23, minute=59, second=59)}
        }))
        
        if holidays:
            return True, "Holiday on this date"
        
        # No conflicts
        return False, None