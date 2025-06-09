import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUser, FiMessageSquare, FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import studentService from '../../services/studentService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const MeetingRequest = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  
  // New meeting form state
  const [meetingForm, setMeetingForm] = useState({
    faculty_id: '',
    preferred_time: new Date(),
    duration: 30,
    reason: ''
  });

  useEffect(() => {
    fetchMeetings();
    fetchFacultyList();
  }, []);

  const fetchMeetings = async () => {
    try {
      setMeetingsLoading(true);
      const response = await studentService.getStudentMeetings();
      setMeetings(response.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showError('Failed to load meeting requests');
    } finally {
      setMeetingsLoading(false);
      setLoading(false);
    }
  };

  const fetchFacultyList = async () => {
    try {
      setFacultyLoading(true);
      // Fetch faculty list from the API
      const response = await studentService.getAllFacultyMembers();
      
      if (response && response.faculty) {
        setFacultyList(response.faculty);
      } else {
        // Fallback to mock data if API fails
        const mockFacultyList = [
          { _id: 'faculty1', name: 'Prof. John Smith', department: 'Computer Science' },
          { _id: 'faculty2', name: 'Prof. Jane Doe', department: 'Mathematics' },
          { _id: 'faculty3', name: 'Prof. Mark Johnson', department: 'Physics' }
        ];
        setFacultyList(mockFacultyList);
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error);
      showError('Failed to load faculty list');
      
      // Set a mock faculty list as fallback
      const mockFacultyList = [
        { _id: 'faculty1', name: 'Prof. John Smith', department: 'Computer Science' },
        { _id: 'faculty2', name: 'Prof. Jane Doe', department: 'Mathematics' },
        { _id: 'faculty3', name: 'Prof. Mark Johnson', department: 'Physics' }
      ];
      setFacultyList(mockFacultyList);
    } finally {
      setFacultyLoading(false);
      setLoading(false);
    }
  };

  const fetchFacultyAvailability = async (facultyId) => {
    try {
      setLoadingAvailability(true);
      const response = await studentService.getFacultyAvailability(facultyId);
      setAvailableSlots(response.available_slots || []);
      setSelectedFaculty(response.faculty_name || 'Faculty');
    } catch (error) {
      console.error('Error fetching faculty availability:', error);
      showError('Failed to load faculty availability');
      setAvailableSlots([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      if (!meetingForm.faculty_id) {
        showError('Please select a faculty member');
        return;
      }
      
      if (!meetingForm.reason) {
        showError('Please enter a reason for the meeting');
        return;
      }
      
      const meetingData = {
        ...meetingForm,
        preferred_time: meetingForm.preferred_time.toISOString()
      };
      
      await studentService.requestMeeting(meetingData);
      
      showSuccess('Meeting request submitted successfully');
      
      // Refresh meetings list
      fetchMeetings();
      setShowNewMeetingModal(false);
      
      // Reset form
      setMeetingForm({
        faculty_id: '',
        preferred_time: new Date(),
        duration: 30,
        reason: ''
      });
    } catch (error) {
      console.error('Error creating meeting request:', error);
      showError(error.error || 'Failed to submit meeting request');
    }
  };

  const handleCancelMeeting = async () => {
    if (!selectedMeeting) return;
    
    try {
      await studentService.cancelMeeting(selectedMeeting._id);
      
      showSuccess('Meeting cancelled successfully');
      
      // Refresh meetings list
      fetchMeetings();
      setShowConfirmCancelModal(false);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      showError('Failed to cancel meeting');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-accent-100 text-accent-800';
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-error-100 text-error-800';
      case 'completed':
        return 'bg-primary-100 text-primary-800';
      case 'cancelled':
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Meeting Requests</h2>
        
        <Button 
          onClick={() => setShowNewMeetingModal(true)}
          icon={<FiPlus />}
        >
          New Meeting Request
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="large" />
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No meeting requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new meeting request with a faculty member.
            </p>
            <div className="mt-6">
              <Button 
                onClick={() => setShowNewMeetingModal(true)}
                icon={<FiPlus />}
              >
                New Meeting Request
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {meetings.map((meeting) => (
            <Card key={meeting._id}>
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-primary-100 text-primary-800">
                    <FiUser size={20} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{meeting.faculty_name || 'Faculty'}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(meeting.preferred_time)} at {formatTime(meeting.preferred_time)}
                    </p>
                    <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(meeting.status)}`}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  {meeting.status === 'pending' && (
                    <Button 
                      variant="error" 
                      size="sm" 
                      icon={<FiTrash />}
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowConfirmCancelModal(true);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-800">Reason for meeting:</h4>
                <p className="text-sm text-gray-600 mt-1">{meeting.reason || 'No reason provided'}</p>
              </div>
              
              {meeting.response_message && (
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-800">Faculty response:</h4>
                  <p className="text-sm text-gray-600 mt-1">{meeting.response_message}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* New Meeting Modal */}
      <Modal
        isOpen={showNewMeetingModal}
        onClose={() => setShowNewMeetingModal(false)}
        title="Request a New Meeting"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNewMeetingModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMeeting}
              disabled={!meetingForm.faculty_id || !meetingForm.reason}
            >
              Submit Request
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="faculty_id">Faculty Member</label>
            {facultyLoading ? (
              <div className="flex items-center space-x-2 h-10 mb-2">
                <Spinner size="small" />
                <span className="text-sm text-gray-500">Loading faculty list...</span>
              </div>
            ) : (
              <select
                id="faculty_id"
                className="input"
                value={meetingForm.faculty_id}
                onChange={(e) => {
                  setMeetingForm({ ...meetingForm, faculty_id: e.target.value });
                  if (e.target.value) {
                    fetchFacultyAvailability(e.target.value);
                  } else {
                    setAvailableSlots([]);
                    setSelectedFaculty(null);
                  }
                }}
                required
              >
                <option value="">Select a faculty member</option>
                {facultyList.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.name}{faculty.department && ` - ${faculty.department}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="preferred_time">Preferred Time</label>
            <DatePicker
              id="preferred_time"
              className="input w-full"
              selected={meetingForm.preferred_time}
              onChange={(date) => setMeetingForm({ ...meetingForm, preferred_time: date })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              placeholderText="Select date and time"
              required
            />
            
            {loadingAvailability && (
              <div className="mt-2 flex items-center space-x-2">
                <Spinner size="small" />
                <span className="text-sm text-gray-500">Loading availability...</span>
              </div>
            )}
            
            {availableSlots.length > 0 && selectedFaculty && !loadingAvailability && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-800">Available slots for {selectedFaculty}:</h4>
                <div className="mt-1 max-h-40 overflow-y-auto">
                  <ul className="text-sm">
                    {availableSlots.map((slot, index) => (
                      <li 
                        key={index} 
                        className="p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          const [hours, minutes] = slot.time.split(':');
                          const date = new Date(slot.date);
                          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          setMeetingForm({ ...meetingForm, preferred_time: date });
                        }}
                      >
                        {slot.day}, {slot.date} at {slot.time}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {availableSlots.length === 0 && selectedFaculty && !loadingAvailability && (
              <div className="mt-2 text-sm text-error-600">
                No available slots found for this faculty member.
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="duration">Duration (minutes)</label>
            <select
              id="duration"
              className="input"
              value={meetingForm.duration}
              onChange={(e) => setMeetingForm({ ...meetingForm, duration: parseInt(e.target.value) })}
              required
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="reason">Reason for Meeting</label>
            <textarea
              id="reason"
              className="input h-32"
              value={meetingForm.reason}
              onChange={(e) => setMeetingForm({ ...meetingForm, reason: e.target.value })}
              placeholder="Explain the purpose of this meeting"
              required
            />
          </div>
        </div>
      </Modal>
      
      {/* Cancel Meeting Confirmation Modal */}
      <Modal
        isOpen={showConfirmCancelModal}
        onClose={() => setShowConfirmCancelModal(false)}
        title="Cancel Meeting Request"
        footer={
          <Modal.Footer.Delete
            onDelete={handleCancelMeeting}
            onCancel={() => setShowConfirmCancelModal(false)}
            deleteText="Cancel Meeting"
          />
        }
      >
        <p className="text-gray-600">
          Are you sure you want to cancel this meeting request? This action cannot be undone.
        </p>
        
        {selectedMeeting && (
          <div className="mt-4 bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-800">
              <span className="font-medium">Faculty:</span> {selectedMeeting.faculty_name}
            </p>
            <p className="text-sm text-gray-800">
              <span className="font-medium">Date/Time:</span> {formatDate(selectedMeeting.preferred_time)} at {formatTime(selectedMeeting.preferred_time)}
            </p>
            <p className="text-sm text-gray-800">
              <span className="font-medium">Reason:</span> {selectedMeeting.reason}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingRequest;