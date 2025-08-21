/*
  # Fix Employee Insert RLS Policy

  1. Security Updates
    - Update INSERT policy for employees table to allow proper user registration
    - Ensure users can create their own employee records during signup
    - Maintain security by restricting to own user ID only

  2. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows users to insert their own employee data
    - Policy checks that the employee ID matches the authenticated user's ID
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own employee data" ON employees;

-- Create a new INSERT policy that allows users to create their own employee record
CREATE POLICY "Users can insert own employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the policy for reading own data exists
DROP POLICY IF EXISTS "Users can read own employee data" ON employees;
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the policy for updating own data exists
DROP POLICY IF EXISTS "Users can update own employee data" ON employees;
CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);