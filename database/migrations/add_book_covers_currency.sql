-- Add support for front/back cover images and dual currency pricing
-- Migration: Add book covers and dual currency support

-- Add new columns to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS back_cover_image TEXT,
ADD COLUMN IF NOT EXISTS front_cover_image TEXT,
ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_ngn DECIMAL(10,2);

-- Update existing books to use front_cover_image from coverImage
UPDATE books 
SET front_cover_image = cover_image 
WHERE cover_image IS NOT NULL AND front_cover_image IS NULL;

-- Migrate existing price to appropriate currency based on value heuristic
UPDATE books 
SET price_ngn = price 
WHERE price > 1000 AND price_ngn IS NULL;

UPDATE books 
SET price_usd = price 
WHERE price <= 1000 AND price_usd IS NULL;

-- Remove the old currency column if it exists and add constraints
ALTER TABLE books DROP COLUMN IF EXISTS currency;

-- Add check constraints to ensure at least one price is set
ALTER TABLE books 
ADD CONSTRAINT check_at_least_one_price 
CHECK (price_usd IS NOT NULL OR price_ngn IS NOT NULL);

-- Create indexes for price filtering
CREATE INDEX IF NOT EXISTS idx_books_price_usd ON books(price_usd);
CREATE INDEX IF NOT EXISTS idx_books_price_ngn ON books(price_ngn);

-- Add comments for documentation
COMMENT ON COLUMN books.front_cover_image IS 'URL of the front cover image';
COMMENT ON COLUMN books.back_cover_image IS 'URL of the back cover image (optional)';
COMMENT ON COLUMN books.price_usd IS 'Price in US Dollars (routes to PayPal/MTN MOMO)';
COMMENT ON COLUMN books.price_ngn IS 'Price in Nigerian Naira (routes to Paystack)';
