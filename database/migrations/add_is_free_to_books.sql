-- Add isFree column to books table
-- Migration: add_is_free_to_books_table

ALTER TABLE books 
ADD COLUMN is_free BOOLEAN DEFAULT false;

-- Update existing books to set appropriate isFree values
-- Books with price 0 or null can be considered free
UPDATE books 
SET is_free = true 
WHERE (price IS NULL OR price = 0) 
  AND (price_usd IS NULL OR price_usd = 0) 
  AND (price_ngn IS NULL OR price_ngn = 0);

-- Add index for better query performance
CREATE INDEX idx_books_is_free ON books(is_free);

-- Add comment to document the column
COMMENT ON COLUMN books.is_free IS 'Indicates if the book is available for free download without purchase';
