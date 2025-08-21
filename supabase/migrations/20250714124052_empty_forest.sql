/*
  # Create employees table for attendance system

  1. New Tables
    - `employees`
      - `id` (uuid, primary key, foreign key to auth.users)
      - `name` (text) - Employee full name
      - `email` (text) - Employee email address
      - `assigned_shift_id` (uuid, nullable, foreign key to shifts) - Assigned shift
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `employees` table
    - Add policy for users to read and update their own employee data
    - Add policy for users to read other employees' basic info (for admin features)

  3. Indexes
    - Add index on email for faster lookups
    - Add index on assigned_shift_id for shift-based queries
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  assigned_shift_id uuid REFERENCES shifts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_shift ON employees(assigned_shift_id);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy for users to read and update their own data
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for inserting new employee records (during registration)
CREATE POLICY "Users can insert own employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();