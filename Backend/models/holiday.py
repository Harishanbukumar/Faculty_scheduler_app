from flask import current_app
from bson.objectid import ObjectId
import datetime

class Holiday:
    """Holiday model for database operations"""
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def create(holiday_data):
        """Create a new holiday"""
        now = datetime.datetime.utcnow()
        
        # Set timestamps
        holiday_data["created_at"] = now
        holiday_data["updated_at"] = now
        
        # Ensure date is a datetime object
        if "date" in holiday_data:
            if isinstance(holiday_data["date"], str):
                try:
                    if 'T' in holiday_data["date"]:
                        # Format: 2023-01-01T00:00:00
                        holiday_data["date"] = datetime.datetime.fromisoformat(holiday_data["date"])
                    else:
                        # Format: 2023-01-01
                        holiday_data["date"] = datetime.datetime.fromisoformat(holiday_data["date"] + "T00:00:00")
                except ValueError:
                    # Fallback to today's date if conversion fails
                    holiday_data["date"] = datetime.datetime.combine(
                        datetime.datetime.utcnow().date(), 
                        datetime.time.min
                    )
        
        # Insert holiday
        result = Holiday.get_db().holidays.insert_one(holiday_data)
        
        return {
            **holiday_data,
            "_id": result.inserted_id
        }
    
    @staticmethod
    def get_by_id(holiday_id):
        """Get a holiday by ID"""
        try:
            holiday = Holiday.get_db().holidays.find_one({"_id": ObjectId(holiday_id)})
            if holiday:
                holiday["_id"] = str(holiday["_id"])
            return holiday
        except Exception:
            return None
    
    @staticmethod
    def update(holiday_id, update_data):
        """Update a holiday"""
        update_data["updated_at"] = datetime.datetime.utcnow()
        
        # Ensure date is a datetime object if provided
        if "date" in update_data:
            if isinstance(update_data["date"], str):
                try:
                    if 'T' in update_data["date"]:
                        # Format: 2023-01-01T00:00:00
                        update_data["date"] = datetime.datetime.fromisoformat(update_data["date"])
                    else:
                        # Format: 2023-01-01
                        update_data["date"] = datetime.datetime.fromisoformat(update_data["date"] + "T00:00:00")
                except ValueError:
                    # Remove the date field if conversion fails to avoid errors
                    del update_data["date"]
        
        try:
            result = Holiday.get_db().holidays.update_one(
                {"_id": ObjectId(holiday_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception:
            return False
    
    @staticmethod
    def delete(holiday_id):
        """Delete a holiday"""
        try:
            result = Holiday.get_db().holidays.delete_one({"_id": ObjectId(holiday_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    @staticmethod
    def get_all(start_date=None, end_date=None):
        """Get all holidays with optional date filters"""
        query = {}
        
        # Apply date filters
        if start_date or end_date:
            date_query = {}
            if start_date:
                # Ensure start_date is a datetime object
                if isinstance(start_date, str):
                    try:
                        start_date = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    except ValueError:
                        start_date = datetime.datetime.combine(
                            datetime.datetime.utcnow().date(), 
                            datetime.time.min
                        )
                
                date_query["$gte"] = start_date
            
            if end_date:
                # Ensure end_date is a datetime object
                if isinstance(end_date, str):
                    try:
                        end_date = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    except ValueError:
                        end_date = datetime.datetime.combine(
                            datetime.datetime.utcnow().date() + datetime.timedelta(days=30), 
                            datetime.time.max
                        )
                
                date_query["$lte"] = end_date
            
            query["date"] = date_query
        
        try:
            # Get holidays
            holidays = list(Holiday.get_db().holidays.find(query).sort("date", 1))
            
            # Convert ObjectId to string for JSON serialization
            for h in holidays:
                h["_id"] = str(h["_id"])
            
            return holidays
        except Exception:
            # Return empty list on error
            return []
    
    @staticmethod
    def is_holiday(date):
        """Check if a date is a holiday"""
        try:
            # Convert to datetime if string
            if isinstance(date, str):
                try:
                    date = datetime.datetime.fromisoformat(date.replace('Z', '+00:00'))
                except ValueError:
                    return False
            
            # For date objects, convert to datetime
            if isinstance(date, datetime.date) and not isinstance(date, datetime.datetime):
                date = datetime.datetime.combine(date, datetime.time.min)
            
            # Find holidays on this date
            count = Holiday.get_db().holidays.count_documents({
                "date": {
                    "$gte": date.replace(hour=0, minute=0, second=0, microsecond=0),
                    "$lt": date.replace(hour=23, minute=59, second=59, microsecond=999999)
                }
            })
            
            return count > 0
        except Exception:
            return False