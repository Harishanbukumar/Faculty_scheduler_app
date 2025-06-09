import apiService from './apiService';

const studentService = {
  // Timetable Management
  getStudentTimetable: async () => {
    return await apiService.get('/student/timetable');
  },

  // Class Management
  getStudentClasses: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return await apiService.get('/student/classes', params);
  },

  // Faculty Availability
  getFacultyAvailability: async (facultyId) => {
    return await apiService.get('/student/faculty-availability', { faculty_id: facultyId });
  },
  
  // Get All Faculty Members
  getAllFacultyMembers: async () => {
    // This will fetch all faculty members for the meeting request dropdown
    return await apiService.get('/student/faculty-list');
  },

  // Meeting Management
  getStudentMeetings: async (status) => {
    const params = {};
    if (status) params.status = status;
    return await apiService.get('/student/meetings', params);
  },

  requestMeeting: async (meetingData) => {
    return await apiService.post('/student/meetings', meetingData);
  },

  cancelMeeting: async (meetingId) => {
    return await apiService.put(`/student/meetings/${meetingId}/cancel`);
  },

  // Notifications
  getNotifications: async (isRead, limit = 50) => {
    const params = { limit };
    if (isRead !== undefined) params.is_read = isRead;
    return await apiService.get('/student/notifications', params);
  },

  markNotificationRead: async (notificationId) => {
    return await apiService.put(`/student/notifications/${notificationId}/read`);
  }
};

export default studentService;