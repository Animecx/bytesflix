ALTER TABLE series ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS series_slug_key ON series (slug);