import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut, FiHome, FiCalendar, FiUsers, FiActivity, FiMessageSquare } from 'react-icons/fi';

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Define navigation menu items based on user role
  const getNavItems = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', icon: <FiHome size={18} />, text: 'Dashboard' },
          { to: '/admin/users', icon: <FiUsers size={18} />, text: 'User Management' },
          { to: '/admin/groups', icon: <FiUsers size={18} />, text: 'Group Management' },
          { to: '/admin/holidays', icon: <FiCalendar size={18} />, text: 'Holiday Calendar' }
        ];
      case 'faculty':
        return [
          { to: '/faculty/dashboard', icon: <FiHome size={18} />, text: 'Dashboard' },
          { to: '/faculty/classes', icon: <FiCalendar size={18} />, text: 'Classes' },
          { to: '/faculty/activities', icon: <FiActivity size={18} />, text: 'Activities' },
          { to: '/faculty/meetings', icon: <FiMessageSquare size={18} />, text: 'Meetings' }
        ];
      case 'student':
        return [
          { to: '/student/dashboard', icon: <FiHome size={18} />, text: 'Dashboard' },
          { to: '/student/classes', icon: <FiCalendar size={18} />, text: 'Classes' },
          { to: '/student/meetings', icon: <FiMessageSquare size={18} />, text: 'Meeting Requests' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Extract the last part of the path and capitalize it
    const lastPathSegment = path.substring(path.lastIndexOf('/') + 1);
    return lastPathSegment.charAt(0).toUpperCase() + lastPathSegment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-primary-600">Faculty Scheduler</h1>
          <button 
            className="p-1 rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={toggleSidebar}
          >
            <FiX size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <a 
                  href={item.to}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.to);
                    setSidebarOpen(false);
                  }} 
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    location.pathname === item.to 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <button 
                className="p-1 mr-4 rounded-md md:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={toggleSidebar}
              >
                <FiMenu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
            </div>

            <div className="flex items-center">
              {/* Notification bell - can be expanded later */}
              <button className="p-2 mr-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <FiBell size={20} />
              </button>

              {/* User menu */}
              <div className="relative">
                <button 
                  className="flex items-center text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
                  onClick={toggleUserMenu}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-semibold">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-20">
                    <a 
                      href="/profile"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/profile');
                        setUserMenuOpen(false);
                      }}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FiUser size={16} className="mr-2" />
                      Profile
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FiLogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default Layout;