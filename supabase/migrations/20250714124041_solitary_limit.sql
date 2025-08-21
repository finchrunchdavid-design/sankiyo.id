/*
  # Create shifts table for attendance system

  1. New Tables
    - `shifts`
      - `id` (uuid, primary key)
      - `name` (text) - Shift name (e.g., 'Shift 1', 'Shift 2')
      - `start_time_1` (time) - First work period start time
      - `end_time_1` (time) - First work period end time
      - `start_time_2` (time, nullable) - Second work period start time (for shifts with breaks)
      - `end_time_2` (time, nullable) - Second work period end time (for shifts with breaks)
      - `expected_hours` (integer) - Expected working hours per day
      - `has_break` (boolean) - Whether this shift has a break period
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `shifts` table
    - Add policy for authenticated users to read shift data

  3. Initial Data
    - Insert the 4 predefined shifts:
      - Shift 1: 06:00-09:00 + 12:00-15:00 (with break)
      - Shift 2: 09:00-12:00 + 15:00-18:00 (with break)
      - Shift 3: 18:00-00:00 (continuous)
      - Shift 4: 00:00-06:00 (continuous)
*/

CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time_1 time NOT NULL,
  end_time_1 time NOT NULL,
  start_time_2 time,
  end_time_2 time,
  expected_hours integer NOT NULL DEFAULT 6,
  has_break boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert the 4 predefined shifts
INSERT INTO shifts (name, start_time_1, end_time_1, start_time_2, end_time_2, expected_hours, has_break) VALUES
  ('Shift 1', '06:00:00', '09:00:00', '12:00:00', '15:00:00', 6, true),
  ('Shift 2', '09:00:00', '12:00:00', '15:00:00', '18:00:00', 6, true),
  ('Shift 3', '18:00:00', '00:00:00', null, null, 6, false),
  ('Shift 4', '00:00:00', '06:00:00', null, null, 6, false);