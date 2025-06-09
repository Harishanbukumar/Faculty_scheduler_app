import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # MongoDB Configuration
    MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://jaivisal123:jaivmessi@cluster0.wru8roe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # SMS Configuration (for Twilio or similar service)
    SMS_ACCOUNT_SID = os.getenv("SMS_ACCOUNT_SID", "")
    SMS_AUTH_TOKEN = os.getenv("SMS_AUTH_TOKEN", "")
    SMS_FROM_NUMBER = os.getenv("SMS_FROM_NUMBER", "")
    
    # OTP Configuration
    OTP_EXPIRY_SECONDS = 24 * 60 * 60  # 24 hours
    
    # Password Reset Configuration
    PASSWORD_RESET_EXPIRY_SECONDS = 24 * 60 * 60  # 24 hours
    
    # Application Configuration
    DEBUG = os.getenv("DEBUG", "True") == "True"
    TESTING = os.getenv("TESTING", "False") == "True"
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # User Roles
    ROLES = {
        "ADMIN": "admin",
        "FACULTY": "faculty",
        "STUDENT": "student"
    }
    
    # Color Codes for Status
    STATUS_COLORS = {
        "COMPLETED": "green",
        "NOT_COMPLETED": "red",
        "ACTIVITY": "blue",
        "HOLIDAY": "gray"
    }