import React, { useState, useEffect } from 'react';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const HolidayManagement = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHolidays, setFilteredHolidays] = useState([]);

  // Holiday form state
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: new Date(),
    description: '',
    is_recurring: false
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    // Apply filters and search
    if (holidays.length > 0) {
      let filtered = [...holidays];
      
      // Apply date filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filter === 'upcoming') {
        filtered = filtered.filter(holiday => new Date(holiday.date) >= today);
      } else if (filter === 'past') {
        filtered = filtered.filter(holiday => new Date(holiday.date) < today);
      }
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(holiday =>
          holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          holiday.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Sort by date
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setFilteredHolidays(filtered);
    } else {
      setFilteredHolidays([]);
    }
  }, [holidays, filter, searchTerm]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      
      // Get all holidays for the current year
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1).toISOString().split('T')[0]; // Jan 1
      const endDate = new Date(currentYear, 11, 31).toISOString().split('T')[0]; // Dec 31
      
      const response = await adminService.getHolidays(startDate, endDate);
      setHolidays(response.holidays || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      showError('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHoliday = async () => {
    try {
      if (!holidayForm.name || !holidayForm.date) {
        showError('Holiday name and date are required');
        return;
      }
      
      const holidayData = {
        name: holidayForm.name,
        date: holidayForm.date.toISOString(),
        description: holidayForm.description,
        is_recurring: holidayForm.is_recurring
      };
      
      const response = await adminService.createHoliday(holidayData);
      
      // Add the new holiday to the list
      setHolidays([...holidays, response.holiday]);
      
      showSuccess('Holiday created successfully');
      setShowHolidayModal(false);
      
      // Reset form
      setHolidayForm({
        name: '',
        date: new Date(),
        description: '',
        is_recurring: false
      });
    } catch (error) {
      console.error('Error creating holiday:', error);
      showError('Failed to create holiday');
    }
  };

  const handleUpdateHoliday = async () => {
    try {
      if (!selectedHoliday || !holidayForm.name || !holidayForm.date) {
        showError('Holiday name and date are required');
        return;
      }
      
      const holidayData = {
        name: holidayForm.name,
        date: holidayForm.date.toISOString(),
        description: holidayForm.description,
        is_recurring: holidayForm.is_recurring
      };
      
      const response = await adminService.updateHoliday(selectedHoliday._id, holidayData);
      
      // Update the holiday in the list
      const updatedHolidays = holidays.map(holiday => 
        holiday._id === selectedHoliday._id ? response.holiday : holiday
      );
      
      setHolidays(updatedHolidays);
      
      showSuccess('Holiday updated successfully');
      setShowHolidayModal(false);
      
      // Reset selected holiday
      setSelectedHoliday(null);
    } catch (error) {
      console.error('Error updating holiday:', error);
      showError('Failed to update holiday');
    }
  };

  const handleDeleteHoliday = async () => {
    try {
      if (!selectedHoliday) return;
      
      await adminService.deleteHoliday(selectedHoliday._id);
      
      // Remove the holiday from the list
      const updatedHolidays = holidays.filter(holiday => holiday._id !== selectedHoliday._id);
      setHolidays(updatedHolidays);
      
      showSuccess('Holiday deleted successfully');
      setShowDeleteConfirm(false);
      
      // Reset selected holiday
      setSelectedHoliday(null);
    } catch (error) {
      console.error('Error deleting holiday:', error);
      showError('Failed to delete holiday');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get relative time (e.g., "2 days from now", "3 days ago")
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 0) {
      return `${diffDays} days from now`;
    } else {
      return `${Math.abs(diffDays)} days ago`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Holiday Management</h1>
        
        <Button 
          onClick={() => {
            setSelectedHoliday(null);
            setHolidayForm({
              name: '',
              date: new Date(),
              description: '',
              is_recurring: false
            });
            setShowHolidayModal(true);
          }}
          icon={<FiPlus />}
        >
          Add Holiday
        </Button>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search holidays by name or description"
            icon={<FiSearch />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'upcoming' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === 'past' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="large" />
        </div>
      ) : filteredHolidays.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No holidays found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No holidays match your search criteria.' 
                : filter === 'upcoming'
                  ? 'No upcoming holidays found. Create a new holiday to get started.'
                  : filter === 'past'
                    ? 'No past holidays found.'
                    : 'No holidays found. Create a new holiday to get started.'}
            </p>
            <div className="mt-6">
              <Button 
                onClick={() => {
                  setSelectedHoliday(null);
                  setHolidayForm({
                    name: '',
                    date: new Date(),
                    description: '',
                    is_recurring: false
                  });
                  setShowHolidayModal(true);
                }}
                icon={<FiPlus />}
              >
                Add Holiday
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHolidays.map((holiday) => (
            <Card key={holiday._id}>
              <div className="flex justify-between items-center">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-primary-100 text-primary-800">
                    <FiCalendar size={20} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{holiday.name}</h3>
                    <p className="text-sm text-gray-600">{formatDate(holiday.date)}</p>
                    <p className="text-xs text-gray-500">{getRelativeTime(holiday.date)}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    icon={<FiEdit2 />}
                    onClick={() => {
                      setSelectedHoliday(holiday);
                      setHolidayForm({
                        name: holiday.name,
                        date: new Date(holiday.date),
                        description: holiday.description || '',
                        is_recurring: holiday.is_recurring || false
                      });
                      setShowHolidayModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  
                  <Button 
                    variant="error" 
                    size="sm"
                    icon={<FiTrash2 />}
                    onClick={() => {
                      setSelectedHoliday(holiday);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              {holiday.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{holiday.description}</p>
                </div>
              )}
              
              {holiday.is_recurring && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Recurring yearly
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Holiday Modal */}
      <Modal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title={selectedHoliday ? 'Edit Holiday' : 'Add New Holiday'}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowHolidayModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={selectedHoliday ? handleUpdateHoliday : handleCreateHoliday}
            >
              {selectedHoliday ? 'Update Holiday' : 'Add Holiday'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="label" htmlFor="name">Holiday Name</label>
            <input
              id="name"
              className="input"
              type="text"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              placeholder="Enter holiday name"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="date">Date</label>
            <DatePicker
              id="date"
              className="input w-full"
              selected={holidayForm.date}
              onChange={(date) => setHolidayForm({ ...holidayForm, date: date })}
              dateFormat="MMMM d, yyyy"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label" htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              className="input h-24"
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              placeholder="Provide a description for this holiday"
            />
          </div>
          
          <div className="form-group">
            <div className="flex items-center">
              <input
                id="is_recurring"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={holidayForm.is_recurring}
                onChange={(e) => setHolidayForm({ ...holidayForm, is_recurring: e.target.checked })}
              />
              <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
                Recurring yearly
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If checked, this holiday will be automatically added to the calendar every year.
            </p>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Holiday"
        footer={
          <Modal.Footer.Delete
            onDelete={handleDeleteHoliday}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete the holiday "{selectedHoliday?.name}" on {selectedHoliday && formatDate(selectedHoliday.date)}? This action cannot be undone.
        </p>
        
        <div className="mt-4 bg-yellow-50 p-3 rounded-md">
          <p className="text-sm text-yellow-700">
            Note: Deleting this holiday will automatically notify all faculty members.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default HolidayManagement;