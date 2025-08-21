/*
  # Fix Employee RLS Insert Policy

  1. Security Changes
    - Drop existing INSERT policy that may be incorrectly configured
    - Create new INSERT policy with proper WITH CHECK condition
    - Ensure authenticated users can insert their own employee records
    - Fix the policy to allow auth.uid() = id for new insertions

  This resolves the "new row violates row-level security policy" error
  when trying to save new employee records during registration.
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own employee data" ON employees;

-- Create a new INSERT policy with correct WITH CHECK condition
CREATE POLICY "Users can insert own employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the SELECT policy exists for reading own data
DROP POLICY IF EXISTS "Users can read own employee data" ON employees;
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the UPDATE policy exists for updating own data
DROP POLICY IF EXISTS "Users can update own employee data" ON employees;
CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);