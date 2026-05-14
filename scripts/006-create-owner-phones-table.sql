-- Create a new table to store phone numbers for CRM owners by email
CREATE TABLE IF NOT EXISTS public.owner_phone_numbers (
  email TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to update updated_at on row update
DO $$
BEGIN
IF NOT EXISTS (
  SELECT 1
  FROM pg_trigger
  WHERE tgname = 'set_owner_phones_timestamp' AND tgrelid = 'public.owner_phone_numbers'::regclass
) THEN
  CREATE TRIGGER set_owner_phones_timestamp
  BEFORE UPDATE ON public.owner_phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
END IF;
END
$$;

-- Disable RLS for simplicity, as this will be managed by the admin backend
ALTER TABLE public.owner_phone_numbers DISABLE ROW LEVEL SECURITY;
