import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';

export const AdminDashboard: React.FC = () => {
  const { employees, attendanceRecords, loading } = useAdmin();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    totalHoursToday: 0,
    totalSalaryToday: 0,
    monthlyAttendance: 0,
    monthlySalary: 0
  });

  useEffect(() => {
    calculateStats();
  }, [employees, attendanceRecords]);

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const todayRecords = attendanceRecords.filter(record => record.date === today);
    const monthlyRecords = attendanceRecords.filter(record => record.date.startsWith(currentMonth));

    const totalHoursToday = todayRecords.reduce((sum, record) => sum + (record.calculated_work_hours || 0), 0);
    const totalSalaryToday = todayRecords.reduce((sum, record) => sum + (record.calculated_salary || 0), 0);
    const monthlySalary = monthlyRecords.reduce((sum, record) => sum + (record.calculated_salary || 0), 0);

    setStats({
      totalEmployees: employees.length,
      todayAttendance: todayRecords.length,
      totalHoursToday,
      totalSalaryToday,
      monthlyAttendance: monthlyRecords.length,
      monthlySalary
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Ringkasan sistem absensi hari ini</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absensi Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jam Kerja Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHoursToday.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gaji Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {stats.totalSalaryToday.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Statistik Bulanan</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Absensi</span>
              <span className="font-semibold">{stats.monthlyAttendance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Gaji</span>
              <span className="font-semibold text-green-600">
                Rp {stats.monthlySalary.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Absensi Terbaru</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {attendanceRecords.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{record.employee?.name}</p>
                  <p className="text-sm text-gray-500">{record.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {record.calculated_work_hours?.toFixed(1)} jam
                  </p>
                  <p className="text-xs text-green-600">
                    Rp {record.calculated_salary?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};