-- Remove the phone_number column from user_roles if it exists
ALTER TABLE public.user_roles
DROP COLUMN IF EXISTS phone_number;
