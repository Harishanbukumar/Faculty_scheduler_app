import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiCalendar, FiPlus, FiFilter } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import facultyService from '../../services/facultyService';
import ClassDetails from '../../components/faculty/ClassDetails';
import Timetable from '../../components/faculty/Timetable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Classes = () => {
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'calendar', 'timetable'
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)) // Default to one week
  });

  // Generate semester form
  const [semesterForm, setSemesterForm] = useState({
    semester_start_date: new Date(),
    semester_end_date: new Date(new Date().setMonth(new Date().getMonth() + 4)) // Default 4 months
  });

  useEffect(() => {
    fetchClasses();
    
    // Check if a specific class ID is in the query params
    const queryParams = new URLSearchParams(location.search);
    const classId = queryParams.get('id');
    if (classId) {
      handleSelectClass(classId);
    }
  }, [location]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      // Format dates for API
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];
      
      // Apply status filter if needed
      let statusParam = null;
      if (statusFilter !== 'all') {
        statusParam = statusFilter;
      }
      
      const response = await facultyService.getFacultyClasses(startDateStr, endDateStr, statusParam);
      setClasses(response.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClasses = async () => {
    try {
      if (!semesterForm.semester_start_date || !semesterForm.semester_end_date) {
        showError('Start and end dates are required');
        return;
      }
      
      // Validate date range
      if (semesterForm.semester_start_date >= semesterForm.semester_end_date) {
        showError('End date must be after start date');
        return;
      }
      
      // Format dates for API
      const startDateStr = semesterForm.semester_start_date.toISOString();
      const endDateStr = semesterForm.semester_end_date.toISOString();
      
      const response = await facultyService.generateClasses(startDateStr, endDateStr);
      
      showSuccess(`${response.message || 'Classes generated successfully'}`);
      setShowGenerateModal(false);
      
      // Refresh classes
      fetchClasses();
    } catch (error) {
      console.error('Error generating classes:', error);
      showError(error.error || 'Failed to generate classes');
    }
  };

  const handleSelectClass = async (classId) => {
    setSelectedClass(classId);
    setShowDetailsModal(true);
  };

  const handleUpdateClass = () => {
    // Refresh classes after an update
    fetchClasses();
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowGenerateModal(true)}
            icon={<FiPlus />}
          >
            Generate Classes
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex space-x-2">
          <Button 
            variant={view === 'list' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setView('list')}
          >
            List View
          </Button>
          <Button 
            variant={view === 'timetable' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setView('timetable')}
          >
            Timetable
          </Button>
        </div>
        
        {view === 'list' && (
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">From:</span>
              <DatePicker
                selected={dateRange.startDate}
                onChange={date => setDateRange({...dateRange, startDate: date})}
                className="input py-1 px-2 text-sm"
                dateFormat="MMM d, yyyy"
              />
              <span className="text-sm text-gray-500">To:</span>
              <DatePicker
                selected={dateRange.endDate}
                onChange={date => setDateRange({...dateRange, endDate: date})}
                className="input py-1 px-2 text-sm"
                dateFormat="MMM d, yyyy"
                minDate={dateRange.startDate}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <select
                className="input py-1 px-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="not_completed">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchClasses}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {view === 'timetable' ? (
        <Timetable />
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="large" />
            </div>
          ) : classes.length === 0 ? (
            <Card>
              <div className="text-center py-6">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No classes found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No classes match your current filters or you haven't generated classes yet.
                </p>
                <div className="mt-6">
                  <Button 
                    onClick={() => setShowGenerateModal(true)}
                    icon={<FiPlus />}
                  >
                    Generate Classes
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topic
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((cls) => (
                      <tr key={cls._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatDate(cls.date)}</div>
                          <div className="text-xs text-gray-500">{formatTime(cls.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cls.subject || 'Not specified'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{cls.group_id || 'Not assigned'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(cls.status)}`}>
                            {cls.status === 'not_completed' ? 'Scheduled' : cls.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{cls.topic || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSelectClass(cls._id)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Class Details Modal */}
      {showDetailsModal && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          size="lg"
        >
          <ClassDetails 
            classId={selectedClass} 
            onClose={() => setShowDetailsModal(false)} 
            onUpdate={handleUpdateClass}
          />
        </Modal>
      )}
      
      {/* Generate Classes Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Classes for Semester"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateClasses}>
              Generate Classes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will generate class sessions based on your weekly timetable for the selected semester period.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="start_date">Semester Start Date</label>
              <DatePicker
                id="start_date"
                className="input w-full"
                selected={semesterForm.semester_start_date}
                onChange={(date) => setSemesterForm({...semesterForm, semester_start_date: date})}
                dateFormat="MMMM d, yyyy"
              />
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="end_date">Semester End Date</label>
              <DatePicker
                id="end_date"
                className="input w-full"
                selected={semesterForm.semester_end_date}
                onChange={(date) => setSemesterForm({...semesterForm, semester_end_date: date})}
                dateFormat="MMMM d, yyyy"
                minDate={semesterForm.semester_start_date}
              />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-sm text-yellow-700">
              Note: This will generate classes only for the days that have entries in your weekly timetable.
              Please set up your timetable first if you haven't already done so.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Classes;