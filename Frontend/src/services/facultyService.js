import apiService from './apiService';

const facultyService = {
  // Timetable Management
  getFacultyTimetable: async () => {
    return await apiService.get('/faculty/timetable');
  },

  createTimetable: async (weeklySchedule) => {
    return await apiService.post('/faculty/timetable', { weekly_schedule: weeklySchedule });
  },

  updateTimetable: async (weeklySchedule) => {
    return await apiService.put('/faculty/timetable', { weekly_schedule: weeklySchedule });
  },

  updateTimetableSlot: async (day, period, slotData) => {
    return await apiService.put('/faculty/timetable/slot', { day, period, data: slotData });
  },

  // Class Session Management
  getFacultyClasses: async (startDate, endDate, status) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (status) params.status = status;
    return await apiService.get('/faculty/classes', params);
  },

  generateClasses: async (semesterStartDate, semesterEndDate) => {
    return await apiService.post('/faculty/classes/generate', { 
      semester_start_date: semesterStartDate, 
      semester_end_date: semesterEndDate 
    });
  },

  markClassComplete: async (classId, topic, notes) => {
    return await apiService.put(`/faculty/classes/${classId}/complete`, { topic, notes });
  },

  markClassIncomplete: async (classId, notes) => {
    return await apiService.put(`/faculty/classes/${classId}/incomplete`, { notes });
  },

  cancelClass: async (classId, reason) => {
    return await apiService.put(`/faculty/classes/${classId}/cancel`, { reason });
  },

  rescheduleClass: async (classId, newDate, notes) => {
    return await apiService.post(`/faculty/classes/${classId}/reschedule`, { new_date: newDate, notes });
  },

  // Activity Management
  getFacultyActivities: async (startDate, endDate, activityType) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (activityType) params.activity_type = activityType;
    return await apiService.get('/faculty/activities', params);
  },

  createActivity: async (activityData) => {
    return await apiService.post('/faculty/activities', activityData);
  },

  updateActivity: async (activityId, activityData) => {
    return await apiService.put(`/faculty/activities/${activityId}`, activityData);
  },

  deleteActivity: async (activityId) => {
    return await apiService.delete(`/faculty/activities/${activityId}`);
  },

  // Available Slots
  getAvailableSlots: async (duration = 1) => {
    return await apiService.get('/faculty/available-slots', { duration });
  },

  // Meeting Management
  getFacultyMeetings: async (status, startDate, endDate) => {
    const params = {};
    if (status) params.status = status;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return await apiService.get('/faculty/meetings', params);
  },

  respondToMeeting: async (meetingId, status, responseMessage) => {
    return await apiService.put(`/faculty/meetings/${meetingId}/respond`, { 
      status, 
      response_message: responseMessage 
    });
  },

  // Holiday Information
  getHolidays: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return await apiService.get('/faculty/holidays', params);
  }
};

export default facultyService;