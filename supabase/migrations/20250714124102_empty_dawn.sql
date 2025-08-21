/*
  # Create attendance records table for attendance system

  1. New Tables
    - `attendance_records`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `date` (date) - Date of attendance
      - `check_in_1` (timestamptz, nullable) - First check-in time
      - `check_out_1` (timestamptz, nullable) - First check-out time (break start or end of work)
      - `check_in_2` (timestamptz, nullable) - Second check-in time (after break)
      - `check_out_2` (timestamptz, nullable) - Final check-out time
      - `calculated_work_hours` (numeric, nullable) - Calculated total work hours
      - `calculated_salary` (numeric, nullable) - Calculated daily salary
      - `shift_id` (uuid, foreign key to shifts) - Shift used for this attendance
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `attendance_records` table
    - Add policy for users to read and manage their own attendance records

  3. Indexes
    - Add index on employee_id and date for faster queries
    - Add index on date for reporting queries
    - Add unique constraint on employee_id and date (one record per employee per day)

  4. Functions
    - Function to calculate work hours based on check-in/check-out times
    - Function to calculate daily salary based on work hours
*/

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_1 timestamptz,
  check_out_1 timestamptz,
  check_in_2 timestamptz,
  check_out_2 timestamptz,
  calculated_work_hours numeric(4,2),
  calculated_salary numeric(10,2),
  shift_id uuid NOT NULL REFERENCES shifts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one record per employee per day
  UNIQUE(employee_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_shift ON attendance_records(shift_id);

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own attendance records
CREATE POLICY "Users can read own attendance records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

-- Policy for users to insert their own attendance records
CREATE POLICY "Users can insert own attendance records"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

-- Policy for users to update their own attendance records
CREATE POLICY "Users can update own attendance records"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());

-- Function to calculate work hours
CREATE OR REPLACE FUNCTION calculate_work_hours(
  check_in_1 timestamptz,
  check_out_1 timestamptz,
  check_in_2 timestamptz DEFAULT NULL,
  check_out_2 timestamptz DEFAULT NULL
) RETURNS numeric AS $$
DECLARE
  total_hours numeric := 0;
  session_1_hours numeric := 0;
  session_2_hours numeric := 0;
BEGIN
  -- Calculate first session hours
  IF check_in_1 IS NOT NULL AND check_out_1 IS NOT NULL THEN
    session_1_hours := EXTRACT(EPOCH FROM (check_out_1 - check_in_1)) / 3600.0;
  END IF;
  
  -- Calculate second session hours (if applicable)
  IF check_in_2 IS NOT NULL AND check_out_2 IS NOT NULL THEN
    session_2_hours := EXTRACT(EPOCH FROM (check_out_2 - check_in_2)) / 3600.0;
  END IF;
  
  total_hours := session_1_hours + session_2_hours;
  
  -- Ensure non-negative result
  IF total_hours < 0 THEN
    total_hours := 0;
  END IF;
  
  RETURN ROUND(total_hours, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily salary
CREATE OR REPLACE FUNCTION calculate_daily_salary(work_hours numeric) RETURNS numeric AS $$
DECLARE
  base_salary numeric := 80000; -- Base salary for 6 hours
  expected_hours numeric := 6;
  calculated_salary numeric;
BEGIN
  IF work_hours IS NULL OR work_hours <= 0 THEN
    RETURN 0;
  END IF;
  
  -- If worked 6 hours or more, get full salary
  IF work_hours >= expected_hours THEN
    calculated_salary := base_salary;
  ELSE
    -- Proportional salary for less than 6 hours
    calculated_salary := (base_salary / expected_hours) * work_hours;
  END IF;
  
  RETURN ROUND(calculated_salary, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at and calculate hours/salary
CREATE OR REPLACE FUNCTION update_attendance_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp
  NEW.updated_at = now();
  
  -- Calculate work hours if we have enough data
  IF NEW.check_in_1 IS NOT NULL AND NEW.check_out_1 IS NOT NULL THEN
    -- For shifts without break (check_out_1 is final) or shifts with break that are complete
    IF NEW.check_in_2 IS NULL OR NEW.check_out_2 IS NOT NULL THEN
      NEW.calculated_work_hours = calculate_work_hours(
        NEW.check_in_1,
        NEW.check_out_1,
        NEW.check_in_2,
        NEW.check_out_2
      );
      
      -- Calculate salary based on work hours
      NEW.calculated_salary = calculate_daily_salary(NEW.calculated_work_hours);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_calculations_trigger
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_calculations();