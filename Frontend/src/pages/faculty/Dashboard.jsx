import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { FiCalendar, FiClock, FiMessageSquare, FiCheckCircle, FiXCircle, FiBook, FiActivity } from 'react-icons/fi';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import facultyService from '../../services/facultyService';
import { useAuth } from '../../context/AuthContext';

// Set up the calendar localizer
const localizer = momentLocalizer(moment);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [todayActive, setTodayActive] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    completedClasses: 0,
    pendingMeetings: 0,
    activities: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get today's date range
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get next 7 days
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        // Fetch classes for today
        const classesResponse = await facultyService.getFacultyClasses(todayStr, todayStr);
        
        // Fetch meetings
        const approvedMeetingsResponse = await facultyService.getFacultyMeetings(
          'approved', 
          todayStr, 
          nextWeekStr
        );
        
        // Fetch pending meeting requests
        const pendingMeetingsResponse = await facultyService.getFacultyMeetings('pending');
        
        // Fetch activities
        const activitiesResponse = await facultyService.getFacultyActivities(
          todayStr, 
          nextWeekStr
        );
        
        // Fetch all classes for the semester for stats
        const allClassesResponse = await facultyService.getFacultyClasses();
        const completedClasses = (allClassesResponse.classes || []).filter(cls => cls.status === 'completed').length;
        
        // Update stats
        setStats({
          totalClasses: allClassesResponse.total || allClassesResponse.classes?.length || 0,
          completedClasses: completedClasses,
          pendingMeetings: pendingMeetingsResponse.total || pendingMeetingsResponse.meetings?.length || 0,
          activities: activitiesResponse.total || activitiesResponse.activities?.length || 0
        });
        
        // Compile all events for calendar
        const calendarEvents = [];
        
        // Add classes to events
        if (classesResponse.classes) {
          classesResponse.classes.forEach(cls => {
            if (cls.date) {
              calendarEvents.push({
                id: cls._id,
                title: `Class: ${cls.subject || 'Unnamed Class'}`,
                start: new Date(cls.date),
                end: new Date(new Date(cls.date).getTime() + (cls.duration || 1) * 60 * 60 * 1000),
                type: 'class',
                status: cls.status
              });
            }
          });
        }
        
        // Add meetings to events
        if (approvedMeetingsResponse.meetings) {
          approvedMeetingsResponse.meetings.forEach(meeting => {
            if (meeting.preferred_time) {
              calendarEvents.push({
                id: meeting._id,
                title: `Meeting with ${meeting.student_name || 'Student'}`,
                start: new Date(meeting.preferred_time),
                end: new Date(new Date(meeting.preferred_time).getTime() + (meeting.duration || 30) * 60 * 1000),
                type: 'meeting'
              });
            }
          });
        }
        
        // Add activities to events
        if (activitiesResponse.activities) {
          activitiesResponse.activities.forEach(activity => {
            if (activity.start_time && activity.end_time) {
              calendarEvents.push({
                id: activity._id,
                title: activity.title || 'Activity',
                start: new Date(activity.start_time),
                end: new Date(activity.end_time),
                type: 'activity',
                activityType: activity.activity_type
              });
            }
          });
        }
        
        // Set states
        setEvents(calendarEvents);
        setTodayClasses(classesResponse.classes || []);
        setUpcomingMeetings(approvedMeetingsResponse.meetings || []);
        setPendingMeetings(pendingMeetingsResponse.meetings || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError(error.error || 'Failed to load dashboard data');
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

  // Event styling for calendar
  const eventStyleGetter = (event) => {
    let style = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    
    if (event.type === 'class') {
      if (event.status === 'completed') {
        style.backgroundColor = '#10B981'; // success-500
      } else if (event.status === 'cancelled') {
        style.backgroundColor = '#EF4444'; // error-500
      } else {
        style.backgroundColor = '#3B82F6'; // primary-500
      }
    } else if (event.type === 'meeting') {
      style.backgroundColor = '#8B5CF6'; // purple
    } else if (event.type === 'activity') {
      style.backgroundColor = '#F59E0B'; // amber-500
    }
    
    return {
      style
    };
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Faculty Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant={todayActive ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setTodayActive(true)}
          >
            Today
          </Button>
          <Button 
            variant={!todayActive ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setTodayActive(false)}
          >
            Week View
          </Button>
        </div>
      </div>
      
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Welcome back, {currentUser?.name || 'Faculty'}!</h2>
            <p className="mt-1 text-primary-100">
              Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/faculty/classes">
              <Button variant="outline" className="bg-white text-primary-600 hover:bg-primary-50">
                Manage Classes
              </Button>
            </Link>
          </div>
        </div>
      </Card>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border-l-4 border-primary-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-800">
              <FiBook size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-xl font-semibold text-gray-800">{stats.totalClasses}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-success-50 border-l-4 border-success-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success-100 text-success-800">
              <FiCheckCircle size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-semibold text-gray-800">{stats.completedClasses}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-accent-50 border-l-4 border-accent-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-100 text-accent-800">
              <FiMessageSquare size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Meetings</p>
              <p className="text-xl font-semibold text-gray-800">{stats.pendingMeetings}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-secondary-50 border-l-4 border-secondary-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-100 text-secondary-800">
              <FiActivity size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-xl font-semibold text-gray-800">{stats.activities}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <Card 
          title="Today's Classes" 
          icon={<FiCalendar />}
          className="lg:col-span-2"
          footer={
            <Link to="/faculty/classes">
              <Button variant="ghost" size="sm">View All Classes</Button>
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
                      {cls.status === 'completed' ? <FiCheckCircle /> :
                       cls.status === 'cancelled' ? <FiXCircle /> :
                       <FiClock />}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-800">{cls.subject || 'Unnamed Class'}</h4>
                      <p className="text-sm text-gray-500">{formatTime(cls.date)} - Duration: {cls.duration || 1}h</p>
                      {cls.group_id && <p className="text-xs text-gray-400">Group: {cls.group_id}</p>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {cls.status !== 'completed' && cls.status !== 'cancelled' && (
                      <Link to={`/faculty/classes?id=${cls._id}`}>
                        <Button size="sm" variant="success">Mark Complete</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No classes scheduled for today</p>
            )}
          </div>
        </Card>
        
        {/* Pending Meeting Requests */}
        <Card 
          title="Pending Meeting Requests" 
          icon={<FiMessageSquare />}
          footer={
            <Link to="/faculty/meetings">
              <Button variant="ghost" size="sm">View All Meetings</Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {pendingMeetings.length > 0 ? (
              pendingMeetings.map((meeting) => (
                <div key={meeting._id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div>
                    <h4 className="font-medium text-gray-800">{meeting.student_name || 'Student'}</h4>
                    <p className="text-sm text-gray-500">{formatDate(meeting.preferred_time)}, {formatTime(meeting.preferred_time)}</p>
                    <p className="text-xs text-gray-400 mt-1">{meeting.reason?.substring(0, 30) || 'No reason provided'}{meeting.reason?.length > 30 ? '...' : ''}</p>
                  </div>
                  <Link to="/faculty/meetings">
                    <Button size="sm" variant="outline">Respond</Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No pending meeting requests</p>
            )}
          </div>
        </Card>
      </div>
      
      {/* Calendar View */}
      <Card title={todayActive ? "Today's Schedule" : "Weekly Schedule"}>
        <div className="h-96">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            view={todayActive ? 'day' : 'week'}
            views={todayActive ? ['day'] : ['week', 'day']}
            date={new Date()}
            onNavigate={() => {}}
            toolbar={false}
          />
        </div>
      </Card>
      
      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <Card 
          title="Upcoming Meetings" 
          icon={<FiMessageSquare />}
          footer={
            <Link to="/faculty/meetings">
              <Button variant="ghost" size="sm">View All Meetings</Button>
            </Link>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting._id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                <h4 className="font-medium text-gray-800">{meeting.student_name || 'Student'}</h4>
                <p className="text-sm text-gray-500 mt-1">{formatDate(meeting.preferred_time)}, {formatTime(meeting.preferred_time)}</p>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{meeting.reason || 'No reason provided'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;