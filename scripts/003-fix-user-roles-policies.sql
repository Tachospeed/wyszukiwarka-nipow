-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow admin to manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to read their own role" ON public.user_roles;

-- Drop the problematic RPC function
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Create simpler policies that don't cause recursion
-- Policy 1: Users can read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Service role can do everything (bypasses RLS)
-- This policy is implicit when using service_role key

-- Create a new RPC function that uses service role privileges
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    is_admin_role BOOLEAN := FALSE;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return false
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin role
    -- This query runs with SECURITY DEFINER privileges, bypassing RLS
    SELECT EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = current_user_id AND role = 'admin'
    ) INTO is_admin_role;
    
    RETURN is_admin_role;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, return false for security
        RETURN FALSE;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Auto-assign admin role to the first user if no admin exists
DO $$
DECLARE
    first_user_id UUID;
    admin_count INTEGER;
BEGIN
    -- Check if there are any admins
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_roles 
    WHERE role = 'admin';
    
    -- If no admins exist, make the first user (by creation date) an admin
    IF admin_count = 0 THEN
        SELECT id INTO first_user_id 
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF first_user_id IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (first_user_id, 'admin')
            ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
            
            RAISE NOTICE 'Auto-assigned admin role to first user: %', first_user_id;
        END IF;
    END IF;
END $$;
