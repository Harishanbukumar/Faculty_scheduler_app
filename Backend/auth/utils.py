import re
import jwt
from flask import request, jsonify, current_app
from functools import wraps
import datetime
from bson.objectid import ObjectId

def validate_registration_number(reg_number):
    """
    Validate registration number format and return the appropriate role
    - 10 digits for students
    - 7 digits for faculty
    - ADM followed by 3 digits for admin
    
    Returns the role as string or None if invalid
    """
    # Admin pattern: 'ADM' followed by 3 digits
    admin_pattern = r'^ADM\d{3}$'
    if re.match(admin_pattern, reg_number):
        return "admin"
    
    # Faculty pattern: 7 digits
    faculty_pattern = r'^\d{7}$'
    if re.match(faculty_pattern, reg_number):
        return "faculty"
    
    # Student pattern: 10 digits
    student_pattern = r'^\d{10}$'
    if re.match(student_pattern, reg_number):
        return "student"
    
    # If no pattern matches
    return None

def token_required(f):
    """Decorator for routes that require a valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            data = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get current user from database
            current_user = current_app.config['MONGO_DB'].users.find_one(
                {"_id": ObjectId(data['sub'])}
            )
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication error: {str(e)}'}), 401
        
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated

def role_required(allowed_roles):
    """Decorator for routes that require specific roles"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated_function(current_user, *args, **kwargs):
            if current_user.get('role') not in allowed_roles:
                return jsonify({'error': 'Permission denied'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator for routes that require admin role"""
    return role_required(['admin'])(f)

def faculty_required(f):
    """Decorator for routes that require faculty role"""
    return role_required(['faculty', 'admin'])(f)

def student_required(f):
    """Decorator for routes that require student role"""
    return role_required(['student'])(f)