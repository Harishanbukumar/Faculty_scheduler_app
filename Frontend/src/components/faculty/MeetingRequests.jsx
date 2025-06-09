import React, { useState, useEffect } from 'react';
import { FiUser, FiClock, FiMessageSquare, FiCheck, FiX, FiFilter } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import facultyService from '../../services/facultyService';

const MeetingRequests = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [responseStatus, setResponseStatus] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    // Apply filter when meetings or filter changes
    if (meetings.length > 0) {
      if (statusFilter === 'all') {
        setFilteredMeetings(meetings);
      } else {
        setFilteredMeetings(meetings.filter(meeting => meeting.status === statusFilter));
      }
    }
  }, [meetings, statusFilter]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await facultyService.getFacultyMeetings();
      setMeetings(response.meetings || []);
      
      // Apply initial filter
      if (response.meetings && response.meetings.length > 0) {
        if (statusFilter === 'all') {
          setFilteredMeetings(response.meetings);
        } else {
          setFilteredMeetings(response.meetings.filter(m => m.status === statusFilter));
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showError('Failed to load meeting requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseModal = (meeting, initialStatus) => {
    setSelectedMeeting(meeting);
    setResponseStatus(initialStatus);
    setResponseMessage('');
    setShowRespondModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedMeeting || !responseStatus) return;
    
    try {
      await facultyService.respondToMeeting(
        selectedMeeting._id,
        responseStatus,
        responseMessage
      );
      
      showSuccess(`Meeting ${responseStatus} successfully`);
      
      // Refresh meetings list
      fetchMeetings();
      setShowRespondModal(false);
    } catch (error) {
      console.error('Error responding to meeting:', error);
      showError(error.error || 'Failed to respond to meeting request');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
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
        
        <div className="flex space-x-2 items-center">
          <span className="text-sm text-gray-500">Filter:</span>
          <select
            className="input py-1 px-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="large" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No meeting requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'pending' 
                ? 'You have no pending meeting requests.' 
                : statusFilter === 'all'
                  ? 'You have no meeting requests.'
                  : `You have no ${statusFilter} meeting requests.`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting._id}>
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-primary-100 text-primary-800">
                    <FiUser size={20} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{meeting.student_name || 'Student'}</h3>
                    <p className="text-sm text-gray-500">
                      {meeting.student_reg_number || meeting.registration_number || 'No registration number'}
                    </p>
                    <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(meeting.status)}`}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 md:ml-6">
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center mb-1">
                      <FiClock className="mr-1" />
                      <span>{formatDate(meeting.preferred_time)} at {formatTime(meeting.preferred_time)}</span>
                    </div>
                    <div className="flex items-center">
                      <FiMessageSquare className="mr-1" />
                      <span>Duration: {meeting.duration || 30} minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-800">Reason for meeting:</h4>
                <p className="text-sm text-gray-600 mt-1">{meeting.reason || 'No reason provided'}</p>
              </div>
              
              {meeting.status === 'pending' && (
                <div className="mt-4 flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    icon={<FiX />} 
                    onClick={() => handleOpenResponseModal(meeting, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="success" 
                    icon={<FiCheck />}
                    onClick={() => handleOpenResponseModal(meeting, 'approved')}
                  >
                    Approve
                  </Button>
                </div>
              )}
              
              {meeting.status === 'approved' && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="primary" 
                    icon={<FiCheck />}
                    onClick={() => handleOpenResponseModal(meeting, 'completed')}
                  >
                    Mark as Completed
                  </Button>
                </div>
              )}
              
              {meeting.response_message && (
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-800">Your response:</h4>
                  <p className="text-sm text-gray-600 mt-1">{meeting.response_message}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Response Modal */}
      <Modal
        isOpen={showRespondModal}
        onClose={() => setShowRespondModal(false)}
        title={
          responseStatus === 'approved' ? 'Approve Meeting Request' :
          responseStatus === 'rejected' ? 'Reject Meeting Request' :
          responseStatus === 'completed' ? 'Mark Meeting as Completed' : 'Respond to Meeting'
        }
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRespondModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={
                responseStatus === 'approved' ? 'success' :
                responseStatus === 'rejected' ? 'error' :
                'primary'
              } 
              onClick={handleSubmitResponse}
            >
              Confirm
            </Button>
          </div>
        }
      >
        {selectedMeeting && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm">
                <p className="font-medium text-gray-800">Student: {selectedMeeting.student_name}</p>
                <p className="text-gray-600">
                  Time: {formatDate(selectedMeeting.preferred_time)} at {formatTime(selectedMeeting.preferred_time)}
                </p>
                <p className="text-gray-600">Duration: {selectedMeeting.duration || 30} minutes</p>
                <p className="text-gray-600 mt-2">Reason: {selectedMeeting.reason || 'No reason provided'}</p>
              </div>
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="response_message">
                {responseStatus === 'rejected' ? 'Reason for rejection (optional):' :
                 responseStatus === 'approved' ? 'Additional information (optional):' :
                 'Notes about the meeting (optional):'}
              </label>
              <textarea
                id="response_message"
                className="input h-24"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder={
                  responseStatus === 'rejected' ? 'Let the student know why you cannot meet' :
                  responseStatus === 'approved' ? 'Include any additional information for the student' :
                  'Add any notes about the meeting'
                }
              />
            </div>
            
            {responseStatus === 'approved' && (
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                <p>
                  Approving this meeting will add it to your calendar. Make sure the time does not conflict with your other commitments.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingRequests;