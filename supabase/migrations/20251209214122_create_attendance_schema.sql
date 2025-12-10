/*
  # Sathyabama Smart Attendance - Database Schema
  
  ## Overview
  Complete schema for student attendance system with QR scanning and face verification.
  
  ## New Tables
  
  ### `students`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique) - Student email
  - `name` (text) - Full name
  - `roll_number` (text, unique) - Student roll number
  - `face_encoding` (text, nullable) - Stored face features for verification (mock)
  - `created_at` (timestamptz) - Record creation time
  
  ### `classes`
  - `id` (uuid, primary key) - Unique class identifier
  - `name` (text) - Class/course name
  - `code` (text, unique) - Class code (e.g., CSE101)
  - `instructor_name` (text) - Faculty name
  - `created_at` (timestamptz) - Record creation time
  
  ### `sessions`
  - `id` (uuid, primary key) - Session identifier
  - `class_id` (uuid, foreign key) - Links to classes
  - `qr_payload` (text, unique) - Encrypted QR code data
  - `session_date` (date) - Date of session
  - `start_time` (time) - Session start time
  - `end_time` (time) - Session end time
  - `expires_at` (timestamptz) - QR code expiration
  - `status` (text) - active/closed (default: active)
  - `created_at` (timestamptz) - Record creation time
  
  ### `attendance`
  - `id` (uuid, primary key) - Attendance record ID
  - `student_id` (uuid, foreign key) - Links to students
  - `class_id` (uuid, foreign key) - Links to classes
  - `session_id` (uuid, foreign key) - Links to sessions
  - `marked_at` (timestamptz) - Attendance timestamp
  - `method` (text) - qr+face/otp/manual
  - `verification_confidence` (decimal) - Face match confidence (0-1)
  - `created_at` (timestamptz) - Record creation time
  
  ## Security
  
  All tables have RLS enabled with restrictive policies:
  - Students can only read their own data
  - Students can only mark their own attendance
  - Students can read class and session information
  - No public access without authentication
  
  ## Indexes
  
  Performance indexes on frequently queried columns:
  - attendance: (student_id, session_id) for duplicate checking
  - sessions: (qr_payload) for QR validation
  - students: (roll_number) for lookups
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  face_encoding text,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  instructor_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  qr_payload text UNIQUE NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  start_time time NOT NULL,
  end_time time NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  marked_at timestamptz DEFAULT now(),
  method text NOT NULL DEFAULT 'qr+face' CHECK (method IN ('qr+face', 'otp', 'manual')),
  verification_confidence decimal(3,2) DEFAULT 0.00 CHECK (verification_confidence >= 0 AND verification_confidence <= 1),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, session_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_qr ON sessions(qr_payload);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for classes table
CREATE POLICY "Students can view all classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for sessions table
CREATE POLICY "Students can view active sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (status = 'active' AND expires_at > now());

-- RLS Policies for attendance table
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can mark own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Create RPC function for QR validation
CREATE OR REPLACE FUNCTION validate_qr(qr_data text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record sessions;
  result json;
BEGIN
  -- Find session by QR payload
  SELECT * INTO session_record
  FROM sessions
  WHERE qr_payload = qr_data
    AND status = 'active'
    AND expires_at > now();
  
  -- Check if session exists and is valid
  IF session_record.id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'expired'
    );
  END IF;
  
  -- Return session details
  RETURN json_build_object(
    'valid', true,
    'session_id', session_record.id,
    'class_id', session_record.class_id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- Create RPC function for marking attendance
CREATE OR REPLACE FUNCTION mark_attendance(
  p_student_id uuid,
  p_class_id uuid,
  p_session_id uuid,
  p_method text,
  p_confidence decimal DEFAULT 0.00
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record sessions;
  attendance_id uuid;
BEGIN
  -- Verify student is authenticated user
  IF p_student_id != auth.uid() THEN
    RETURN json_build_object(
      'status', 'error',
      'message', 'Unauthorized'
    );
  END IF;
  
  -- Check if session is valid
  SELECT * INTO session_record
  FROM sessions
  WHERE id = p_session_id
    AND status = 'active'
    AND expires_at > now();
  
  IF session_record.id IS NULL THEN
    RETURN json_build_object(
      'status', 'error',
      'message', 'session_closed'
    );
  END IF;
  
  -- Check if already marked
  IF EXISTS (
    SELECT 1 FROM attendance
    WHERE student_id = p_student_id
      AND session_id = p_session_id
  ) THEN
    RETURN json_build_object(
      'status', 'error',
      'message', 'already_marked'
    );
  END IF;
  
  -- Insert attendance record
  INSERT INTO attendance (student_id, class_id, session_id, method, verification_confidence)
  VALUES (p_student_id, p_class_id, p_session_id, p_method, p_confidence)
  RETURNING id INTO attendance_id;
  
  RETURN json_build_object(
    'status', 'ok',
    'id', attendance_id,
    'message', 'Attendance marked successfully'
  );
END;
$$;