import React from 'react';
import MeetingRequests from '../../components/faculty/MeetingRequests';

const Meetings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Meeting Requests</h1>
      <MeetingRequests />
    </div>
  );
};

export default Meetings;