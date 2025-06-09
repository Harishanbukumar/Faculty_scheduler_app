from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import random
import string
from bson.objectid import ObjectId

from auth.utils import validate_registration_number

auth_bp = Blueprint('auth', __name__)

# Helper function to get the MongoDB collections
def get_db():
    return current_app.config['MONGO_DB']

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input data
    if not data or not data.get('registration_number') or not data.get('mobile_number'):
        return jsonify({"error": "Registration number and mobile number are required"}), 400
    
    # Check registration number format
    reg_number = data.get('registration_number')
    role = validate_registration_number(reg_number)
    
    if not role:
        return jsonify({"error": "Invalid registration number format"}), 400
    
    # Check if user already exists
    if get_db().users.find_one({"registration_number": reg_number}):
        return jsonify({"error": "Registration number already exists"}), 409
    
    # If new user, proceed to password creation
    if not data.get('password'):
        return jsonify({"message": "Account does not exist. Please create a password to sign up."}), 200
    
    # Create new user with password
    password = data.get('password')
    mobile_number = data.get('mobile_number')
    
    # Create user object
    new_user = {
        "registration_number": reg_number,
        "mobile_number": mobile_number,
        "password": generate_password_hash(password),
        "role": role,
        "is_verified": True,  # Auto-verify users
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    
    # Add additional fields based on role
    if role == "student":
        new_user["name"] = data.get("name", "")
        new_user["email"] = data.get("email", "")
        new_user["group_id"] = None
    elif role == "faculty":
        new_user["name"] = data.get("name", "")
        new_user["email"] = data.get("email", "")
        new_user["department"] = data.get("department", "")
    
    # Insert user to database
    result = get_db().users.insert_one(new_user)
    
    return jsonify({
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('registration_number') or not data.get('password'):
        return jsonify({"error": "Registration number and password are required"}), 400
    
    reg_number = data.get('registration_number')
    password = data.get('password')
    remember_me = data.get('remember_me', False)
    
    # Log attempt for debugging
    print(f"Login attempt: registration_number={reg_number}")
    
    # Find user by registration number
    user = get_db().users.find_one({"registration_number": reg_number})
    
    if not user:
        print(f"User not found: {reg_number}")
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check password
    if not check_password_hash(user.get('password'), password):
        print(f"Invalid password for user: {reg_number}")
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Debug user info
    print(f"User found: {user.get('name')} with role {user.get('role')}")
    
    # Set token expiry based on remember_me
    token_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=30 if remember_me else 1)
    
    # Generate JWT token
    token = jwt.encode(
        {
            'sub': str(user['_id']),
            'registration_number': user['registration_number'],
            'role': user['role'],
            'exp': token_expiry
        },
        current_app.config['JWT_SECRET_KEY']
    )
    
    print(f"Login successful for: {reg_number}")
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user['_id']),
            "registration_number": user['registration_number'],
            "role": user['role'],
            "name": user.get('name', ''),
        }
    }), 200

@auth_bp.route('/reset-password-request', methods=['POST'])
def reset_password_request():
    data = request.get_json()
    
    if not data or not data.get('registration_number'):
        return jsonify({"error": "Registration number is required"}), 400
    
    reg_number = data.get('registration_number')
    
    # Find user by registration number
    user = get_db().users.find_one({"registration_number": reg_number})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Generate a reset token (a random string)
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    reset_token_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    
    # Update user with reset token
    get_db().users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expiry": reset_token_expiry,
                "updated_at": datetime.datetime.utcnow()
            }
        }
    )
    
    # In a real application, you would send this token via email
    # For testing, we'll just return it (not secure for production)
    return jsonify({
        "message": "Password reset instructions sent",
        "debug_reset_token": reset_token  # Remove this in production!
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    if not data or not data.get('registration_number') or not data.get('reset_token') or not data.get('new_password'):
        return jsonify({"error": "Registration number, reset token, and new password are required"}), 400
    
    reg_number = data.get('registration_number')
    reset_token = data.get('reset_token')
    new_password = data.get('new_password')
    
    # Find user by registration number
    user = get_db().users.find_one({"registration_number": reg_number})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Check if reset token is valid and not expired
    if user.get('reset_token') != reset_token:
        return jsonify({"error": "Invalid reset token"}), 400
    
    if user.get('reset_token_expiry') < datetime.datetime.utcnow():
        return jsonify({"error": "Reset token has expired"}), 400
    
    # Update user with new password
    get_db().users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": generate_password_hash(new_password),
                "reset_token": None,
                "reset_token_expiry": None,
                "updated_at": datetime.datetime.utcnow()
            }
        }
    )
    
    return jsonify({"message": "Password reset successfully"}), 200