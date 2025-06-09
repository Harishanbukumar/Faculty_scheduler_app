import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { FiCalendar, FiClock, FiUser, FiBook, FiInfo } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import studentService from '../../services/studentService';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Set up the calendar localizer
const localizer = momentLocalizer(moment);

const ClassSchedule = () => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [view, setView] = useState('week');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      // Get date ranges for one full semester
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 1); // One month in the past
      
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3); // Three months in the future
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch classes for the date range
      const response = await studentService.getStudentClasses(startDateStr, endDateStr);
      setClasses(response.classes || []);
      
      // Create calendar events from classes
      const calendarEvents = (response.classes || []).map(cls => ({
        id: cls._id,
        title: cls.subject || 'Unnamed Class',
        start: new Date(cls.date),
        end: new Date(new Date(cls.date).getTime() + (cls.duration || 1) * 60 * 60 * 1000),
        status: cls.status,
        resource: cls
      }));
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showError('Failed to load class schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event) => {
    setSelectedClass(event.resource);
    setShowClassModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    
    switch (event.status) {
      case 'completed':
        style.backgroundColor = '#10B981'; // success-500
        break;
      case 'cancelled':
        style.backgroundColor = '#EF4444'; // error-500
        break;
      case 'rescheduled':
        style.backgroundColor = '#F59E0B'; // amber-500
        break;
      default:
        style.backgroundColor = '#3B82F6'; // primary-500
        break;
    }
    
    return { style };
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      case 'rescheduled':
        return 'bg-accent-100 text-accent-800';
      default:
        return 'bg-primary-100 text-primary-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Class Schedule</h2>
        
        <div className="flex space-x-2">
          <Button 
            variant={view === 'day' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setView('day')}
          >
            Day
          </Button>
          <Button 
            variant={view === 'week' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button 
            variant={view === 'month' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button 
            variant={view === 'agenda' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setView('agenda')}
          >
            List
          </Button>
        </div>
      </div>
      
      <Card>
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="large" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No classes scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any classes scheduled for this period.
            </p>
          </div>
        ) : (
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              view={view}
              onView={setView}
            />
          </div>
        )}
      </Card>
      
      {/* Class Details Modal */}
      <Modal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        title={selectedClass ? `Class: ${selectedClass.subject || 'Unnamed Class'}` : 'Class Details'}
        footer={
          <Button variant="outline" onClick={() => setShowClassModal(false)}>
            Close
          </Button>
        }
      >
        {selectedClass && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <FiCalendar className="mr-2" />
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{formatDate(selectedClass.date)}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2" />
                  <span className="font-medium">Time:</span>
                  <span className="ml-2">{formatTime(selectedClass.date)}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <FiUser className="mr-2" />
                  <span className="font-medium">Faculty:</span>
                  <span className="ml-2">{selectedClass.faculty_name || 'Not specified'}</span>
                </div>
              </div>
              
              <div>
                <div className="mb-2">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedClass.status)}`}>
                    {selectedClass.status === 'not_completed' ? 'Scheduled' : selectedClass.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="mb-2">
                  <span className="font-medium text-gray-600">Duration:</span>
                  <span className="ml-2">{selectedClass.duration || 1} hour(s)</span>
                </div>
              </div>
            </div>
            
            {selectedClass.topic && (
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Topic:</h3>
                <p className="text-gray-600">{selectedClass.topic}</p>
              </div>
            )}
            
            {selectedClass.notes && (
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Notes:</h3>
                <p className="text-gray-600">{selectedClass.notes}</p>
              </div>
            )}
            
            {selectedClass.status === 'cancelled' && (
              <div className="bg-error-50 p-3 rounded-md">
                <h3 className="font-medium text-error-800 mb-1">Class Cancellation:</h3>
                <p className="text-error-700">
                  This class has been cancelled. {selectedClass.notes && `Reason: ${selectedClass.notes}`}
                </p>
              </div>
            )}
            
            {selectedClass.status === 'rescheduled' && selectedClass.rescheduled_to && (
              <div className="bg-accent-50 p-3 rounded-md">
                <h3 className="font-medium text-accent-800 mb-1">Rescheduled Information:</h3>
                <p className="text-accent-700">
                  This class has been rescheduled to {formatDate(selectedClass.rescheduled_to)} at {formatTime(selectedClass.rescheduled_to)}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClassSchedule;