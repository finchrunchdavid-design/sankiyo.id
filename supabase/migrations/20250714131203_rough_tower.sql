/*
  # Add selfie columns to attendance records

  1. Changes
    - Add selfie_check_in_1 column for first check-in selfie
    - Add selfie_check_out_1 column for first check-out selfie  
    - Add selfie_check_in_2 column for second check-in selfie
    - Add selfie_check_out_2 column for second check-out selfie

  2. Security
    - Columns allow storing base64 image data
    - Existing RLS policies will apply to new columns
*/

DO $$
BEGIN
  -- Add selfie columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'selfie_check_in_1'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN selfie_check_in_1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'selfie_check_out_1'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN selfie_check_out_1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'selfie_check_in_2'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN selfie_check_in_2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'selfie_check_out_2'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN selfie_check_out_2 text;
  END IF;
END $$;