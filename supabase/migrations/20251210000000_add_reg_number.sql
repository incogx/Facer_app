-- Add reg_number field to students table if it doesn't exist
-- This migration ensures the reg_number column exists for registration number authentication

-- Check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'reg_number'
  ) THEN
    ALTER TABLE students ADD COLUMN reg_number text UNIQUE;
    
    -- Copy roll_number to reg_number for existing records
    UPDATE students SET reg_number = roll_number WHERE reg_number IS NULL;
    
    -- Make reg_number NOT NULL after populating
    ALTER TABLE students ALTER COLUMN reg_number SET NOT NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_students_reg_number ON students(reg_number);
  END IF;
END $$;

