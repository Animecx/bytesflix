-- Add scheduling columns to popups table
ALTER TABLE popups
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz;
