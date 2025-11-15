-- Add address field to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN contacts.address IS 'Physical address of the contact';
