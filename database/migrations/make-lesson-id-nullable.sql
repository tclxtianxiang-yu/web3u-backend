-- ============================================================
-- 迁移: 使 learning_records.lesson_id 可空
-- 目的: 支持单视频课程(不需要 course_lessons 表中的记录)
-- ============================================================

-- 1. 删除现有的外键约束
ALTER TABLE learning_records
DROP CONSTRAINT IF EXISTS learning_records_lesson_id_fkey;

-- 2. 使 lesson_id 列可空
ALTER TABLE learning_records
ALTER COLUMN lesson_id DROP NOT NULL;

-- 3. 重新添加外键约束(现在允许 NULL)
ALTER TABLE learning_records
ADD CONSTRAINT learning_records_lesson_id_fkey
FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;

-- 4. 删除旧的唯一约束
ALTER TABLE learning_records
DROP CONSTRAINT IF EXISTS learning_records_user_wallet_address_course_id_lesson_id_key;

-- 5. 创建新的唯一索引 - 对于非 NULL 的 lesson_id
-- 保证: 每个用户在每门课程的每个课时只能有一条记录
CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_lesson_unique
ON learning_records (user_wallet_address, course_id, lesson_id)
WHERE lesson_id IS NOT NULL;

-- 6. 创建新的唯一索引 - 对于 NULL 的 lesson_id
-- 保证: 每个用户在每门单视频课程只能有一条 NULL lesson_id 记录
CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_null_lesson_unique
ON learning_records (user_wallet_address, course_id)
WHERE lesson_id IS NULL;

-- ============================================================
-- 迁移完成!
--
-- 新架构说明:
-- • 单视频课程: lesson_id = NULL
-- • 多课时课程: lesson_id = 实际课时 ID (来自 course_lessons 表)
-- • 每个用户每门单视频课程只能有一条完成记录
-- • 每个用户每门多课时课程可以有多条记录(每个课时一条)
-- ============================================================
