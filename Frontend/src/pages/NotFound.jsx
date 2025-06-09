import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { currentUser } = useAuth();

  // Determine the homepage based on user role
  const getHomepage = () => {
    if (!currentUser) return '/';
    
    switch (currentUser.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'faculty':
        return '/faculty/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="text-center">
        <FiAlertTriangle className="mx-auto h-16 w-16 text-error-500" />
        <h1 className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight">Page not found</h1>
        <p className="mt-2 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <Link to={getHomepage()}>
            <Button icon={<FiHome />}>
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;