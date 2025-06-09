from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import datetime

from auth.utils import admin_required
from models.user import User
from models.holiday import Holiday
from models.class_session import ClassSession
from services.notification import NotificationService

admin_bp = Blueprint('admin', __name__)

# User Management Routes
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    """Get all users with optional role filter"""
    role = request.args.get('role')
    limit = int(request.args.get('limit', 100))
    skip = int(request.args.get('skip', 0))
    
    users = User.list_all(role, limit, skip)
    count = User.count(role)
    
    return jsonify({
        "users": users,
        "total": count,
        "limit": limit,
        "skip": skip
    }), 200

@admin_bp.route('/users/<user_id>', methods=['GET'])
@admin_required
def get_user(current_user, user_id):
    """Get a specific user by ID"""
    user = User.get_by_id(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Remove sensitive fields
    user.pop('password', None)
    user.pop('otp', None)
    user.pop('otp_expiry', None)
    user.pop('reset_otp', None)
    user.pop('reset_otp_expiry', None)
    
    # Convert ObjectId to string for JSON serialization
    user['_id'] = str(user['_id'])
    
    return jsonify({"user": user}), 200

@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user(current_user):
    """Create a new user"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    required_fields = ['registration_number', 'mobile_number', 'password', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Check if user already exists
    existing_user = User.get_by_registration(data['registration_number'])
    if existing_user:
        return jsonify({"error": "Registration number already exists"}), 409
    
    # Create user
    new_user = User.create(data)
    
    # Remove sensitive fields
    new_user.pop('password', None)
    new_user.pop('otp', None)
    new_user.pop('otp_expiry', None)
    
    # Convert ObjectId to string for JSON serialization
    new_user['_id'] = str(new_user['_id'])
    
    return jsonify({"user": new_user, "message": "User created successfully"}), 201

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@admin_required
def update_user(current_user, user_id):
    """Update a user"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Don't allow changing registration number
    if 'registration_number' in data:
        data.pop('registration_number')
    
    # Update user
    success = User.update(user_id, data)
    
    if not success:
        return jsonify({"error": "User not found or no changes made"}), 404
    
    return jsonify({"message": "User updated successfully"}), 200

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, user_id):
    """Delete a user"""
    # Don't allow deleting yourself
    if str(current_user['_id']) == user_id:
        return jsonify({"error": "Cannot delete your own account"}), 400
    
    success = User.delete(user_id)
    
    if not success:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({"message": "User deleted successfully"}), 200

# Group Management Routes
@admin_bp.route('/groups/assign', methods=['POST'])
@admin_required
def assign_group(current_user):
    """Assign students to a group"""
    data = request.get_json()
    
    if not data or 'student_ids' not in data or 'group_id' not in data:
        return jsonify({"error": "Student IDs and group ID are required"}), 400
    
    student_ids = data['student_ids']
    group_id = data['group_id']
    
    modified_count = User.update_group_assignment(student_ids, group_id)
    
    return jsonify({
        "message": f"Assigned {modified_count} students to group {group_id}",
        "modified_count": modified_count
    }), 200

@admin_bp.route('/groups/<group_id>/students', methods=['GET'])
@admin_required
def get_group_students(current_user, group_id):
    """Get all students in a group"""
    students = User.get_students_by_group(group_id)
    
    return jsonify({
        "students": students,
        "total": len(students),
        "group_id": group_id
    }), 200

# Holiday Management Routes
@admin_bp.route('/holidays', methods=['GET'])
@admin_required
def get_holidays(current_user):
    """Get all holidays with optional date filters"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date:
        start_date = datetime.datetime.fromisoformat(start_date)
    
    if end_date:
        end_date = datetime.datetime.fromisoformat(end_date)
    
    holidays = Holiday.get_all(start_date, end_date)
    
    return jsonify({
        "holidays": holidays,
        "total": len(holidays)
    }), 200

@admin_bp.route('/holidays', methods=['POST'])
@admin_required
def create_holiday(current_user):
    """Create a new holiday"""
    data = request.get_json()
    
    if not data or 'date' not in data or 'name' not in data:
        return jsonify({"error": "Date and name are required"}), 400
    
    # Create holiday
    holiday = Holiday.create(data)
    
    # Convert ObjectId to string for JSON serialization
    holiday['_id'] = str(holiday['_id'])
    
    # Notify all faculty members about the new holiday
    NotificationService.notify_all_faculty(
        f"New holiday: {holiday['name']} on {holiday['date'].strftime('%Y-%m-%d')}",
        "holiday",
        str(holiday['_id'])
    )
    
    return jsonify({
        "holiday": holiday,
        "message": "Holiday created successfully"
    }), 201

@admin_bp.route('/holidays/<holiday_id>', methods=['PUT'])
@admin_required
def update_holiday(current_user, holiday_id):
    """Update a holiday"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Update holiday
    success = Holiday.update(holiday_id, data)
    
    if not success:
        return jsonify({"error": "Holiday not found or no changes made"}), 404
    
    # Get updated holiday
    holiday = Holiday.get_by_id(holiday_id)
    
    # Notify all faculty members about the holiday update
    NotificationService.notify_all_faculty(
        f"Holiday update: {holiday['name']} on {holiday['date'].strftime('%Y-%m-%d')}",
        "holiday",
        holiday_id
    )
    
    return jsonify({
        "message": "Holiday updated successfully",
        "holiday": holiday
    }), 200

@admin_bp.route('/holidays/<holiday_id>', methods=['DELETE'])
@admin_required
def delete_holiday(current_user, holiday_id):
    """Delete a holiday"""
    # Get holiday before deleting for notification
    holiday = Holiday.get_by_id(holiday_id)
    
    if not holiday:
        return jsonify({"error": "Holiday not found"}), 404
    
    success = Holiday.delete(holiday_id)
    
    if not success:
        return jsonify({"error": "Holiday not found"}), 404
    
    # Notify all faculty members about the holiday deletion
    NotificationService.notify_all_faculty(
        f"Holiday cancelled: {holiday['name']} on {holiday['date'].strftime('%Y-%m-%d')}",
        "holiday",
        holiday_id
    )
    
    return jsonify({"message": "Holiday deleted successfully"}), 200

# Conflict Resolution Routes
@admin_bp.route('/conflicts', methods=['GET'])
@admin_required
def get_conflicts(current_user):
    """Get all scheduling conflicts"""
    # Get all class sessions
    class_sessions = list(current_app.config['MONGO_DB'].class_sessions.find({
        "status": {"$ne": ClassSession.STATUS["CANCELLED"]}
    }))
    
    # Convert ObjectId to string for JSON serialization
    for session in class_sessions:
        session["_id"] = str(session["_id"])
        session["faculty_id"] = str(session["faculty_id"])
    
    # Find classes with same group_id and overlapping times
    conflicts = []
    
    for i in range(len(class_sessions)):
        for j in range(i + 1, len(class_sessions)):
            session1 = class_sessions[i]
            session2 = class_sessions[j]
            
            # Skip if different groups or group_id is None
            if not session1.get("group_id") or not session2.get("group_id") or session1.get("group_id") != session2.get("group_id"):
                continue
            
            # Check for time overlap
            if (
                session1["date"] <= session2["date"] + datetime.timedelta(hours=session2.get("duration", 1)) and
                session2["date"] <= session1["date"] + datetime.timedelta(hours=session1.get("duration", 1))
            ):
                # Get faculty names
                faculty1 = current_app.config['MONGO_DB'].users.find_one({"_id": ObjectId(session1["faculty_id"])})
                faculty2 = current_app.config['MONGO_DB'].users.find_one({"_id": ObjectId(session2["faculty_id"])})
                
                conflicts.append({
                    "session1": {
                        "_id": session1["_id"],
                        "faculty_id": session1["faculty_id"],
                        "faculty_name": faculty1.get("name", "") if faculty1 else "",
                        "subject": session1.get("subject", ""),
                        "date": session1["date"].isoformat(),
                        "duration": session1.get("duration", 1)
                    },
                    "session2": {
                        "_id": session2["_id"],
                        "faculty_id": session2["faculty_id"],
                        "faculty_name": faculty2.get("name", "") if faculty2 else "",
                        "subject": session2.get("subject", ""),
                        "date": session2["date"].isoformat(),
                        "duration": session2.get("duration", 1)
                    },
                    "group_id": session1["group_id"]
                })
    
    # Return the conflicts
    return jsonify({
        "conflicts": conflicts,
        "total": len(conflicts)
    }), 200