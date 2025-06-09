import React from 'react';
import ActivityCalendar from '../../components/faculty/ActivityCalender';

const Activities = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Activities</h1>
      <ActivityCalendar />
    </div>
  );
};

export default Activities;