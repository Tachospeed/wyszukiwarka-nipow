-- Add phone_number column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS phone_number TEXT;
