import React, { useState } from 'react';
import { Header } from '../Layout/Header';
import { AttendanceCard } from '../Attendance/AttendanceCard';
import { AttendanceHistory } from '../Attendance/AttendanceHistory';
import { useAuth } from '../../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAttendanceUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <AttendanceCard 
              employeeId={user.id} 
              onAttendanceUpdate={handleAttendanceUpdate}
            />
          </div>
          
          <div>
            <AttendanceHistory 
              key={refreshKey}
              employeeId={user.id} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};