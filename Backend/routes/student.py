from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import datetime

from auth.utils import student_required
from models.timetable import Timetable
from models.class_session import ClassSession
from models.meeting import Meeting
from models.user import User
from services.notification import NotificationService

student_bp = Blueprint('student', __name__)

# Timetable Routes
@student_bp.route('/timetable', methods=['GET'])
@student_required
def get_timetable(current_user):
    """Get student timetable"""
    student_id = str(current_user['_id'])
    
    timetable = Timetable.get_student_timetable(student_id)
    
    if not timetable:
        return jsonify({"message": "No timetable found. You may not be assigned to a group."}), 200
    
    return jsonify({"timetable": timetable}), 200

# Class Routes
@student_bp.route('/classes', methods=['GET'])
@student_required
def get_classes(current_user):
    """Get student classes with optional date filters"""
    student_id = str(current_user['_id'])
    group_id = current_user.get('group_id')
    
    if not group_id:
        return jsonify({
            "classes": [],
            "total": 0,
            "message": "You are not assigned to a group"
        }), 200
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Convert date strings to datetime objects
    if start_date:
        start_date = datetime.datetime.fromisoformat(start_date)
    
    if end_date:
        end_date = datetime.datetime.fromisoformat(end_date)
    
    classes = ClassSession.get_student_classes(group_id, start_date, end_date)
    
    # Add faculty names to each class
    for cls in classes:
        faculty = User.get_by_id(cls['faculty_id'])
        if faculty:
            cls['faculty_name'] = faculty.get('name', '')
    
    return jsonify({
        "classes": classes,
        "total": len(classes)
    }), 200

# Faculty List Route
@student_bp.route('/faculty-list', methods=['GET'])
@student_required
def get_faculty_list(current_user):
    """Get all faculty members for meeting requests"""
    try:
        faculty_members = User.list_all(role='faculty')
        
        # Format the response to include only necessary fields
        formatted_faculty = []
        for faculty in faculty_members:
            formatted_faculty.append({
                "_id": faculty["_id"],
                "name": faculty.get("name", "Unknown"),
                "department": faculty.get("department", ""),
                "email": faculty.get("email", "")
            })
        
        return jsonify({
            "faculty": formatted_faculty,
            "total": len(formatted_faculty)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch faculty list: {str(e)}"}), 500

# Faculty Availability Routes
@student_bp.route('/faculty-availability', methods=['GET'])
@student_required
def get_faculty_availability(current_user):
    """Get faculty availability"""
    faculty_id = request.args.get('faculty_id')
    
    if not faculty_id:
        return jsonify({"error": "Faculty ID is required"}), 400
    
    # Check if faculty exists
    faculty = User.get_by_id(faculty_id)
    if not faculty or faculty.get('role') != 'faculty':
        return jsonify({"error": "Faculty not found"}), 404
    
    available_slots = Timetable.find_available_slots(faculty_id)
    
    return jsonify({
        "faculty_name": faculty.get('name', ''),
        "available_slots": available_slots,
        "total": len(available_slots)
    }), 200

# Meeting Routes
@student_bp.route('/meetings', methods=['GET'])
@student_required
def get_meetings(current_user):
    """Get student meeting requests"""
    student_id = str(current_user['_id'])
    status = request.args.get('status')
    
    meetings = Meeting.get_student_meetings(student_id, status)
    
    return jsonify({
        "meetings": meetings,
        "total": len(meetings)
    }), 200

@student_bp.route('/meetings', methods=['POST'])
@student_required
def request_meeting(current_user):
    """Request a meeting with a faculty member"""
    data = request.get_json()
    
    if not data or 'faculty_id' not in data or 'preferred_time' not in data or 'reason' not in data:
        return jsonify({"error": "Faculty ID, preferred time, and reason are required"}), 400
    
    student_id = str(current_user['_id'])
    faculty_id = data['faculty_id']
    
    # Check if faculty exists
    faculty = User.get_by_id(faculty_id)
    if not faculty or faculty.get('role') != 'faculty':
        return jsonify({"error": "Faculty not found"}), 404
    
    # Convert preferred time to datetime
    preferred_time = datetime.datetime.fromisoformat(data['preferred_time'])
    
    # Create meeting request
    meeting_data = {
        'student_id': ObjectId(student_id),
        'faculty_id': ObjectId(faculty_id),
        'student_name': current_user.get('name', ''),
        'preferred_time': preferred_time,
        'duration': data.get('duration', 30),  # Default 30 minutes
        'reason': data['reason'],
        'status': Meeting.STATUS['PENDING'],
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    
    # Create meeting
    meeting = Meeting.create(meeting_data)
    
    # Convert ObjectId to string for JSON serialization
    meeting['_id'] = str(meeting['_id'])
    meeting['student_id'] = str(meeting['student_id'])
    meeting['faculty_id'] = str(meeting['faculty_id'])
    
    # Notify faculty
    NotificationService.notify_user(
        faculty_id,
        f"New meeting request from {current_user.get('name', 'Student')} for {preferred_time.strftime('%Y-%m-%d %H:%M')}",
        "meeting",
        str(meeting['_id'])
    )
    
    return jsonify({
        "message": "Meeting request submitted successfully",
        "meeting": meeting
    }), 201

@student_bp.route('/meetings/<meeting_id>/cancel', methods=['PUT'])
@student_required
def cancel_meeting(current_user, meeting_id):
    """Cancel a meeting request"""
    student_id = str(current_user['_id'])
    
    # Check if meeting belongs to this student
    meeting = Meeting.get_by_id(meeting_id)
    if not meeting or str(meeting.get('student_id')) != student_id:
        return jsonify({"error": "Meeting not found or you don't have permission"}), 404
    
    # Check if meeting can be cancelled
    if meeting.get('status') not in [Meeting.STATUS['PENDING'], Meeting.STATUS['APPROVED']]:
        return jsonify({"error": f"Meeting cannot be cancelled in {meeting.get('status')} status"}), 400
    
    # Cancel meeting
    success = Meeting.update_status(meeting_id, Meeting.STATUS['CANCELLED'])
    
    if not success:
        return jsonify({"error": "Failed to cancel meeting"}), 500
    
    # Notify faculty
    NotificationService.notify_user(
        meeting['faculty_id'],
        f"Meeting request from {current_user.get('name', 'Student')} for {meeting.get('preferred_time').strftime('%Y-%m-%d %H:%M')} has been cancelled",
        "meeting",
        meeting_id
    )
    
    return jsonify({
        "message": "Meeting cancelled successfully"
    }), 200

# Notifications Routes
@student_bp.route('/notifications', methods=['GET'])
@student_required
def get_notifications(current_user):
    """Get student notifications"""
    student_id = str(current_user['_id'])
    limit = int(request.args.get('limit', 50))
    is_read = request.args.get('is_read')
    
    # Convert is_read to boolean if provided
    if is_read is not None:
        is_read = is_read.lower() == 'true'
    
    notifications = NotificationService.get_user_notifications(student_id, is_read, limit)
    unread_count = NotificationService.count_unread(student_id)
    
    return jsonify({
        "notifications": notifications,
        "total": len(notifications),
        "unread_count": unread_count
    }), 200

@student_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@student_required
def mark_notification_read(current_user, notification_id):
    """Mark a notification as read"""
    student_id = str(current_user['_id'])
    
    # Check if notification belongs to this student
    notification = current_app.config['MONGO_DB'].notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification or str(notification.get('user_id')) != student_id:
        return jsonify({"error": "Notification not found or you don't have permission"}), 404
    
    # Mark as read
    success = NotificationService.mark_as_read(notification_id)
    
    if not success:
        return jsonify({"error": "Failed to mark notification as read"}), 500
    
    return jsonify({
        "message": "Notification marked as read"
    }), 200