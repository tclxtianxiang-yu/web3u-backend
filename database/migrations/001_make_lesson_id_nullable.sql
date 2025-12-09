-- Migration: Make lesson_id nullable in learning_records
-- This allows tracking course completion without requiring individual lessons
-- For single-video courses, lesson_id can be NULL

-- Drop the existing foreign key constraint
ALTER TABLE learning_records
DROP CONSTRAINT IF EXISTS learning_records_lesson_id_fkey;

-- Make lesson_id nullable
ALTER TABLE learning_records
ALTER COLUMN lesson_id DROP NOT NULL;

-- Re-add the foreign key constraint (now allows NULL)
ALTER TABLE learning_records
ADD CONSTRAINT learning_records_lesson_id_fkey
FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;

-- Update the unique constraint to handle NULL lesson_id
-- Drop the old constraint
ALTER TABLE learning_records
DROP CONSTRAINT IF EXISTS learning_records_user_wallet_address_course_id_lesson_id_key;

-- Add new constraint that treats NULL as unique per user+course
-- For single-video courses: user can have one record per course with NULL lesson_id
-- For multi-lesson courses: user can have multiple records with different lesson_ids
CREATE UNIQUE INDEX learning_records_user_course_lesson_unique
ON learning_records (user_wallet_address, course_id, lesson_id)
WHERE lesson_id IS NOT NULL;

CREATE UNIQUE INDEX learning_records_user_course_null_lesson_unique
ON learning_records (user_wallet_address, course_id)
WHERE lesson_id IS NULL;
