-- Multiple Assignees Schema Migration
-- 1. Create task_assignees join table
-- 2. Migrate existing Single Assignee data to new table
-- 3. Update RLS policies

-- 1. Create Table
CREATE TABLE IF NOT EXISTS task_assignees (
    task_id uuid REFERENCES task_tasks(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (task_id, user_id)
);

-- 2. Migrate Data
INSERT INTO task_assignees (task_id, user_id)
SELECT id, assignee_id
FROM task_tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. RLS Policies
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON task_assignees;
CREATE POLICY "Enable all access for authenticated users" 
ON task_assignees FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Optional: Drop old column?
-- For now, we will NOT drop assignee_id to prevent immediate breakage if code isn't deployed yet.
-- But the application will stop using it.
-- ALTER TABLE task_tasks DROP COLUMN assignee_id;
