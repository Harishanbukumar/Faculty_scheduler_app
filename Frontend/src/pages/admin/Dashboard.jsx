import React, { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

const Dashboard = () => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFaculty: 0,
    totalStudents: 0,
    totalHolidays: 0,
    conflicts: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user counts
        const usersResponse = await adminService.getUsers(null, 5);
        const facultyResponse = await adminService.getUsers('faculty', 0);
        const studentsResponse = await adminService.getUsers('student', 0);
        
        // Fetch upcoming holidays
        const currentDate = new Date().toISOString().split('T')[0];
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().split('T')[0];
        
        const holidaysResponse = await adminService.getHolidays(currentDate, nextMonth);
        
        // Fetch conflicts
        const conflictsResponse = await adminService.getConflicts();
        
        // Update states
        setStats({
          totalUsers: usersResponse.total,
          totalFaculty: facultyResponse.total,
          totalStudents: studentsResponse.total,
          totalHolidays: holidaysResponse.total,
          conflicts: conflictsResponse?.length || 0
        });
        
        setRecentUsers(usersResponse.users);
        setUpcomingHolidays(holidaysResponse.holidays);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showError]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary-50 border-l-4 border-primary-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-800">
              <FiUsers size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/users">
              <Button variant="outline" size="sm">View All Users</Button>
            </Link>
          </div>
        </Card>
        
        <Card className="bg-success-50 border-l-4 border-success-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success-100 text-success-800">
              <FiUserCheck size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-success-600">Faculty Members</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalFaculty}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/users?role=faculty">
              <Button variant="outline" size="sm">View Faculty</Button>
            </Link>
          </div>
        </Card>
        
        <Card className="bg-accent-50 border-l-4 border-accent-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent-100 text-accent-800">
              <FiUsers size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-accent-600">Students</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalStudents}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/users?role=student">
              <Button variant="outline" size="sm">View Students</Button>
            </Link>
          </div>
        </Card>
        
        <Card className="bg-error-50 border-l-4 border-error-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-error-100 text-error-800">
              <FiAlertCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-error-600">Schedule Conflicts</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.conflicts}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/conflicts">
              <Button variant={stats.conflicts > 0 ? "error" : "outline"} size="sm">
                View Conflicts
              </Button>
            </Link>
          </div>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Users */}
        <Card 
          title="Recently Added Users" 
          className="lg:col-span-2"
          footer={
            <Link to="/admin/users">
              <Button variant="ghost" size="sm">View All Users</Button>
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.registration_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'faculty' ? 'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/admin/users/${user._id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Upcoming Holidays */}
        <Card 
          title="Upcoming Holidays" 
          icon={<FiCalendar className="text-primary-500" />}
          footer={
            <Link to="/admin/holidays">
              <Button variant="ghost" size="sm">Manage Holidays</Button>
            </Link>
          }
        >
          <div className="space-y-4">
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map((holiday) => (
                <div key={holiday._id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <h4 className="font-medium text-gray-800">{holiday.name}</h4>
                    <p className="text-sm text-gray-500">{formatDate(holiday.date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No upcoming holidays</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;