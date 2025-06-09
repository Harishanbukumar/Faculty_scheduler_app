from flask import current_app
from twilio.rest import Client
import phonenumbers

def send_sms(to_number, message):
    """Send SMS using Twilio or similar service"""
    # Check if Twilio credentials are configured
    account_sid = current_app.config.get('SMS_ACCOUNT_SID')
    auth_token = current_app.config.get('SMS_AUTH_TOKEN')
    from_number = current_app.config.get('SMS_FROM_NUMBER')
    
    if not account_sid or not auth_token or not from_number:
        # Mock SMS sending for development
        print(f"MOCK SMS to {to_number}: {message}")
        return True
    
    # Format the to_number to E.164 format for Twilio
    # For example, if you're using Indian numbers with country code +91:
    if to_number and not to_number.startswith('+'):
        # Assuming Indian numbers (change country code as needed)
        to_number = "+91" + to_number.lstrip('0')
    
    try:
        # Send actual SMS
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
        return True
    except Exception as e:
        print(f"SMS sending failed: {e}")
        return False