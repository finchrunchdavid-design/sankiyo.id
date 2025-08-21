/*
  # Fix Admin Employee Policies

  This migration creates proper RLS policies to allow admin users to manage all employees
  while maintaining security for regular users.

  1. Security Changes
    - Add policy for admin to read all employees
    - Add policy for admin to insert/update/delete employees
    - Keep existing policies for regular users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own employee data" ON employees;
DROP POLICY IF EXISTS "Users can insert own employee data" ON employees;
DROP POLICY IF EXISTS "Users can update own employee data" ON employees;

-- Create new policies for regular users
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create admin policies (admin@admin.com can manage all employees)
CREATE POLICY "Admin can read all employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );

CREATE POLICY "Admin can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );

CREATE POLICY "Admin can update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );

CREATE POLICY "Admin can delete employees"
  ON employees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );

-- Similar policies for attendance_records
DROP POLICY IF EXISTS "Users can read own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Users can insert own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Users can update own attendance records" ON attendance_records;

-- Regular user policies for attendance
CREATE POLICY "Users can read own attendance records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Users can insert own attendance records"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own attendance records"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- Admin policies for attendance records
CREATE POLICY "Admin can read all attendance records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );

CREATE POLICY "Admin can manage attendance records"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@admin.com'
    )
  );