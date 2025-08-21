/*
  # Fix Employee RLS Policies and Auth Permissions

  1. Security Changes
    - Grant necessary permissions on auth.users table
    - Fix RLS policies for employees table
    - Ensure proper access control for admin and regular users

  2. Policy Updates
    - Admin can manage all employees
    - Users can only access their own employee data
    - Proper INSERT, SELECT, UPDATE, DELETE policies
*/

-- Grant necessary permissions on auth.users table
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admin can delete employees" ON employees;
DROP POLICY IF EXISTS "Admin can insert employees" ON employees;
DROP POLICY IF EXISTS "Admin can read all employees" ON employees;
DROP POLICY IF EXISTS "Admin can update employees" ON employees;
DROP POLICY IF EXISTS "Users can insert own employee data" ON employees;
DROP POLICY IF EXISTS "Users can read own employee data" ON employees;
DROP POLICY IF EXISTS "Users can update own employee data" ON employees;

-- Create proper RLS policies for employees table
CREATE POLICY "Admin can manage all employees"
  ON employees
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

CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;