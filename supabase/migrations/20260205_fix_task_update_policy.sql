-- Fix Task Update Policy for Completed Tasks
-- 完了タスクを含むすべてのタスクの更新を許可するためのポリシーを追加します

-- 1. task_tasks テーブルのRLSを確実に有効化 (既に有効な場合もエラーにはなりません)
ALTER TABLE task_tasks ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーと競合しないよう、包括的な許可ポリシーを作成
-- "Enable all access for authenticated users" 
-- 認証済みユーザーに対して、SELECT, INSERT, UPDATE, DELETE すべてを許可します
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'task_tasks' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users"
        ON task_tasks
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
