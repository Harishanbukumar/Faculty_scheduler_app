import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiCalendar } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import facultyService from '../../services/facultyService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Set up the calendar localizer
const localizer = momentLocalizer(moment);

const ActivityCalendar = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [classes, setClasses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [calendarView, setCalendarView] = useState('week');

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    activity_type: 'meeting',
    title: '',
    description: '',
    start_time: new Date(),
    end_time: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour from now
  });

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      // Get date ranges for the calendar (current month with padding)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch activities
      const activitiesResponse = await facultyService.getFacultyActivities(startDateStr, endDateStr);
      
      // Fetch classes
      const classesResponse = await facultyService.getFacultyClasses(startDateStr, endDateStr);
      
      // Fetch meetings
      const meetingsResponse = await facultyService.getFacultyMeetings('approved', startDateStr, endDateStr);
      
      // Fetch holidays
      const holidaysResponse = await facultyService.getHolidays(startDateStr, endDateStr);
      
      // Update state
      setActivities(activitiesResponse.activities || []);
      setClasses(classesResponse.classes || []);
      setMeetings(meetingsResponse.meetings || []);
      setHolidays(holidaysResponse.holidays || []);
      
      // Combine all calendar events
      buildCalendarEvents(
        activitiesResponse.activities || [],
        classesResponse.classes || [],
        meetingsResponse.meetings || [],
        holidaysResponse.holidays || []
      );
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      showError(error.error || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const buildCalendarEvents = (activities, classes, meetings, holidays) => {
    const allEvents = [];
    
    // Add activities
    activities.forEach(activity => {
      if (activity.start_time && activity.end_time) {
        allEvents.push({
          id: activity._id,
          title: activity.title || 'Untitled Activity',
          start: new Date(activity.start_time),
          end: new Date(activity.end_time),
          type: 'activity',
          activity_type: activity.activity_type,
          description: activity.description,
          resource: activity
        });
      }
    });
    
    // Add classes
    classes.forEach(cls => {
      if (cls.date) {
        allEvents.push({
          id: cls._id,
          title: `Class: ${cls.subject || 'Unnamed Class'}`,
          start: new Date(cls.date),
          end: new Date(new Date(cls.date).getTime() + (cls.duration || 1) * 60 * 60 * 1000),
          type: 'class',
          status: cls.status,
          resource: cls
        });
      }
    });
    
    // Add meetings
    meetings.forEach(meeting => {
      if (meeting.preferred_time) {
        allEvents.push({
          id: meeting._id,
          title: `Meeting with ${meeting.student_name || 'Student'}`,
          start: new Date(meeting.preferred_time),
          end: new Date(new Date(meeting.preferred_time).getTime() + (meeting.duration || 30) * 60 * 1000),
          type: 'meeting',
          resource: meeting
        });
      }
    });
    
    // Add holidays
    holidays.forEach(holiday => {
      if (holiday.date) {
        const holidayDate = new Date(holiday.date);
        const nextDay = new Date(holidayDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        allEvents.push({
          id: holiday._id,
          title: `Holiday: ${holiday.name}`,
          start: holidayDate,
          end: nextDay,
          allDay: true,
          type: 'holiday',
          resource: holiday
        });
      }
    });
    
    setEvents(allEvents);
  };

  const handleEventClick = (event) => {
    if (event.type === 'activity') {
      setSelectedActivity(event.resource);
      
      if (event.resource.start_time && event.resource.end_time) {
        setActivityForm({
          activity_type: event.resource.activity_type || 'meeting',
          title: event.resource.title || '',
          description: event.resource.description || '',
          start_time: new Date(event.resource.start_time),
          end_time: new Date(event.resource.end_time),
        });
      }
      
      setShowActivityModal(true);
    }
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    
    // Initialize new activity form
    setSelectedActivity(null);
    setActivityForm({
      activity_type: 'meeting',
      title: '',
      description: '',
      start_time: start,
      end_time: new Date(start.getTime() + 60 * 60 * 1000), // 1 hour from start
    });
    
    setShowActivityModal(true);
  };

  const validateActivityForm = () => {
    if (!activityForm.title.trim()) {
      showError('Activity title is required');
      return false;
    }
    
    if (!activityForm.start_time || !activityForm.end_time) {
      showError('Start and end times are required');
      return false;
    }
    
    if (activityForm.start_time >= activityForm.end_time) {
      showError('End time must be after start time');
      return false;
    }
    
    return true;
  };

  const handleCreateActivity = async () => {
    try {
      if (!validateActivityForm()) return;
      
      const activityData = {
        ...activityForm,
        start_time: activityForm.start_time.toISOString(),
        end_time: activityForm.end_time.toISOString()
      };
      
      if (selectedActivity) {
        // Update existing activity
        await facultyService.updateActivity(selectedActivity._id, activityData);
        showSuccess('Activity updated successfully');
      } else {
        // Create new activity
        await facultyService.createActivity(activityData);
        showSuccess('Activity created successfully');
      }
      
      // Refresh calendar data
      fetchCalendarData();
      setShowActivityModal(false);
    } catch (error) {
      console.error('Error saving activity:', error);
      showError(error.error || 'Failed to save activity');
    }
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;
    
    try {
      await facultyService.deleteActivity(selectedActivity._id);
      showSuccess('Activity deleted successfully');
      
      // Refresh calendar data
      fetchCalendarData();
      setShowActivityModal(false);
      setConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting activity:', error);
      showError(error.error || 'Failed to delete activity');
    }
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
    } else if (event.type === 'holiday') {
      style.backgroundColor = '#6B7280'; // gray-500
    } else if (event.type === 'activity') {
      switch (event.activity_type) {
        case 'meeting':
          style.backgroundColor = '#F59E0B'; // amber-500
          break;
        case 'paper_correction':
          style.backgroundColor = '#EC4899'; // pink-500
          break;
        case 'administrative':
          style.backgroundColor = '#6366F1'; // indigo-500
          break;
        case 'research':
          style.backgroundColor = '#14B8A6'; // teal-500
          break;
        default:
          style.backgroundColor = '#F59E0B'; // amber-500
          break;
      }
    }
    
    return { style };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Activity Calendar</h2>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={calendarView === 'month' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setCalendarView('month')}
          >
            Month
          </Button>
          <Button 
            variant={calendarView === 'week' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setCalendarView('week')}
          >
            Week
          </Button>
          <Button 
            variant={calendarView === 'day' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setCalendarView('day')}
          >
            Day
          </Button>
          <Button 
            variant={calendarView === 'agenda' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setCalendarView('agenda')}
          >
            Agenda
          </Button>
        </div>
      </div>
      
      <Card 
        footer={
          <Button 
            onClick={() => {
              setSelectedActivity(null);
              setActivityForm({
                activity_type: 'meeting',
                title: '',
                description: '',
                start_time: new Date(),
                end_time: new Date(new Date().getTime() + 60 * 60 * 1000),
              });
              setShowActivityModal(true);
            }}
            icon={<FiPlus />}
          >
            Add Activity
          </Button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="large" />
          </div>
        ) : (
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectEvent={handleEventClick}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter}
              view={calendarView}
              onView={setCalendarView}
              views={['month', 'week', 'day', 'agenda']}
            />
          </div>
        )}
      </Card>

      {/* Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title={selectedActivity ? 'Edit Activity' : 'Create New Activity'}
        footer={confirmDelete ? (
          <Modal.Footer.Delete 
            onDelete={handleDeleteActivity} 
            onCancel={() => setConfirmDelete(false)} 
          />
        ) : (
          <div className="flex justify-between w-full">
            <div>
              {selectedActivity && (
                <Button 
                  variant="error" 
                  onClick={() => setConfirmDelete(true)}
                  icon={<FiTrash2 />}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowActivityModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateActivity}>
                {selectedActivity ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="activity_type">Activity Type</label>
            <select
              id="activity_type"
              className="input"
              value={activityForm.activity_type}
              onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
            >
              <option value="meeting">Meeting</option>
              <option value="paper_correction">Paper Correction</option>
              <option value="administrative">Administrative</option>
              <option value="research">Research</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="input"
              value={activityForm.title}
              onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              placeholder="Activity title"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              className="input h-24"
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              placeholder="Activity description"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="start_time">Start Time</label>
              <DatePicker
                id="start_time"
                className="input w-full"
                selected={activityForm.start_time}
                onChange={(date) => setActivityForm({ ...activityForm, start_time: date })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
              />
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="end_time">End Time</label>
              <DatePicker
                id="end_time"
                className="input w-full"
                selected={activityForm.end_time}
                onChange={(date) => setActivityForm({ ...activityForm, end_time: date })}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={activityForm.start_time}
                minTime={activityForm.start_time}
                maxTime={new Date(activityForm.start_time).setHours(23, 59, 0, 0)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityCalendar;