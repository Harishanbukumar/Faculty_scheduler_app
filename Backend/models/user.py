from flask import current_app
from bson.objectid import ObjectId
import datetime
from werkzeug.security import generate_password_hash

class User:
    """User model for database operations"""
    
    @staticmethod
    def get_db():
        """Get the database connection"""
        return current_app.config['MONGO_DB']
    
    @staticmethod
    def get_by_id(user_id):
        """Get a user by ID"""
        try:
            return User.get_db().users.find_one({"_id": ObjectId(user_id)})
        except:
            return None
    
    @staticmethod
    def get_by_registration(registration_number):
        """Get a user by registration number"""
        return User.get_db().users.find_one({"registration_number": registration_number})
    
    @staticmethod
    def create(user_data):
        """Create a new user"""
        # Hash password if provided
        if 'password' in user_data:
            user_data['password'] = generate_password_hash(user_data['password'])
        
        # Set timestamps
        now = datetime.datetime.utcnow()
        user_data['created_at'] = now
        user_data['updated_at'] = now
        
        # Insert user
        result = User.get_db().users.insert_one(user_data)
        
        return {
            **user_data,
            "_id": result.inserted_id
        }
    
    @staticmethod
    def update(user_id, update_data):
        """Update a user by ID"""
        # Set updated timestamp
        update_data['updated_at'] = datetime.datetime.utcnow()
        
        # Hash password if provided
        if 'password' in update_data:
            update_data['password'] = generate_password_hash(update_data['password'])
        
        # Update user
        result = User.get_db().users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def delete(user_id):
        """Delete a user by ID"""
        result = User.get_db().users.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    @staticmethod
    def list_all(role=None, limit=100, skip=0):
        """List all users, optionally filtered by role"""
        query = {}
        if role:
            query["role"] = role
        
        users = list(User.get_db().users.find(
            query,
            {
                "password": 0,
                "otp": 0,
                "otp_expiry": 0,
                "reset_otp": 0,
                "reset_otp_expiry": 0
            }
        ).skip(skip).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user["_id"] = str(user["_id"])
        
        return users
    
    @staticmethod
    def count(role=None):
        """Count users, optionally filtered by role"""
        query = {}
        if role:
            query["role"] = role
        
        return User.get_db().users.count_documents(query)
    
    @staticmethod
    def get_students_by_group(group_id):
        """Get all students in a specific group"""
        students = list(User.get_db().users.find(
            {"role": "student", "group_id": group_id},
            {
                "password": 0,
                "otp": 0,
                "otp_expiry": 0,
                "reset_otp": 0,
                "reset_otp_expiry": 0
            }
        ))
        
        # Convert ObjectId to string for JSON serialization
        for student in students:
            student["_id"] = str(student["_id"])
        
        return students
    
    @staticmethod
    def get_faculty_by_department(department):
        """Get all faculty in a specific department"""
        faculty = list(User.get_db().users.find(
            {"role": "faculty", "department": department},
            {
                "password": 0,
                "otp": 0,
                "otp_expiry": 0,
                "reset_otp": 0,
                "reset_otp_expiry": 0
            }
        ))
        
        # Convert ObjectId to string for JSON serialization
        for f in faculty:
            f["_id"] = str(f["_id"])
        
        return faculty
    
    @staticmethod
    def update_group_assignment(student_ids, group_id):
        """Assign multiple students to a group"""
        object_ids = [ObjectId(id) for id in student_ids]
        
        result = User.get_db().users.update_many(
            {"_id": {"$in": object_ids}, "role": "student"},
            {"$set": {"group_id": group_id, "updated_at": datetime.datetime.utcnow()}}
        )
        
        return result.modified_count