-- Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DO $$
BEGIN
IF NOT EXISTS (
  SELECT 1
  FROM pg_trigger
  WHERE tgname = 'set_user_roles_timestamp' AND tgrelid = 'public.user_roles'::regclass
) THEN
  CREATE TRIGGER set_user_roles_timestamp
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
END IF;
END
$$;


-- Enable RLS on the table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent errors on re-run)
DROP POLICY IF EXISTS "Allow admin to manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to read their own role" ON public.user_roles;

-- Policy: Admins can manage all user roles
CREATE POLICY "Allow admin to manage all user roles"
ON public.user_roles
FOR ALL
USING (
EXISTS (
  SELECT 1
  FROM public.user_roles ur_check
  WHERE ur_check.user_id = auth.uid() AND ur_check.role = 'admin'
)
)
WITH CHECK (
EXISTS (
  SELECT 1
  FROM public.user_roles ur_check
  WHERE ur_check.user_id = auth.uid() AND ur_check.role = 'admin'
)
);

-- Policy: Authenticated users can read their own role
CREATE POLICY "Allow users to read their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Helper function to check if the current user is an admin
-- This function is callable from SQL and by Supabase client RPC
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executes with the permissions of the user that defined the function
SET search_path = public -- Ensures it can find user_roles table
AS $$
DECLARE
is_admin_role BOOLEAN;
BEGIN
SELECT EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
) INTO is_admin_role;
RETURN is_admin_role;
END;
$$;

-- Seed an admin user (replace with an actual admin user's ID after they sign up)
-- Example: To make the first user an admin:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ((SELECT id FROM auth.users ORDER BY created_at LIMIT 1), 'admin')
-- ON CONFLICT (user_id) DO NOTHING;
-- You'll need to run this manually or ensure your first registered user gets an admin role.
-- For testing, you can find a user_id from your Supabase dashboard (Authentication -> Users)
-- and insert it like:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('your-test-admin-user-uuid', 'admin') ON CONFLICT (user_id) DO NOTHING;
