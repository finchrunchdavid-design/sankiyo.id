import React, { useState, useEffect } from 'react';
import { Download, Calendar, Users, Clock, DollarSign } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';

export const Reports: React.FC = () => {
  const { employees, attendanceRecords, loading } = useAdmin();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState({
    totalEmployees: 0,
    totalAttendance: 0,
    totalHours: 0,
    totalSalary: 0,
    averageHoursPerEmployee: 0,
    attendanceRate: 0,
    dailyStats: [] as any[]
  });

  useEffect(() => {
    generateReport();
  }, [employees, attendanceRecords, selectedMonth]);

  const generateReport = () => {
    const monthlyRecords = attendanceRecords.filter(record => 
      record.date.startsWith(selectedMonth)
    );

    const totalHours = monthlyRecords.reduce((sum, record) => sum + (record.calculated_work_hours || 0), 0);
    const totalSalary = monthlyRecords.reduce((sum, record) => sum + (record.calculated_salary || 0), 0);
    
    // Calculate daily statistics
    const dailyStats = monthlyRecords.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          attendance: 0,
          hours: 0,
          salary: 0
        };
      }
      acc[date].attendance += 1;
      acc[date].hours += record.calculated_work_hours || 0;
      acc[date].salary += record.calculated_salary || 0;
      return acc;
    }, {} as any);

    const dailyStatsArray = Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate working days in month
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = daysInMonth; // Assuming all days are working days

    setReportData({
      totalEmployees: employees.length,
      totalAttendance: monthlyRecords.length,
      totalHours,
      totalSalary,
      averageHoursPerEmployee: employees.length > 0 ? totalHours / employees.length : 0,
      attendanceRate: (monthlyRecords.length / (employees.length * workingDays)) * 100,
      dailyStats: dailyStatsArray
    });
  };

  const exportToCSV = () => {
    const monthlyRecords = attendanceRecords.filter(record => 
      record.date.startsWith(selectedMonth)
    );

    const csvData = monthlyRecords.map(record => ({
      'Tanggal': record.date,
      'Nama Karyawan': record.employee?.name || '',
      'Email': record.employee?.email || '',
      'Shift': record.shift?.name || '',
      'Jam Masuk 1': record.check_in_1 ? new Date(record.check_in_1).toLocaleTimeString('id-ID') : '',
      'Jam Keluar 1': record.check_out_1 ? new Date(record.check_out_1).toLocaleTimeString('id-ID') : '',
      'Jam Masuk 2': record.check_in_2 ? new Date(record.check_in_2).toLocaleTimeString('id-ID') : '',
      'Jam Keluar 2': record.check_out_2 ? new Date(record.check_out_2).toLocaleTimeString('id-ID') : '',
      'Total Jam Kerja': record.calculated_work_hours?.toFixed(1) || '0',
      'Gaji': record.calculated_salary || 0
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-absensi-${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Absensi</h1>
          <p className="text-gray-600">Analisis dan laporan komprehensif</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Absensi</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalAttendance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jam Kerja</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Gaji</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {reportData.totalSalary.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Kinerja</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rata-rata Jam per Karyawan</span>
              <span className="font-semibold">{reportData.averageHoursPerEmployee.toFixed(1)} jam</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tingkat Kehadiran</span>
              <span className="font-semibold text-green-600">{reportData.attendanceRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rata-rata Gaji per Karyawan</span>
              <span className="font-semibold">
                Rp {reportData.totalEmployees > 0 ? (reportData.totalSalary / reportData.totalEmployees).toLocaleString('id-ID') : '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Harian</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reportData.dailyStats.map((day: any) => (
              <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('id-ID', { 
                      timeZone: 'Asia/Jakarta',
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                  <p className="text-sm text-gray-500">{day.attendance} absensi</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{day.hours.toFixed(1)} jam</p>
                  <p className="text-sm text-green-600">
                    Rp {day.salary.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Karyawan</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Absensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Jam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rata-rata Jam/Hari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gaji
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => {
                const employeeRecords = attendanceRecords.filter(record => 
                  record.employee_id === employee.id && record.date.startsWith(selectedMonth)
                );
                const totalHours = employeeRecords.reduce((sum, record) => sum + (record.calculated_work_hours || 0), 0);
                const totalSalary = employeeRecords.reduce((sum, record) => sum + (record.calculated_salary || 0), 0);
                const avgHours = employeeRecords.length > 0 ? totalHours / employeeRecords.length : 0;

                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employeeRecords.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {totalHours.toFixed(1)} jam
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {avgHours.toFixed(1)} jam
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      Rp {totalSalary.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};