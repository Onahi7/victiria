-- Migration: Add cart_items table
-- Date: 2025-08-02

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "book_id" uuid NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
  "quantity" integer DEFAULT 1 NOT NULL,
  "added_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add unique constraint to prevent duplicate cart items for same user/book
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_user_book_unique" ON "cart_items" ("user_id", "book_id");

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "cart_items_user_id_idx" ON "cart_items" ("user_id");
CREATE INDEX IF NOT EXISTS "cart_items_book_id_idx" ON "cart_items" ("book_id");
