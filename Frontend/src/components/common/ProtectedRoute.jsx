import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';
import Layout from './Layout';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If roles are provided, check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect based on user role
    switch (currentUser.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'faculty':
        return <Navigate to="/faculty/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Render the children within the layout
  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;