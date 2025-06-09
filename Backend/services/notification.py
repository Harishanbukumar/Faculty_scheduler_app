from flask import current_app
from bson.objectid import ObjectId
import datetime
from services.sms_service import send_sms

class NotificationService:
    """Service for managing notifications to users"""
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def create_notification(user_id, message, notification_type="system", related_id=None):
        """Create a new notification for a user"""
        notification = {
            "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
            "message": message,
            "type": notification_type,
            "related_id": related_id,
            "is_read": False,
            "created_at": datetime.datetime.utcnow()
        }
        
        result = NotificationService.get_db().notifications.insert_one(notification)
        
        # Get user mobile number for SMS
        user = NotificationService.get_db().users.find_one({"_id": ObjectId(user_id) if isinstance(user_id, str) else user_id})
        if user and user.get("mobile_number"):
            try:
                # Send SMS
                send_sms(user["mobile_number"], message)
            except Exception as e:
                print(f"SMS sending failed: {e}")
        
        return str(result.inserted_id)
    
    @staticmethod
    def mark_as_read(notification_id):
        """Mark a notification as read"""
        result = NotificationService.get_db().notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"is_read": True}}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def get_user_notifications(user_id, is_read=None, limit=50):
        """Get notifications for a user"""
        query = {"user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id}
        
        if is_read is not None:
            query["is_read"] = is_read
        
        notifications = list(
            NotificationService.get_db().notifications.find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        
        # Convert ObjectId to string for JSON serialization
        for notification in notifications:
            notification["_id"] = str(notification["_id"])
            notification["user_id"] = str(notification["user_id"])
        
        return notifications
    
    @staticmethod
    def count_unread(user_id):
        """Count unread notifications for a user"""
        return NotificationService.get_db().notifications.count_documents({
            "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
            "is_read": False
        })
    
    @staticmethod
    def delete_notification(notification_id):
        """Delete a notification"""
        result = NotificationService.get_db().notifications.delete_one({"_id": ObjectId(notification_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def delete_all_read(user_id):
        """Delete all read notifications for a user"""
        result = NotificationService.get_db().notifications.delete_many({
            "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
            "is_read": True
        })
        
        return result.deleted_count
    
    @staticmethod
    def notify_group(group_id, message, notification_type="class", related_id=None):
        """Create notifications for all students in a group"""
        # Get all students in the group
        students = list(NotificationService.get_db().users.find(
            {"role": "student", "group_id": group_id},
            {"_id": 1, "mobile_number": 1}
        ))
        
        notification_ids = []
        
        for student in students:
            # Create notification
            notification_id = NotificationService.create_notification(
                student["_id"],
                message,
                notification_type,
                related_id
            )
            
            notification_ids.append(notification_id)
        
        return notification_ids
    
    @staticmethod
    def notify_all_faculty(message, notification_type="admin", related_id=None):
        """Create notifications for all faculty members"""
        # Get all faculty members
        faculty = list(NotificationService.get_db().users.find(
            {"role": "faculty"},
            {"_id": 1, "mobile_number": 1}
        ))
        
        notification_ids = []
        
        for f in faculty:
            # Create notification
            notification_id = NotificationService.create_notification(
                f["_id"],
                message,
                notification_type,
                related_id
            )
            
            notification_ids.append(notification_id)
        
        return notification_ids
    
    @staticmethod
    def notify_user(user_id, message, notification_type="system", related_id=None):
        """Create a notification for a specific user"""
        return NotificationService.create_notification(
            user_id,
            message,
            notification_type,
            related_id
        )