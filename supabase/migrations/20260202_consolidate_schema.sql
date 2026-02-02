-- Consolidate Schema Migration
-- Includes:
-- 1. Tables from new accounting schema (acc_*)
-- 2. Tables from original task app (task_*)
-- 3. Fixed Assets table

-- Create Task App Tables (Prefix: task_)
CREATE TABLE IF NOT EXISTS task_profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  name text,
  color text,
  location text,
  description text,
  hourly_wage integer DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS task_fields (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color text,
  area numeric,
  crop text,
  description text
);

CREATE TABLE IF NOT EXISTS task_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  priority text,
  status text,
  due_date timestamp with time zone,
  tags text[],
  assignee_id uuid REFERENCES auth.users,
  field_id uuid REFERENCES task_fields,
  recurrence_type text,
  recurrence_interval integer,
  recurrence_end_date timestamp with time zone,
  parent_task_id uuid REFERENCES task_tasks(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_work_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid REFERENCES task_tasks(id),
    user_id uuid REFERENCES auth.users,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    duration numeric,
    harvest_quantity numeric,
    harvest_unit text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- ACCOUTING SCHEMA (Prefix: acc_)

-- 1. Account Types
CREATE TABLE IF NOT EXISTS acc_account_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  classification text NOT NULL -- 'income', 'expense', 'asset', 'liability'
);

INSERT INTO acc_account_types (id, name, classification) VALUES
(1, '売上', 'income'),
(2, '事業経費', 'expense'),
(3, '家計支出', 'expense'), -- Added for household
(4, '資産', 'asset'),
(5, '負債', 'liability')
ON CONFLICT (id) DO NOTHING;

-- 2. Accounts
CREATE TABLE IF NOT EXISTS acc_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  name_simple text,
  account_type_id integer REFERENCES acc_account_types(id),
  is_default boolean DEFAULT false,
  business_ratio integer DEFAULT 100, -- 0-100%
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Family Groups
CREATE TABLE IF NOT EXISTS acc_family_groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Family Group Members
CREATE TABLE IF NOT EXISTS acc_family_group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES acc_family_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users NOT NULL,
  role text DEFAULT 'member', -- 'owner', 'member'
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 5. Transactions
CREATE TABLE IF NOT EXISTS acc_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  group_id uuid REFERENCES acc_family_groups(id),
  account_id uuid REFERENCES acc_accounts(id) NOT NULL,
  amount integer NOT NULL,
  date date NOT NULL,
  description text,
  image_url text,
  ocr_text text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Transaction Comments
CREATE TABLE IF NOT EXISTS acc_transaction_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES acc_transactions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Monthly Notes (Budget/Memo)
CREATE TABLE IF NOT EXISTS acc_monthly_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  group_id uuid REFERENCES acc_family_groups(id),
  month date NOT NULL, -- YYYY-MM-01
  budget integer,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, month, group_id)
);

-- 8. Family Members (Manual Assets)
CREATE TABLE IF NOT EXISTS acc_family_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users, -- Owner of this record
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. Wallets (Assets)
CREATE TABLE IF NOT EXISTS acc_wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES acc_family_members(id) ON DELETE CASCADE,
  name text NOT NULL,
  wallet_type text NOT NULL, -- 'cash', 'bank'
  balance integer DEFAULT 0,
  display_order integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 10. Inventory Items
CREATE TABLE IF NOT EXISTS acc_inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  fiscal_year integer NOT NULL, -- 2024
  item_name text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_price integer NOT NULL,
  total_value integer NOT NULL,
  memo text,
  created_at timestamp with time zone DEFAULT now()
);

-- 11. Fixed Assets (NEW)
CREATE TABLE IF NOT EXISTS acc_fixed_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  group_id uuid REFERENCES acc_family_groups(id),
  name text NOT NULL,
  purchase_date date NOT NULL,
  purchase_price integer NOT NULL,
  useful_life_years integer NOT NULL,
  residual_value integer DEFAULT 0,
  memo text,
  created_at timestamp with time zone DEFAULT now()
);


-- Initial Data (Accounts)
INSERT INTO acc_accounts (code, name, name_simple, account_type_id, business_ratio) VALUES
('4101', '種苗費', '種・苗', 2, 100),
('4102', '肥料費', '肥料', 2, 100),
('4103', '農薬衛生費', '農薬', 2, 100),
('4104', '農具費', '道具', 2, 100),
('4105', '動力光熱費', 'ガソリン・電気', 2, 50),
('4106', '修繕費', '修理', 2, 100),
('4107', '諸材料費', '資材', 2, 100),
('4108', '荷造運賃手数料', '送料・手数料', 2, 100),
('4109', '地代・賃借料', 'レンタル・土地代', 2, 100),
('4110', '雇人費', '人件費', 2, 100),
('4111', '租税公課', '税金・手数料', 2, 100),
('4112', '農業共済掛金', '保険', 2, 100),
('4113', '作業用衣料費', '作業着', 2, 100),
('4114', '土地改良費', '土地改良', 2, 100),
('4115', '利子割引料', '利息', 2, 100),
('4199', '雑費', 'その他', 2, 100),
('5001', '売上高', '売上', 1, 100),
('5002', '家事消費', '自家消費', 1, 100),
('5003', '雑収入', 'その他収入', 1, 100),
-- Household Expenses
('6001', '食費', '食費', 3, 0),
('6002', '日用品', '日用品', 3, 0),
('6003', '衣服美容', '服・美容', 3, 0),
('6004', '医療費', '病院・薬', 3, 0),
('6005', '交通費', '交通費', 3, 0),
('6006', '通信費', 'スマホ・ネット', 3, 30), -- Partial business use potential
('6007', '教育費', '教育', 3, 0),
('6008', '娯楽費', '遊び', 3, 0),
('6099', 'その他家計', 'その他', 3, 0)
ON CONFLICT DO NOTHING;
