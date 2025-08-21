import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Coffee, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AttendanceRecord, AttendanceStatus, Shift } from '../../types';
import { SelfieCapture } from '../Camera/SelfieCapture';

interface AttendanceCardProps {
  employeeId: string;
  onAttendanceUpdate: () => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ 
  employeeId, 
  onAttendanceUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>('not_started');
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchShifts();
    fetchTodayRecord();
  }, [employeeId]);

  // Add effect to refresh data when date changes
  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const recordDate = todayRecord?.date;
      
      // If we have a record but it's not for today, or if we don't have a record for today
      if (!todayRecord || recordDate !== currentDate) {
        fetchTodayRecord();
      }
    };

    // Check immediately
    checkDateChange();

    // Set up interval to check every minute for date changes
    const interval = setInterval(checkDateChange, 60000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setShifts(data);
    }
  };

  const fetchTodayRecord = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        shift:shifts(*)
      `)
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (!error && data) {
      setTodayRecord(data);
      determineStatus(data);
    } else {
      setTodayRecord(null);
      setStatus('not_started');
    }
  };

  const determineStatus = (record: AttendanceRecord) => {
    if (!record.check_in_1) {
      setStatus('not_started');
    } else if (record.check_in_1 && !record.check_out_1) {
      setStatus('checked_in_1');
    } else if (record.check_out_1 && !record.check_in_2 && record.shift?.has_break) {
      setStatus('on_break');
    } else if (record.check_in_2 && !record.check_out_2) {
      setStatus('checked_in_2');
    } else {
      setStatus('completed');
    }
  };

  const getCurrentShift = (): Shift | null => {
    const now = new Date();
    // Convert to Jakarta timezone
    const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const currentTime = jakartaTime.getHours() * 60 + jakartaTime.getMinutes();

    for (const shift of shifts) {
      const start1 = timeStringToMinutes(shift.start_time_1);
      const end1 = timeStringToMinutes(shift.end_time_1);
      
      if (shift.start_time_2 && shift.end_time_2) {
        const start2 = timeStringToMinutes(shift.start_time_2);
        const end2 = timeStringToMinutes(shift.end_time_2);
        
        if ((currentTime >= start1 && currentTime <= end1) || 
            (currentTime >= start2 && currentTime <= end2)) {
          return shift;
        }
      } else {
        // Handle overnight shifts
        if (start1 > end1) {
          if (currentTime >= start1 || currentTime <= end1) {
            return shift;
          }
        } else {
          if (currentTime >= start1 && currentTime <= end1) {
            return shift;
          }
        }
      }
    }
    
    return null;
  };

  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleAttendanceAction = async () => {
    // Show selfie capture first
    setShowSelfieCapture(true);
    setPendingAction(status);
  };

  const handleSelfieCapture = async (imageData: string) => {
    setShowSelfieCapture(false);
    setLoading(true);
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const currentShift = getCurrentShift();

    if (!currentShift) {
      alert('Tidak ada shift yang aktif saat ini');
      setLoading(false);
      return;
    }

    try {
      if (pendingAction === 'not_started') {
        // First check-in
        const { error } = await supabase
          .from('attendance_records')
          .insert([{
            employee_id: employeeId,
            date: today,
            check_in_1: now,
            shift_id: currentShift.id,
            selfie_check_in_1: imageData
          }]);
        
        if (error) throw error;
      } else if (pendingAction === 'checked_in_1') {
        // First check-out
        const { error } = await supabase
          .from('attendance_records')
          .update({ 
            check_out_1: now,
            selfie_check_out_1: imageData
          })
          .eq('employee_id', employeeId)
          .eq('date', today);
        
        if (error) throw error;
      } else if (pendingAction === 'on_break') {
        // Second check-in (after break)
        const { error } = await supabase
          .from('attendance_records')
          .update({ 
            check_in_2: now,
            selfie_check_in_2: imageData
          })
          .eq('employee_id', employeeId)
          .eq('date', today);
        
        if (error) throw error;
      } else if (pendingAction === 'checked_in_2') {
        // Final check-out
        const { error } = await supabase
          .from('attendance_records')
          .update({ 
            check_out_2: now,
            selfie_check_out_2: imageData
          })
          .eq('employee_id', employeeId)
          .eq('date', today);
        
        if (error) throw error;

        // Trigger salary calculation
        await calculateSalary();
      }

      await fetchTodayRecord();
      onAttendanceUpdate();
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Terjadi kesalahan saat memperbarui absensi');
    }
    
    setPendingAction(null);
    setLoading(false);
  };

  const handleSelfieCancel = () => {
    setShowSelfieCapture(false);
    setPendingAction(null);
  };

  const calculateSalary = async () => {
    try {
      const { error } = await supabase.functions.invoke('calculate-salary', {
        body: { 
          employee_id: employeeId,
          date: new Date().toISOString().split('T')[0]
        }
      });

      if (error) {
        console.error('Error calculating salary:', error);
      }
    } catch (error) {
      console.error('Error invoking salary calculation:', error);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'not_started':
        return 'Masuk Kerja';
      case 'checked_in_1':
        return todayRecord?.shift?.has_break ? 'Istirahat' : 'Pulang';
      case 'on_break':
        return 'Masuk Lagi';
      case 'checked_in_2':
        return 'Pulang';
      case 'completed':
        return 'Selesai';
      default:
        return 'Absen';
    }
  };

  const getButtonIcon = () => {
    switch (status) {
      case 'not_started':
        return <Play className="w-5 h-5" />;
      case 'checked_in_1':
        return todayRecord?.shift?.has_break ? <Coffee className="w-5 h-5" /> : <Square className="w-5 h-5" />;
      case 'on_break':
        return <Play className="w-5 h-5" />;
      case 'checked_in_2':
        return <Square className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'not_started':
        return 'Belum absen hari ini';
      case 'checked_in_1':
        return 'Sedang bekerja';
      case 'on_break':
        return 'Sedang istirahat';
      case 'checked_in_2':
        return 'Sedang bekerja (sesi 2)';
      case 'completed':
        return 'Absensi hari ini selesai';
      default:
        return 'Status tidak diketahui';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-gray-600">
          {formatDate(currentTime)}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-5 h-5 text-pink-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">Status Absensi</span>
        </div>
        <div className="text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            status === 'completed' 
              ? 'bg-green-100 text-green-800'
              : status === 'not_started'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-pink-100 text-pink-800'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {todayRecord && (
        <div className="bg-pink-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-pink-900 mb-3">Aktivitas Hari Ini</h3>
          <div className="space-y-2 text-sm">
            {todayRecord.check_in_1 && (
              <div className="flex justify-between">
                <span className="text-pink-700">Masuk:</span>
                <span className="font-medium">
                  {new Date(todayRecord.check_in_1).toLocaleTimeString('id-ID')}
                </span>
              </div>
            )}
            {todayRecord.check_out_1 && (
              <div className="flex justify-between">
                <span className="text-pink-700">
                  {todayRecord.shift?.has_break ? 'Istirahat:' : 'Pulang:'}
                </span>
                <span className="font-medium">
                  {new Date(todayRecord.check_out_1).toLocaleTimeString('id-ID')}
                </span>
              </div>
            )}
            {todayRecord.check_in_2 && (
              <div className="flex justify-between">
                <span className="text-pink-700">Masuk Lagi:</span>
                <span className="font-medium">
                  {new Date(todayRecord.check_in_2).toLocaleTimeString('id-ID')}
                </span>
              </div>
            )}
            {todayRecord.check_out_2 && (
              <div className="flex justify-between">
                <span className="text-pink-700">Pulang:</span>
                <span className="font-medium">
                  {new Date(todayRecord.check_out_2).toLocaleTimeString('id-ID')}
                </span>
              </div>
            )}
            {todayRecord.calculated_work_hours && (
              <div className="flex justify-between pt-2 border-t border-pink-200">
                <span className="text-pink-700 font-medium">Total Jam:</span>
                <span className="font-bold">
                  {todayRecord.calculated_work_hours.toFixed(1)} jam
                </span>
              </div>
            )}
            {todayRecord.calculated_salary && (
              <div className="flex justify-between">
                <span className="text-pink-700 font-medium">Gaji:</span>
                <span className="font-bold text-green-600">
                  Rp {todayRecord.calculated_salary.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleAttendanceAction}
        disabled={loading || status === 'completed'}
        className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-medium transition-colors ${
          status === 'completed'
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-pink-600 text-white hover:bg-pink-700 active:bg-pink-800'
        }`}
      >
        {getButtonIcon()}
        <span>{loading ? 'Memproses...' : getButtonText()}</span>
      </button>

      <SelfieCapture
        isOpen={showSelfieCapture}
        onCapture={handleSelfieCapture}
        onCancel={handleSelfieCancel}
      />
    </div>
  );
};
