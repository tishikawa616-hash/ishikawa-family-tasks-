-- Add harvest tracking columns to work_logs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_logs' AND column_name = 'harvest_quantity') THEN
        ALTER TABLE work_logs ADD COLUMN harvest_quantity numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_logs' AND column_name = 'harvest_unit') THEN
        ALTER TABLE work_logs ADD COLUMN harvest_unit text DEFAULT 'kg';
    END IF;
END $$;

-- Create profiles table if it doesn't exist (it manages user specific settings like hourly wage)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    display_name text,
    avatar_url text,
    hourly_wage integer DEFAULT 1000,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- If profiles table existed but didn't have hourly_wage, add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hourly_wage') THEN
        ALTER TABLE profiles ADD COLUMN hourly_wage integer DEFAULT 1000;
    END IF;
END $$;
