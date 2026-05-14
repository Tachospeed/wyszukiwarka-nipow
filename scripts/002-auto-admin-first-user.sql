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
