import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, AttendanceRecord, Shift } from '../types';

const ADMIN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`;

const callAdminFunction = async (action: string, data?: any, filters?: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data, filters }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }

  const result = await response.json();
  return result.data;
};

export const useAdmin = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      console.log('Fetching employees...');
      const data = await callAdminFunction('fetchEmployees');
      console.log('Employees fetched:', data);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
    setLoading(false);
  };

  const fetchAttendanceRecords = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      // If no date range provided, default to current month
      if (!startDate && !endDate) {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        startDate = `${currentMonth}-01`;
        endDate = `${currentMonth}-31`;
      }
      
      const data = await callAdminFunction('fetchAttendanceRecords', null, { startDate, endDate });
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    }
    setLoading(false);
  };

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setShifts(data);
    }
  };

  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at'> & { password?: string }) => {
    try {
      console.log('Creating employee with data:', employeeData);
      const data = await callAdminFunction('createEmployee', employeeData);
      console.log('Employee created successfully:', data);
      await fetchEmployees();
      return { data, error: null };
    } catch (error) {
      console.error('Error in createEmployee:', error);
      return { data: null, error };
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      console.log('Updating employee:', id, 'with updates:', updates);
      const data = await callAdminFunction('updateEmployee', { id, updates });
      console.log('Employee updated successfully:', data);
      await fetchEmployees();
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return { data: null, error };
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await callAdminFunction('deleteEmployee', { id });
      await fetchEmployees();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateShift = async (id: string, updates: Partial<Shift>) => {
    console.log('Updating shift:', id, 'with updates:', updates);
    
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating shift:', error);
      return { data: null, error };
    }
    
    if (!data || data.length === 0) {
      const notFoundError = new Error(`No shift found with ID: ${id}`);
      console.error('Shift not found:', notFoundError);
      return { data: null, error: notFoundError };
    }
    
    const updatedShift = data[0];
    console.log('Shift updated successfully:', updatedShift);
    
    // Update local state immediately
    setShifts(prevShifts => 
      prevShifts.map(shift => 
        shift.id === id ? { ...shift, ...updates } : shift
      )
    );
    
    return { data: updatedShift, error: null };
  };

  const updateAttendanceRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      const data = await callAdminFunction('updateAttendanceRecord', { id, updates });
      await fetchAttendanceRecords();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deleteAttendanceRecord = async (id: string) => {
    try {
      await callAdminFunction('deleteAttendanceRecord', { id });
      await fetchAttendanceRecords();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchShifts();
    fetchAttendanceRecords();
    
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAttendanceRecords();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return {
    employees,
    attendanceRecords,
    shifts,
    loading,
    fetchEmployees,
    fetchAttendanceRecords,
    fetchShifts,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    updateShift,
    updateAttendanceRecord,
    deleteAttendanceRecord,
  };
};
