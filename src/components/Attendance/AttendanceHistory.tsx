import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AttendanceRecord } from '../../types';

interface AttendanceHistoryProps {
  employeeId: string;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ employeeId }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchRecords();
  }, [employeeId, selectedMonth]);

  const fetchRecords = async () => {
    setLoading(true);
    
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-31`;
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        shift:shifts(*)
      `)
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }
    
    setLoading(false);
  };

  const calculateMonthlyStats = () => {
    const totalDays = records.length;
    const totalHours = records.reduce((sum, record) => sum + (record.calculated_work_hours || 0), 0);
    const totalSalary = records.reduce((sum, record) => sum + (record.calculated_salary || 0), 0);
    
    return { totalDays, totalHours, totalSalary };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = calculateMonthlyStats();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-pink-600" />
          Riwayat Absensi
        </h2>
        
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-pink-50 rounded-xl p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-pink-600 mr-3" />
            <div>
              <p className="text-sm text-pink-600 font-medium">Hari Kerja</p>
              <p className="text-2xl font-bold text-pink-900">{stats.totalDays}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Jam</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">Total Gaji</p>
              <p className="text-2xl font-bold text-yellow-900">
                Rp {stats.totalSalary.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Tidak ada data absensi untuk bulan ini</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{formatDate(record.date)}</h3>
                  <p className="text-sm text-gray-600">{record.shift?.name}</p>
                </div>
                <div className="text-right">
                  {record.calculated_work_hours && (
                    <p className="text-sm font-medium text-gray-900">
                      {record.calculated_work_hours.toFixed(1)} jam
                    </p>
                  )}
                  {record.calculated_salary && (
                    <p className="text-sm font-bold text-green-600">
                      Rp {record.calculated_salary.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {record.check_in_1 && (
                  <div>
                    <p className="text-gray-600">Masuk</p>
                    <p className="font-medium">{formatTime(record.check_in_1)}</p>
                  </div>
                )}
                {record.check_out_1 && (
                  <div>
                    <p className="text-gray-600">
                      {record.shift?.has_break ? 'Istirahat' : 'Pulang'}
                    </p>
                    <p className="font-medium">{formatTime(record.check_out_1)}</p>
                  </div>
                )}
                {record.check_in_2 && (
                  <div>
                    <p className="text-gray-600">Masuk Lagi</p>
                    <p className="font-medium">{formatTime(record.check_in_2)}</p>
                  </div>
                )}
                {record.check_out_2 && (
                  <div>
                    <p className="text-gray-600">Pulang</p>
                    <p className="font-medium">{formatTime(record.check_out_2)}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};