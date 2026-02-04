-- Comprehensive RLS Fix
-- すべての関連テーブルに対して、認証済みユーザーへのフルアクセス権限を付与します。

-- 1. task_tasks
ALTER TABLE task_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON task_tasks;
CREATE POLICY "Enable all access for authenticated users" ON task_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. task_work_logs
ALTER TABLE task_work_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON task_work_logs;
CREATE POLICY "Enable all access for authenticated users" ON task_work_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. task_profiles
ALTER TABLE task_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON task_profiles;
CREATE POLICY "Enable all access for authenticated users" ON task_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. task_fields
ALTER TABLE task_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON task_fields;
CREATE POLICY "Enable all access for authenticated users" ON task_fields FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. acc_ prefixed tables (for accounting app compatibility if strict RLS is on)
-- Just in case, grant for acc_transactions etc if they are used
ALTER TABLE acc_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON acc_transactions;
CREATE POLICY "Enable all access for authenticated users" ON acc_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
