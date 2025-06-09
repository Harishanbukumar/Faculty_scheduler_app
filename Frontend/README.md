# Faculty Schedule Management System

A comprehensive web application for managing faculty schedules, classes, and student-faculty interactions in educational institutions.

## Project Overview

The Faculty Schedule Management System is designed to streamline the scheduling and management of academic activities in educational institutions. It provides different interfaces for administrators, faculty members, and students, allowing each user role to efficiently perform their respective tasks.

## Features

### For Administrators
- **User Management**: Create, view, update, and delete user accounts
- **Group Management**: Assign students to specific groups
- **Holiday Calendar**: Manage holidays and institutional events
- **Conflict Resolution**: Identify and resolve scheduling conflicts

### For Faculty
- **Timetable Management**: Create and maintain weekly class schedules
- **Class Management**: Track class sessions, mark attendance, and handle rescheduling
- **Activity Management**: Manage non-teaching activities like meetings and administrative tasks
- **Meeting Coordination**: Approve or reject student meeting requests

### For Students
- **Class Schedule Viewing**: Access personal class schedules
- **Meeting Requests**: Request meetings with faculty members based on their availability
- **Notifications**: Receive updates about class changes, cancellations, and meeting responses

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Notifications**: SMS notifications via Twilio

### Frontend
- **Framework**: React
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **API Integration**: Axios
- **Calendar**: React Big Calendar
- **Icons**: React Icons

## Project Structure

The project is divided into two main parts:

1. **Backend**: RESTful API built with Flask
2. **Frontend**: React application with modern UI components

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.8+
- MongoDB

### Backend Setup
1. Clone the repository
2. Navigate to the backend directory
```bash
cd Backend
```
3. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
4. Install dependencies
```bash
pip install -r requirements.txt
```
5. Set up environment variables (create a .env file)
```
MONGO_URI=your_mongodb_uri
JWT_SECRET_KEY=your_secret_key
PORT=5000
```
6. Run the development server
```bash
python app.py
```

### Frontend Setup
1. Navigate to the frontend directory
```bash
cd frontend
```
2. Install dependencies
```bash
npm install
```
3. Set up environment variables (create a .env file)
```
REACT_APP_API_URL=http://localhost:5000/api
```
4. Run the development server
```bash
npm start
```

## User Roles and Registration

The system supports three user roles:
- **Admin**: Registration number format: ADM followed by 3 digits (e.g., ADM001)
- **Faculty**: Registration number format: 7 digits (e.g., 1234567)
- **Student**: Registration number format: 10 digits (e.g., 1234567890)

## Authentication Flow

1. **Registration**: Users register with their registration number, mobile number, and other details
2. **OTP Verification**: A one-time password is sent to the user's mobile number for verification
3. **Login**: Verified users can log in with their registration number and password
4. **Password Reset**: Users can reset their password using an OTP sent to their mobile number

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- This project was built to streamline academic scheduling processes
- Special thanks to all contributors to the open-source libraries used in this project