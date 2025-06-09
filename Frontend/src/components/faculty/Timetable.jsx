import React, { useState, useEffect } from 'react';
import { FiEdit, FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useToast } from '../../context/ToastContext';
import useApi from '../../hooks/useApi';
import facultyService from '../../services/facultyService';

const Timetable = () => {
  const { showSuccess, showError } = useToast();
  const { loading, get, post, put } = useApi();
  const [timetable, setTimetable] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [slotData, setSlotData] = useState({
    subject: '',
    group_id: '',
    duration: 1,
    topic: ''
  });

  // Days array
  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  // Periods array (9 AM to 5 PM)
  const periods = Array.from({ length: 9 }, (_, i) => {
    const hour = i + 9;
    return { 
      key: hour.toString(), 
      label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    };
  });

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await facultyService.getFacultyTimetable();
      if (response.timetable) {
        setTimetable(response.timetable);
      } else {
        // Initialize empty timetable if none exists
        initializeEmptyTimetable();
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      showError('Failed to load timetable data');
      initializeEmptyTimetable();
    }
  };

  const initializeEmptyTimetable = () => {
    const emptyTimetable = {
      weekly_schedule: {}
    };
    
    days.forEach(day => {
      emptyTimetable.weekly_schedule[day.key] = {};
    });
    
    setTimetable(emptyTimetable);
  };

  const handleSaveTimetable = async () => {
    try {
      let response;
      
      if (timetable._id) {
        // Update existing timetable
        response = await facultyService.updateTimetable(timetable.weekly_schedule);
        showSuccess('Timetable updated successfully');
      } else {
        // Create new timetable
        response = await facultyService.createTimetable(timetable.weekly_schedule);
        showSuccess('Timetable created successfully');
      }
      
      setTimetable(response.timetable);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving timetable:', error);
      showError('Failed to save timetable');
    }
  };

  const handleAddSlot = (day, period) => {
    // Initialize empty slot if needed
    const initialData = 
      timetable.weekly_schedule[day][period] || 
      { subject: '', group_id: '', duration: 1, topic: '' };
    
    setSelectedDay(day);
    setSelectedPeriod(period);
    setSlotData(initialData);
    setShowSlotModal(true);
  };

  const handleSlotSave = async () => {
    try {
      // Update timetable state first
      const updatedTimetable = { ...timetable };
      updatedTimetable.weekly_schedule[selectedDay][selectedPeriod] = slotData;
      setTimetable(updatedTimetable);
      
      // Save to server
      if (timetable._id) {
        await facultyService.updateTimetableSlot(selectedDay, selectedPeriod, slotData);
        showSuccess('Slot updated successfully');
      }
      
      setShowSlotModal(false);
    } catch (error) {
      console.error('Error saving slot:', error);
      showError('Failed to save slot data');
    }
  };

  const handleDeleteSlot = (day, period) => {
    const updatedTimetable = { ...timetable };
    if (updatedTimetable.weekly_schedule[day][period]) {
      delete updatedTimetable.weekly_schedule[day][period];
      setTimetable(updatedTimetable);
      
      // If we have an ID, update on server
      if (timetable._id) {
        facultyService.updateTimetableSlot(day, period, {})
          .then(() => showSuccess('Slot removed successfully'))
          .catch(err => {
            console.error('Error removing slot:', err);
            showError('Failed to remove slot');
          });
      }
    }
  };

  const renderSlotContent = (day, period) => {
    const slot = timetable?.weekly_schedule[day][period];
    
    if (!slot) {
      return (
        <div className="h-full flex items-center justify-center">
          <button 
            onClick={() => editMode && handleAddSlot(day, period)}
            className={`text-gray-400 ${!editMode && 'hidden'}`}
          >
            <FiPlus size={18} />
          </button>
        </div>
      );
    }
    
    return (
      <div className="p-2">
        <div className="font-medium text-sm">{slot.subject}</div>
        {slot.group_id && <div className="text-xs text-gray-500">Group: {slot.group_id}</div>}
        {slot.duration > 1 && <div className="text-xs text-gray-500">Duration: {slot.duration}h</div>}
        
        {editMode && (
          <div className="absolute top-1 right-1 flex space-x-1">
            <button 
              onClick={() => handleAddSlot(day, period)}
              className="p-1 text-primary-500 hover:bg-primary-50 rounded"
            >
              <FiEdit size={14} />
            </button>
            <button 
              onClick={() => handleDeleteSlot(day, period)}
              className="p-1 text-error-500 hover:bg-error-50 rounded"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading && !timetable) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card 
        title="Weekly Timetable" 
        icon={<FiCalendar />}
        footer={
          <div className="flex justify-end space-x-2">
            {editMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    fetchTimetable();
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveTimetable}>Save Timetable</Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>Edit Timetable</Button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-50 w-20"></th>
                {days.map(day => (
                  <th key={day.key} className="p-2 border bg-gray-50">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period.key}>
                  <td className="p-2 border bg-gray-50 text-center font-medium">
                    {period.label}
                  </td>
                  {days.map(day => (
                    <td 
                      key={`${day.key}-${period.key}`} 
                      className="p-0 border bg-white h-16 relative"
                    >
                      {timetable && renderSlotContent(day.key, period.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slot Edit Modal */}
      <Modal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        title={`${selectedDay ? selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1) : ''} - ${
          selectedPeriod ? `${parseInt(selectedPeriod) > 12 ? parseInt(selectedPeriod) - 12 : selectedPeriod}:00 ${parseInt(selectedPeriod) >= 12 ? 'PM' : 'AM'}` : ''
        }`}
        footer={
          <Modal.Footer.Confirm
            onConfirm={handleSlotSave}
            onCancel={() => setShowSlotModal(false)}
          />
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              className="input"
              value={slotData.subject}
              onChange={(e) => setSlotData({ ...slotData, subject: e.target.value })}
              placeholder="Enter subject name"
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="group_id">Group ID</label>
            <input
              id="group_id"
              type="text"
              className="input"
              value={slotData.group_id}
              onChange={(e) => setSlotData({ ...slotData, group_id: e.target.value })}
              placeholder="Enter group ID"
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="duration">Duration (hours)</label>
            <select
              id="duration"
              className="input"
              value={slotData.duration}
              onChange={(e) => setSlotData({ ...slotData, duration: parseInt(e.target.value) })}
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="topic">Topic (optional)</label>
            <input
              id="topic"
              type="text"
              className="input"
              value={slotData.topic || ''}
              onChange={(e) => setSlotData({ ...slotData, topic: e.target.value })}
              placeholder="Enter topic"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;