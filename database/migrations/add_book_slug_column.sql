-- Add slug column to books table
-- This migration adds the slug column and generates slugs for existing books

BEGIN;

-- Add the slug column (nullable first)
ALTER TABLE books ADD COLUMN slug VARCHAR(255);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s\-]', '', 'g'), -- Remove special chars
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ), 
      '-+', '-', 'g'  -- Replace multiple hyphens with single
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing books with generated slugs
UPDATE books 
SET slug = generate_slug(title) || CASE 
  WHEN EXISTS (
    SELECT 1 FROM books b2 
    WHERE b2.id != books.id 
    AND generate_slug(b2.title) = generate_slug(books.title)
  ) 
  THEN '-' || substring(books.id::text, 1, 8)
  ELSE ''
END
WHERE slug IS NULL;

-- Make slug column NOT NULL and add unique constraint
ALTER TABLE books ALTER COLUMN slug SET NOT NULL;
ALTER TABLE books ADD CONSTRAINT books_slug_unique UNIQUE (slug);

-- Drop the helper function
DROP FUNCTION generate_slug(TEXT);

COMMIT;
