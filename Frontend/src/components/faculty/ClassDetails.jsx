import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUsers, FiBook, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Button from '../common/Button';
import Card from "../common/Card"; // or wherever it’s located
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import facultyService from '../../services/facultyService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';



const ClassDetails = ({ classId, onClose, onUpdate }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  // Form states
  const [completeForm, setCompleteForm] = useState({ topic: '', notes: '' });
  const [cancelForm, setCancelForm] = useState({ reason: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ 
    new_date: new Date(), 
    notes: '' 
  });

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      
      // Use the classes endpoint with a filter to get the specific class
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const response = await facultyService.getFacultyClasses(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
      
      // Find the specific class by ID
      const specificClass = response.classes.find(c => c._id === classId);
      
      if (specificClass) {
        setClassData(specificClass);
        
        // Pre-fill forms with existing data
        setCompleteForm({
          topic: specificClass.topic || '',
          notes: specificClass.notes || ''
        });
        
        setCancelForm({
          reason: ''
        });
        
        // Set reschedule date to current class time + 1 day
        const classDate = new Date(specificClass.date);
        const newDate = new Date(classDate);
        newDate.setDate(newDate.getDate() + 1);
        
        setRescheduleForm({
          new_date: newDate,
          notes: ''
        });
      } else {
        showError('Class not found');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      showError('Failed to load class details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await facultyService.markClassComplete(classId, completeForm.topic, completeForm.notes);
      
      showSuccess('Class marked as completed successfully');
      
      if (onUpdate) {
        onUpdate();
      }
      
      setShowCompleteModal(false);
      onClose();
    } catch (error) {
      console.error('Error marking class as complete:', error);
      showError('Failed to mark class as completed');
    }
  };

  const handleCancelClass = async () => {
    try {
      await facultyService.cancelClass(classId, cancelForm.reason);
      
      showSuccess('Class cancelled successfully');
      
      if (onUpdate) {
        onUpdate();
      }
      
      setShowCancelModal(false);
      onClose();
    } catch (error) {
      console.error('Error cancelling class:', error);
      showError('Failed to cancel class');
    }
  };

  const handleRescheduleClass = async () => {
    try {
      // Convert date to ISO string for API
      const newDateIso = rescheduleForm.new_date.toISOString();
      
      await facultyService.rescheduleClass(classId, newDateIso, rescheduleForm.notes);
      
      showSuccess('Class rescheduled successfully');
      
      if (onUpdate) {
        onUpdate();
      }
      
      setShowRescheduleModal(false);
      onClose();
    } catch (error) {
      console.error('Error rescheduling class:', error);
      showError(error.error || 'Failed to reschedule class');
    }
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

  if (loading) {
    return (
      <Card className="h-full">
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      </Card>
    );
  }

  if (!classData) {
    return (
      <Card className="h-full">
        <div className="text-center py-10">
          <p className="text-gray-500">Class not found</p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    );
  }

  const isCompletable = classData.status !== 'completed' && classData.status !== 'cancelled';
  const isCancellable = classData.status !== 'completed' && classData.status !== 'cancelled';
  const isReschedulable = classData.status !== 'completed' && classData.status !== 'cancelled';

  return (
    <Card 
      title={`Class: ${classData.subject || 'Unnamed Class'}`}
      icon={<FiBook />}
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex space-x-2">
            {isReschedulable && (
              <Button 
                variant="accent" 
                icon={<FiCalendar />}
                onClick={() => setShowRescheduleModal(true)}
              >
                Reschedule
              </Button>
            )}
            
            {isCancellable && (
              <Button 
                variant="error" 
                icon={<FiXCircle />}
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Class
              </Button>
            )}
            
            {isCompletable && (
              <Button 
                variant="success" 
                icon={<FiCheckCircle />}
                onClick={() => setShowCompleteModal(true)}
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <FiCalendar className="mr-2" />
              <span className="font-medium">Date:</span>
              <span className="ml-2">{formatDate(classData.date)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <FiClock className="mr-2" />
              <span className="font-medium">Time:</span>
              <span className="ml-2">{formatTime(classData.date)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <FiUsers className="mr-2" />
              <span className="font-medium">Group:</span>
              <span className="ml-2">{classData.group_id || 'Not specified'}</span>
            </div>
          </div>
          
          <div>
            <div className="mb-2">
              <span className="font-medium text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                classData.status === 'completed' ? 'bg-success-100 text-success-800' :
                classData.status === 'cancelled' ? 'bg-error-100 text-error-800' :
                classData.status === 'rescheduled' ? 'bg-accent-100 text-accent-800' :
                'bg-primary-100 text-primary-800'
              }`}>
                {classData.status === 'not_completed' ? 'Scheduled' : classData.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="mb-2">
              <span className="font-medium text-gray-600">Duration:</span>
              <span className="ml-2">{classData.duration || 1} hour(s)</span>
            </div>
          </div>
        </div>
        
        {classData.topic && (
          <div>
            <h3 className="font-medium text-gray-800 mb-1">Topic:</h3>
            <p className="text-gray-600">{classData.topic}</p>
          </div>
        )}
        
        {classData.notes && (
          <div>
            <h3 className="font-medium text-gray-800 mb-1">Notes:</h3>
            <p className="text-gray-600">{classData.notes}</p>
          </div>
        )}
        
        {classData.status === 'rescheduled' && classData.rescheduled_to && (
          <div className="bg-accent-50 p-3 rounded-md">
            <h3 className="font-medium text-accent-800 mb-1">Rescheduled Information:</h3>
            <p className="text-accent-700">
              This class has been rescheduled to {formatDate(classData.rescheduled_to)} at {formatTime(classData.rescheduled_to)}
            </p>
          </div>
        )}
      </div>
      
      {/* Mark Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Mark Class as Completed"
        footer={
          <Modal.Footer.Confirm
            onConfirm={handleMarkComplete}
            onCancel={() => setShowCompleteModal(false)}
            confirmText="Mark Complete"
            confirmVariant="success"
          />
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="topic">Topic Covered</label>
            <input
              id="topic"
              type="text"
              className="input"
              value={completeForm.topic}
              onChange={(e) => setCompleteForm({ ...completeForm, topic: e.target.value })}
              placeholder="Enter the topic covered in class"
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="notes">Additional Notes (Optional)</label>
            <textarea
              id="notes"
              className="input h-32"
              value={completeForm.notes}
              onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
              placeholder="Add any notes about the class"
            />
          </div>
        </div>
      </Modal>
      
      {/* Cancel Class Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Class"
        footer={
          <Modal.Footer.Delete
            onDelete={handleCancelClass}
            onCancel={() => setShowCancelModal(false)}
            deleteText="Cancel Class"
          />
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this class? This action cannot be undone.
          </p>
          
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-yellow-700 text-sm">
              Note: Cancelling this class will notify all students in the group.
            </p>
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="reason">Reason for Cancellation</label>
            <textarea
              id="reason"
              className="input h-32"
              value={cancelForm.reason}
              onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
              placeholder="Provide a reason for cancelling the class"
              required
            />
          </div>
        </div>
      </Modal>
      
      {/* Reschedule Class Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Class"
        footer={
          <Modal.Footer.Confirm
            onConfirm={handleRescheduleClass}
            onCancel={() => setShowRescheduleModal(false)}
            confirmText="Reschedule"
            confirmVariant="primary"
          />
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please select a new date and time for this class.
          </p>
          
          <div className="form-group">
            <label className="label" htmlFor="new_date">New Date and Time</label>
            <DatePicker
              id="new_date"
              className="input w-full"
              selected={rescheduleForm.new_date}
              onChange={(date) => setRescheduleForm({ ...rescheduleForm, new_date: date })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="notes">Reason for Rescheduling (Optional)</label>
            <textarea
              id="notes"
              className="input h-24"
              value={rescheduleForm.notes}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
              placeholder="Provide a reason for rescheduling"
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            <p>
              Note: Rescheduling this class will notify all students in the group.
              Make sure the new time doesn't conflict with other classes or activities.
            </p>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ClassDetails;