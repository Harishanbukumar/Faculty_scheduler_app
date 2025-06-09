import React from 'react';
import MeetingRequest from '../../components/student/MeetingRequest';

const Meetings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Meeting Requests</h1>
      <MeetingRequest />
    </div>
  );
};

export default Meetings;