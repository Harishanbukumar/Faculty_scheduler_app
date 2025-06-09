import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiMessageSquare, FiBell } from 'react-icons/fi';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import studentService from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get date ranges
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        // Fetch today's classes
        const todayClassesResponse = await studentService.getStudentClasses(todayStr, todayStr);
        
        // Fetch upcoming classes (next 7 days excluding today)
        const upcomingClassesResponse = await studentService.getStudentClasses(tomorrowStr, nextWeekStr);
        
        // Fetch meetings
        const meetingsResponse = await studentService.getStudentMeetings();
        
        // Fetch notifications
        const notificationsResponse = await studentService.getNotifications(false, 5);
        
        // Update states
        setTodayClasses(todayClassesResponse.classes);
        setUpcomingClasses(upcomingClassesResponse.classes);
        setMeetings(meetingsResponse.meetings);
        setNotifications(notificationsResponse.notifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showError]);

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      await studentService.markNotificationRead(notificationId);
      
      // Update notifications list
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? {...notif, is_read: true} : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showError('Failed to mark notification as read');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
      
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Welcome back, {currentUser?.name || 'Student'}!</h2>
            <p className="mt-1 text-primary-100">
              Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/student/classes">
              <Button variant="outline" className="bg-white text-primary-600 hover:bg-primary-50">
                View Schedule
              </Button>
            </Link>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <Card 
          title="Today's Classes" 
          icon={<FiCalendar />}
          className="lg:col-span-2"
          footer={
            <Link to="/student/classes">
              <Button variant="ghost" size="sm">View Full Schedule</Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls) => (
                <div key={cls._id} className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div className="flex items-start">
                    <div className={`mt-1 p-2 rounded-full ${
                      cls.status === 'completed' ? 'bg-success-100 text-success-600' :
                      cls.status === 'cancelled' ? 'bg-error-100 text-error-600' :
                      'bg-primary-100 text-primary-600'
                    }`}>
                      <FiClock />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-800">{cls.subject || 'Unnamed Class'}</h4>
                      <p className="text-sm text-gray-500">{formatTime(cls.date)} - Duration: {cls.duration || 1}h</p>
                      {cls.faculty_name && <p className="text-xs text-gray-400">Faculty: {cls.faculty_name}</p>}
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      cls.status === 'completed' ? 'bg-success-100 text-success-800' :
                      cls.status === 'cancelled' ? 'bg-error-100 text-error-800' :
                      cls.status === 'rescheduled' ? 'bg-accent-100 text-accent-800' :
                      'bg-primary-100 text-primary-800'
                    }`}>
                      {cls.status === 'not_completed' ? 'Scheduled' : cls.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No classes scheduled for today</p>
            )}
          </div>
        </Card>
        
        {/* Upcoming Classes */}
        <Card 
          title="Upcoming Classes" 
          icon={<FiCalendar />}
          footer={
            <Link to="/student/classes">
              <Button variant="ghost" size="sm">View Full Schedule</Button>
            </Link>
          }
        >
          <div className="space-y-3">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.slice(0, 5).map((cls) => (
                <div key={cls._id} className="border-b pb-3 last:border-0">
                  <h4 className="font-medium text-gray-800">{cls.subject || 'Unnamed Class'}</h4>
                  <p className="text-sm text-gray-500">{formatDate(cls.date)}, {formatTime(cls.date)}</p>
                  {cls.faculty_name && <p className="text-xs text-gray-400">Faculty: {cls.faculty_name}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No upcoming classes</p>
            )}
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Requests */}
        <Card 
          title="Meeting Requests" 
          icon={<FiMessageSquare />}
          footer={
            <Link to="/student/meetings">
              <Button variant="ghost" size="sm">View All Meetings</Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {meetings.length > 0 ? (
              meetings.slice(0, 3).map((meeting) => (
                <div key={meeting._id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div>
                    <h4 className="font-medium text-gray-800">{meeting.faculty_name || 'Faculty'}</h4>
                    <p className="text-sm text-gray-500">{formatDate(meeting.preferred_time)}, {formatTime(meeting.preferred_time)}</p>
                    <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      meeting.status === 'approved' ? 'bg-success-100 text-success-800' :
                      meeting.status === 'rejected' ? 'bg-error-100 text-error-800' :
                      meeting.status === 'cancelled' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-accent-100 text-accent-800'
                    }`}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No meeting requests</p>
            )}
          </div>
        </Card>
        
        {/* Notifications */}
        <Card 
          title="Recent Notifications" 
          icon={<FiBell />}
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`flex items-start border-b pb-3 last:border-0 ${!notification.is_read ? 'bg-primary-50 -mx-6 px-6' : ''}`}
                >
                  <div className="mt-1 p-2 rounded-full bg-primary-100 text-primary-600">
                    <FiBell />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-500">{formatRelativeTime(notification.created_at)}</p>
                      {!notification.is_read && (
                        <button 
                          onClick={() => markNotificationRead(notification._id)}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800">{notification.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No new notifications</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;