import apiService from './apiService';

const adminService = {
  // User Management
  getUsers: async (role, limit = 100, skip = 0) => {
    return await apiService.get('/admin/users', { role, limit, skip });
  },

  getUserById: async (userId) => {
    return await apiService.get(`/admin/users/${userId}`);
  },

  createUser: async (userData) => {
    return await apiService.post('/admin/users', userData);
  },

  updateUser: async (userId, userData) => {
    return await apiService.put(`/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return await apiService.delete(`/admin/users/${userId}`);
  },

  // Group Management
  assignGroup: async (studentIds, groupId) => {
    return await apiService.post('/admin/groups/assign', { student_ids: studentIds, group_id: groupId });
  },

  getGroupStudents: async (groupId) => {
    return await apiService.get(`/admin/groups/${groupId}/students`);
  },

  // Holiday Management
  getHolidays: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return await apiService.get('/admin/holidays', params);
  },

  createHoliday: async (holidayData) => {
    return await apiService.post('/admin/holidays', holidayData);
  },

  updateHoliday: async (holidayId, holidayData) => {
    return await apiService.put(`/admin/holidays/${holidayId}`, holidayData);
  },

  deleteHoliday: async (holidayId) => {
    return await apiService.delete(`/admin/holidays/${holidayId}`);
  },

  // Conflict Resolution
  getConflicts: async () => {
    return await apiService.get('/admin/conflicts');
  }
};

export default adminService;