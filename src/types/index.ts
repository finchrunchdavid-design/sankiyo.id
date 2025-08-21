export interface User {
  id: string;
  email: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  assigned_shift_id?: string;
  created_at: string;
  shift?: Shift;
}

export interface Shift {
  id: string;
  name: string;
  start_time_1: string;
  end_time_1: string;
  start_time_2?: string;
  end_time_2?: string;
  expected_hours: number;
  has_break: boolean;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_1?: string | null;
  check_out_1?: string | null;
  check_in_2?: string | null;
  check_out_2?: string | null;
  calculated_work_hours?: number;
  calculated_salary?: number;
  shift_id: string;
  shift?: Shift;
  employee?: Employee;
  selfie_check_in_1?: string | null;
  selfie_check_out_1?: string | null;
  selfie_check_in_2?: string | null;
  selfie_check_out_2?: string | null;
}

export type AttendanceStatus = 'not_started' | 'checked_in_1' | 'on_break' | 'checked_in_2' | 'completed';