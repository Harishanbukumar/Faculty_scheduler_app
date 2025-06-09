import React from 'react';
import ClassSchedule from '../../components/student/ClassSchedule';

const Classes = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Class Schedule</h1>
      <ClassSchedule />
    </div>
  );
};

export default Classes;