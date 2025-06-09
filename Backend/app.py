from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from config import Config
import datetime
from werkzeug.security import generate_password_hash

# Import routes
from auth.routes import auth_bp
from routes.admin import admin_bp
from routes.faculty import faculty_bp
from routes.student import student_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load configuration
app.config.from_object(Config)

# MongoDB connection
try:
    mongo_uri = app.config.get("MONGO_URI")
    client = MongoClient(mongo_uri)
    db = client.faculty_scheduler  # Database name
    app.config['MONGO_DB'] = db
    # Set JWT secret key for auth routes
    app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
    print("MongoDB connection successful")
    
    # Check if admin user exists
    admin_exists = db.users.find_one({"registration_number": "ADM001"})
    if not admin_exists:
        # Create default admin user
        default_admin = {
            "registration_number": "ADM001",
            "name": "System Administrator",
            "email": "admin@example.com",
            "mobile_number": "1234567890",
            "password": generate_password_hash("admin123"),
            "role": "admin",
            "is_verified": True,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        db.users.insert_one(default_admin)
        print("Default admin user created with credentials:")
        print("Registration Number: ADM001")
        print("Password: admin123")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Don't crash if MongoDB is not available during startup
    # The application will handle the error when accessing the database

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(faculty_bp, url_prefix='/api/faculty')
app.register_blueprint(student_bp, url_prefix='/api/student')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Root route
@app.route('/')
def index():
    return jsonify({"message": "Faculty Schedule Management System API"})

if __name__ == '__main__':
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=int(os.getenv("PORT", 5000)))