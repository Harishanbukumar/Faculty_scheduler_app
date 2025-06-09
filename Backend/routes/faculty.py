from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import datetime

from auth.utils import faculty_required
from models.timetable import Timetable
from models.class_session import ClassSession
from models.activity import Activity
from models.meeting import Meeting
from models.holiday import Holiday
from services.notification import NotificationService

faculty_bp = Blueprint('faculty', __name__)

# Timetable Routes
@faculty_bp.route('/timetable', methods=['GET'])
@faculty_required
def get_timetable(current_user):
    """Get faculty timetable"""
    faculty_id = str(current_user['_id'])
    timetable = Timetable.get_faculty_timetable(faculty_id)
    
    if not timetable:
        return jsonify({"message": "No timetable found", "timetable": None}), 200
    
    return jsonify({"timetable": timetable}), 200

@faculty_bp.route('/timetable', methods=['POST'])
@faculty_required
def create_timetable(current_user):
    """Create faculty timetable"""
    data = request.get_json()
    
    if not data or 'weekly_schedule' not in data:
        return jsonify({"error": "Weekly schedule is required"}), 400
    
    faculty_id = str(current_user['_id'])
    
    # Check if timetable already exists
    existing_timetable = Timetable.get_faculty_timetable(faculty_id)
    if existing_timetable:
        return jsonify({"error": "Timetable already exists. Use PUT to update."}), 409
    
    timetable = Timetable.create_weekly_timetable(faculty_id, data['weekly_schedule'])
    
    # Convert ObjectId to string for JSON serialization
    timetable['_id'] = str(timetable['_id'])
    timetable['faculty_id'] = str(timetable['faculty_id'])
    
    return jsonify({
        "message": "Timetable created successfully",
        "timetable": timetable
    }), 201

@faculty_bp.route('/timetable', methods=['PUT'])
@faculty_required
def update_timetable(current_user):
    """Update faculty timetable"""
    data = request.get_json()
    
    if not data or 'weekly_schedule' not in data:
        return jsonify({"error": "Weekly schedule is required"}), 400
    
    faculty_id = str(current_user['_id'])
    
    # Get existing timetable
    existing_timetable = Timetable.get_faculty_timetable(faculty_id)
    if not existing_timetable:
        return jsonify({"error": "Timetable not found. Use POST to create."}), 404
    
    # Update timetable
    success = Timetable.update_timetable(
        existing_timetable['_id'],
        {"weekly_schedule": data['weekly_schedule']}
    )
    
    if not success:
        return jsonify({"error": "Failed to update timetable"}), 500
    
    # Get updated timetable
    updated_timetable = Timetable.get_faculty_timetable(faculty_id)
    
    return jsonify({
        "message": "Timetable updated successfully",
        "timetable": updated_timetable
    }), 200

@faculty_bp.route('/timetable/slot', methods=['PUT'])
@faculty_required
def update_timetable_slot(current_user):
    """Update a specific slot in the timetable"""
    data = request.get_json()
    
    if not data or 'day' not in data or 'period' not in data or 'data' not in data:
        return jsonify({"error": "Day, period, and data are required"}), 400
    
    faculty_id = str(current_user['_id'])
    day = data['day']
    period = data['period']
    slot_data = data['data']
    
    # Update slot
    success = Timetable.update_weekly_schedule(faculty_id, day, period, slot_data)
    
    if not success:
        return jsonify({"error": "Timetable not found or failed to update slot"}), 404
    
    return jsonify({
        "message": f"Slot {day} {period} updated successfully"
    }), 200

# Class Session Routes
@faculty_bp.route('/classes', methods=['GET'])
@faculty_required
def get_classes(current_user):
    """Get faculty classes with optional filters"""
    faculty_id = str(current_user['_id'])
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    # Convert date strings to datetime objects
    if start_date:
        start_date = datetime.datetime.fromisoformat(start_date)
    
    if end_date:
        end_date = datetime.datetime.fromisoformat(end_date)
    
    classes = ClassSession.get_faculty_classes(faculty_id, start_date, end_date, status)
    
    return jsonify({
        "classes": classes,
        "total": len(classes)
    }), 200

@faculty_bp.route('/classes/generate', methods=['POST'])
@faculty_required
def generate_classes(current_user):
    """Generate class sessions from timetable for a semester"""
    data = request.get_json()
    
    if not data or 'semester_start_date' not in data or 'semester_end_date' not in data:
        return jsonify({"error": "Semester start and end dates are required"}), 400
    
    faculty_id = str(current_user['_id'])
    
    # Create class sessions
    count = ClassSession.create_from_timetable(
        faculty_id,
        data['semester_start_date'],
        data['semester_end_date']
    )
    
    if count is False:
        return jsonify({"error": "Timetable not found or failed to generate classes"}), 404
    
    return jsonify({
        "message": f"Generated {count} class sessions successfully"
    }), 201

@faculty_bp.route('/classes/<class_id>/complete', methods=['PUT'])
@faculty_required
def mark_class_complete(current_user, class_id):
    """Mark a class as completed"""
    data = request.get_json() or {}
    
    faculty_id = str(current_user['_id'])
    
    # Check if class belongs to this faculty
    class_session = ClassSession.get_by_id(class_id)
    if not class_session or str(class_session.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Class not found or you don't have permission"}), 404
    
    # Mark as complete
    success = ClassSession.mark_complete(class_id, data.get('topic'), data.get('notes'))
    
    if not success:
        return jsonify({"error": "Failed to mark class as completed"}), 500
    
    return jsonify({
        "message": "Class marked as completed successfully"
    }), 200

@faculty_bp.route('/classes/<class_id>/incomplete', methods=['PUT'])
@faculty_required
def mark_class_incomplete(current_user, class_id):
    """Mark a class as not completed"""
    data = request.get_json() or {}
    
    faculty_id = str(current_user['_id'])
    
    # Check if class belongs to this faculty
    class_session = ClassSession.get_by_id(class_id)
    if not class_session or str(class_session.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Class not found or you don't have permission"}), 404
    
    # Mark as incomplete
    success = ClassSession.mark_incomplete(class_id, data.get('notes'))
    
    if not success:
        return jsonify({"error": "Failed to mark class as not completed"}), 500
    
    return jsonify({
        "message": "Class marked as not completed successfully"
    }), 200

@faculty_bp.route('/classes/<class_id>/cancel', methods=['PUT'])
@faculty_required
def cancel_class(current_user, class_id):
    """Cancel a class"""
    data = request.get_json() or {}
    
    faculty_id = str(current_user['_id'])
    
    # Check if class belongs to this faculty
    class_session = ClassSession.get_by_id(class_id)
    if not class_session or str(class_session.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Class not found or you don't have permission"}), 404
    
    # Cancel class
    success = ClassSession.cancel_class(class_id, data.get('reason'))
    
    if not success:
        return jsonify({"error": "Failed to cancel class"}), 500
    
    return jsonify({
        "message": "Class cancelled successfully"
    }), 200

@faculty_bp.route('/classes/<class_id>/reschedule', methods=['POST'])
@faculty_required
def reschedule_class(current_user, class_id):
    """Reschedule a class"""
    data = request.get_json()
    
    if not data or 'new_date' not in data:
        return jsonify({"error": "New date is required"}), 400
    
    faculty_id = str(current_user['_id'])
    
    # Check if class belongs to this faculty
    class_session = ClassSession.get_by_id(class_id)
    if not class_session or str(class_session.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Class not found or you don't have permission"}), 404
    
    # Convert date string to datetime
    new_date = datetime.datetime.fromisoformat(data['new_date'])
    
    # Check for conflicts
    has_conflict, conflict_reason = Timetable.check_conflict(
        faculty_id,
        new_date.date().isoformat(),
        new_date,
        new_date + datetime.timedelta(hours=class_session.get('duration', 1))
    )
    
    if has_conflict:
        return jsonify({
            "error": f"Cannot reschedule to this time due to conflict: {conflict_reason}"
        }), 409
    
    # Reschedule class
    result = ClassSession.reschedule_class(class_id, new_date, data.get('notes'))
    
    if not result:
        return jsonify({"error": "Failed to reschedule class"}), 500
    
    return jsonify({
        "message": "Class rescheduled successfully",
        "new_class_id": result
    }), 200

# Activity Routes
@faculty_bp.route('/activities', methods=['GET'])
@faculty_required
def get_activities(current_user):
    """Get faculty activities with optional filters"""
    faculty_id = str(current_user['_id'])
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    activity_type = request.args.get('activity_type')
    
    # Convert date strings to date objects
    if start_date:
        start_date = datetime.datetime.fromisoformat(start_date).date()
    
    if end_date:
        end_date = datetime.datetime.fromisoformat(end_date).date()
    
    activities = Activity.get_faculty_activities(faculty_id, start_date, end_date, activity_type)
    
    return jsonify({
        "activities": activities,
        "total": len(activities)
    }), 200

@faculty_bp.route('/activities', methods=['POST'])
@faculty_required
def create_activity(current_user):
    """Create a new activity"""
    data = request.get_json()
    
    if not data or 'activity_type' not in data or 'title' not in data or 'start_time' not in data or 'end_time' not in data:
        return jsonify({"error": "Activity type, title, start time, and end time are required"}), 400
    
    faculty_id = str(current_user['_id'])
    
    # Convert date strings to datetime objects
    data['start_time'] = datetime.datetime.fromisoformat(data['start_time'])
    data['end_time'] = datetime.datetime.fromisoformat(data['end_time'])
    
    # Check for conflicts
    has_conflict = Activity.check_conflict(
        faculty_id,
        data['start_time'],
        data['end_time']
    )
    
    if has_conflict:
        return jsonify({
            "error": "Cannot create activity due to conflict with existing schedule"
        }), 409
    
    # Add faculty_id to data
    data['faculty_id'] = faculty_id
    
    # Create activity
    activity = Activity.create(data)
    
    # Convert ObjectId to string for JSON serialization
    activity['_id'] = str(activity['_id'])
    activity['faculty_id'] = str(activity['faculty_id'])
    
    return jsonify({
        "message": "Activity created successfully",
        "activity": activity
    }), 201

@faculty_bp.route('/activities/<activity_id>', methods=['PUT'])
@faculty_required
def update_activity(current_user, activity_id):
    """Update an activity"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    faculty_id = str(current_user['_id'])
    
    # Check if activity belongs to this faculty
    activity = Activity.get_by_id(activity_id)
    if not activity or str(activity.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Activity not found or you don't have permission"}), 404
    
    # Convert date strings to datetime objects if provided
    if 'start_time' in data:
        data['start_time'] = datetime.datetime.fromisoformat(data['start_time'])
    
    if 'end_time' in data:
        data['end_time'] = datetime.datetime.fromisoformat(data['end_time'])
    
    # If times are being changed, check for conflicts
    if 'start_time' in data or 'end_time' in data:
        start_time = data.get('start_time', activity.get('start_time'))
        end_time = data.get('end_time', activity.get('end_time'))
        
        # Check for conflicts, excluding this activity
        current_app.config['MONGO_DB'].activities.delete_one({"_id": ObjectId(activity_id)})
        has_conflict = Activity.check_conflict(faculty_id, start_time, end_time)
        current_app.config['MONGO_DB'].activities.insert_one(activity)  # Restore activity
        
        if has_conflict:
            return jsonify({
                "error": "Cannot update activity due to conflict with existing schedule"
            }), 409
    
    # Update activity
    success = Activity.update(activity_id, data)
    
    if not success:
        return jsonify({"error": "Failed to update activity"}), 500
    
    # Get updated activity
    updated_activity = Activity.get_by_id(activity_id)
    
    return jsonify({
        "message": "Activity updated successfully",
        "activity": updated_activity
    }), 200

@faculty_bp.route('/activities/<activity_id>', methods=['DELETE'])
@faculty_required
def delete_activity(current_user, activity_id):
    """Delete an activity"""
    faculty_id = str(current_user['_id'])
    
    # Check if activity belongs to this faculty
    activity = Activity.get_by_id(activity_id)
    if not activity or str(activity.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Activity not found or you don't have permission"}), 404
    
    # Delete activity
    success = Activity.delete(activity_id)
    
    if not success:
        return jsonify({"error": "Failed to delete activity"}), 500
    
    return jsonify({
        "message": "Activity deleted successfully"
    }), 200

# Available Slots Routes
@faculty_bp.route('/available-slots', methods=['GET'])
@faculty_required
def get_available_slots(current_user):
    """Get available time slots"""
    faculty_id = str(current_user['_id'])
    duration = int(request.args.get('duration', 1))  # Default 1 hour
    
    available_slots = Timetable.find_available_slots(faculty_id, duration)
    
    return jsonify({
        "available_slots": available_slots,
        "total": len(available_slots)
    }), 200

# Meeting Routes
@faculty_bp.route('/meetings', methods=['GET'])
@faculty_required
def get_meetings(current_user):
    """Get faculty meetings with optional filters"""
    faculty_id = str(current_user['_id'])
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Convert date strings to datetime objects
    if start_date:
        start_date = datetime.datetime.fromisoformat(start_date)
    
    if end_date:
        end_date = datetime.datetime.fromisoformat(end_date)
    
    meetings = Meeting.get_faculty_meetings(faculty_id, status, start_date, end_date)
    
    return jsonify({
        "meetings": meetings,
        "total": len(meetings)
    }), 200

@faculty_bp.route('/meetings/<meeting_id>/respond', methods=['PUT'])
@faculty_required
def respond_to_meeting(current_user, meeting_id):
    """Respond to a meeting request"""
    data = request.get_json()
    
    if not data or 'status' not in data:
        return jsonify({"error": "Status is required"}), 400
    
    faculty_id = str(current_user['_id'])
    status = data['status']
    response_message = data.get('response_message')
    
    # Check if meeting belongs to this faculty
    meeting = Meeting.get_by_id(meeting_id)
    if not meeting or str(meeting.get('faculty_id')) != faculty_id:
        return jsonify({"error": "Meeting not found or you don't have permission"}), 404
    
    # Check status
    if status not in [Meeting.STATUS["APPROVED"], Meeting.STATUS["REJECTED"]]:
        return jsonify({"error": "Invalid status. Must be 'approved' or 'rejected'"}), 400
    
    # If approving, check for conflicts
    if status == Meeting.STATUS["APPROVED"]:
        preferred_time = meeting.get('preferred_time')
        duration = meeting.get('duration', 30)  # Default 30 minutes
        
        has_conflict, conflict_reason = Timetable.check_conflict(
            faculty_id,
            preferred_time.date().isoformat(),
            preferred_time,
            preferred_time + datetime.timedelta(minutes=duration)
        )
        
        if has_conflict:
            return jsonify({
                "error": f"Cannot approve meeting due to conflict: {conflict_reason}"
            }), 409
    
    # Update meeting status
    success = Meeting.update_status(meeting_id, status, response_message)
    
    if not success:
        return jsonify({"error": "Failed to update meeting status"}), 500
    
    return jsonify({
        "message": f"Meeting {status} successfully"
    }), 200

# Holiday Routes
@faculty_bp.route('/holidays', methods=['GET'])
@faculty_required
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