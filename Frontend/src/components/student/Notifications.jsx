import React, { useState, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiCalendar, FiMessageSquare, FiInfo } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import studentService from '../../services/studentService';

const Notifications = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [showAll]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get unread notifications by default
      const response = await studentService.getNotifications(showAll ? null : false);
      
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await studentService.markNotificationRead(notificationId);
      
      // Update state locally
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? {...notif, is_read: true} : notif
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) return;
      
      // Mark each notification as read
      const promises = unreadNotifications.map(notif => 
        studentService.markNotificationRead(notif._id)
      );
      
      await Promise.all(promises);
      
      // Update state locally
      setNotifications(notifications.map(notif => ({...notif, is_read: true})));
      setUnreadCount(0);
      
      showSuccess('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showError('Failed to mark all notifications as read');
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Format relative time for notifications
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return new Date(dateString).toLocaleDateString();
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'class':
        return <FiCalendar className="text-primary-500" />;
      case 'meeting':
        return <FiMessageSquare className="text-accent-500" />;
      case 'admin':
        return <FiInfo className="text-secondary-500" />;
      default:
        return <FiBell className="text-primary-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
              {unreadCount} unread
            </span>
          )}
        </h2>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleShowAll}
          >
            {showAll ? 'Show Unread' : 'Show All'}
          </Button>
          {unreadCount > 0 && (
            <Button 
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <FiBell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {showAll ? "You don't have any notifications yet." : "You don't have any unread notifications."}
            </p>
            {!showAll && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleShowAll}
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li 
                key={notification._id} 
                className={`py-4 ${!notification.is_read ? 'bg-primary-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="mt-1 p-2 rounded-full bg-gray-100">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          <FiCheckCircle className="text-primary-500" />
                          <span className="ml-1">Mark as read</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {notification.message}
                    </p>
                    {notification.related_id && (
                      <div className="mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {notifications.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                Load More
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Notifications;