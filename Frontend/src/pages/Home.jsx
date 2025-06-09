import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiUsers, FiClock, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // If user is logged in, redirect to their dashboard
  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'faculty':
          navigate('/faculty/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          break;
      }
    }
  }, [currentUser, navigate]);

  const features = [
    {
      icon: <FiCalendar size={32} className="text-primary-500" />,
      title: "Class Scheduling",
      description: "Easily manage class schedules, track attendance, and handle rescheduling or cancellations."
    },
    {
      icon: <FiClock size={32} className="text-primary-500" />,
      title: "Faculty Time Management",
      description: "Optimize faculty time with comprehensive tracking of classes, activities, and meetings."
    },
    {
      icon: <FiMessageSquare size={32} className="text-primary-500" />,
      title: "Meeting Requests",
      description: "Students can request meetings with faculty members based on their available time slots."
    },
    {
      icon: <FiUsers size={32} className="text-primary-500" />,
      title: "User Management",
      description: "Comprehensive user management system for administrators, faculty, and students."
    }
  ];

  const userRoles = [
    {
      role: "Admin",
      description: "Manage users, groups, holidays, and monitor scheduling conflicts.",
      actions: ["User Management", "Group Assignment", "Holiday Calendar", "Conflict Resolution"]
    },
    {
      role: "Faculty",
      description: "Manage class schedules, track activities, and respond to student meeting requests.",
      actions: ["Class Management", "Activity Tracking", "Meeting Coordination", "Schedule Overview"]
    },
    {
      role: "Student",
      description: "View class schedules, request meetings with faculty, and receive notifications.",
      actions: ["Class Schedule", "Meeting Requests", "Notifications", "Faculty Availability"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Nav */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary-600">Faculty Scheduler</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md">
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
                Streamline Faculty Scheduling and Management
              </h2>
              <p className="text-primary-100 text-xl mb-8">
                A comprehensive system for managing faculty schedules, classes, and student interactions.
              </p>
              <div className="space-x-4">
                <Link to="/register" className="bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-md font-medium inline-block">
                  Get Started
                </Link>
                <Link to="/login" className="border border-white text-white hover:bg-primary-500 px-6 py-3 rounded-md font-medium inline-block">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 mt-10 lg:mt-0 flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
                <div className="bg-primary-50 p-6 rounded-md">
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Today's Schedule</h3>
                      <span className="text-sm text-gray-500">Example UI</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-primary-100 text-primary-600 mr-3">
                          <FiClock size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Database Management</h4>
                          <p className="text-sm text-gray-500">9:00 AM - 10:00 AM</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-success-100 text-success-600 mr-3">
                          <FiCheckCircle size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Web Programming</h4>
                          <p className="text-sm text-gray-500">11:00 AM - 12:00 PM</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-accent-100 text-accent-600 mr-3">
                          <FiMessageSquare size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">Student Meeting</h4>
                          <p className="text-sm text-gray-500">2:00 PM - 2:30 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-4 text-lg text-gray-600">
              Designed to make academic scheduling and management easier for everyone
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 transition-transform hover:transform hover:scale-105">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Who Can Use It?</h2>
            <p className="mt-4 text-lg text-gray-600">
              The Faculty Scheduler is designed for educational institutions with different user roles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userRoles.map((role, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-2 text-primary-600">{role.role}</h3>
                <p className="text-gray-600 mb-4 flex-grow">{role.description}</p>
                <ul className="space-y-2">
                  {role.actions.map((action, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join our platform and start optimizing your academic scheduling today.
          </p>
          <div className="space-x-4">
            <Link to="/register" className="bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-md font-medium inline-block">
              Register Now
            </Link>
            <Link to="/login" className="border border-white text-white hover:bg-primary-500 px-6 py-3 rounded-md font-medium inline-block">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-shrink-0">
              <h2 className="text-2xl font-bold">Faculty Scheduler</h2>
              <p className="mt-2 text-gray-400">Optimizing academic scheduling</p>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-gray-400">&copy; {new Date().getFullYear()} Faculty Scheduler. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;