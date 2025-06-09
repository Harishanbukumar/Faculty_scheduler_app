import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';

// Common Pages
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminGroups from './pages/admin/Groups';
import AdminHolidays from './pages/admin/Holidays';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyClasses from './pages/faculty/Classes';
import FacultyActivities from './pages/faculty/Activities';
import FacultyMeetings from './pages/faculty/Meetings';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentClasses from './pages/student/Classes';
import StudentMeetings from './pages/student/Meetings';

// Protected Routes
import ProtectedRoute from './components/common/ProtectedRoute';

const App = () => {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/groups" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminGroups />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/holidays" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHolidays />
            </ProtectedRoute>
          } 
        />

        {/* Faculty Routes */}
        <Route 
          path="/faculty/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/classes" 
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyClasses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/activities" 
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyActivities />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/faculty/meetings" 
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyMeetings />
            </ProtectedRoute>
          } 
        />

        {/* Student Routes */}
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/classes" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentClasses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/meetings" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMeetings />
            </ProtectedRoute>
          } 
        />

        {/* Shared Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast Container for notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default App;