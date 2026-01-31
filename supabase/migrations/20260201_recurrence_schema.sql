-- Add recurrence columns to tasks table
ALTER TABLE tasks
ADD COLUMN recurrence_type text CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_interval integer DEFAULT 1,
ADD COLUMN recurrence_end_date timestamptz,
ADD COLUMN parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

COMMENT ON COLUMN tasks.recurrence_type IS 'Type of recurrence: daily, weekly, or monthly';
COMMENT ON COLUMN tasks.recurrence_interval IS 'Interval of recurrence (e.g., every 2 days)';
COMMENT ON COLUMN tasks.recurrence_end_date IS 'Date when recurrence ends (optional)';
COMMENT ON COLUMN tasks.parent_task_id IS 'ID of the original task if this is a recurring instance';
