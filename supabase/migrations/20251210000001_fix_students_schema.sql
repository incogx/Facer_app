-- Comprehensive fix for students table schema
-- This ensures all required columns exist and are properly configured

-- Add reg_number if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'reg_number'
  ) THEN
    -- Add the column as nullable first
    ALTER TABLE students ADD COLUMN reg_number text;
    
    -- Copy roll_number to reg_number for existing records
    UPDATE students SET reg_number = roll_number WHERE reg_number IS NULL;
    
    -- Add unique constraint
    CREATE UNIQUE INDEX IF NOT EXISTS idx_students_reg_number_unique ON students(reg_number) WHERE reg_number IS NOT NULL;
    
    -- Make it NOT NULL after populating
    ALTER TABLE students ALTER COLUMN reg_number SET NOT NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_students_reg_number ON students(reg_number);
  END IF;
END $$;

-- Ensure roll_number exists (should already exist, but just in case)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'roll_number'
  ) THEN
    ALTER TABLE students ADD COLUMN roll_number text UNIQUE NOT NULL;
    -- Copy reg_number to roll_number if reg_number exists
    UPDATE students SET roll_number = reg_number WHERE roll_number IS NULL;
  END IF;
END $$;

-- Ensure email exists and is unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE students ADD COLUMN email text UNIQUE NOT NULL;
  END IF;
END $$;

-- Ensure name exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE students ADD COLUMN name text NOT NULL;
  END IF;
END $$;

-- Ensure face_encoding exists (nullable)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'face_encoding'
  ) THEN
    ALTER TABLE students ADD COLUMN face_encoding text;
  END IF;
END $$;

-- Ensure created_at exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE students ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update any NULL reg_numbers from roll_number
UPDATE students SET reg_number = roll_number WHERE reg_number IS NULL;

-- Update any NULL roll_numbers from reg_number
UPDATE students SET roll_number = reg_number WHERE roll_number IS NULL;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_students_reg_number ON students(reg_number);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

