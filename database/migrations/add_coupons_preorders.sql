-- Migration: Add coupons and preorders system
-- Date: 2025-08-02

-- Coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(50) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "type" varchar(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  "value" decimal(10, 2) NOT NULL,
  "min_order_amount" decimal(10, 2) DEFAULT 0,
  "max_discount_amount" decimal(10, 2),
  "usage_limit" integer,
  "used_count" integer DEFAULT 0,
  "user_limit" integer DEFAULT 1,
  "applies_to" varchar(20) NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'books', 'courses', 'specific')),
  "applicable_items" jsonb, -- Array of book/course IDs if applies_to = 'specific'
  "is_active" boolean DEFAULT true,
  "starts_at" timestamp NOT NULL,
  "expires_at" timestamp,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS "coupon_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "coupon_id" uuid NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "discount_amount" decimal(10, 2) NOT NULL,
  "used_at" timestamp DEFAULT now() NOT NULL
);

-- Book preorders
CREATE TABLE IF NOT EXISTS "book_preorders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "book_id" uuid NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
  "preorder_start" timestamp NOT NULL,
  "preorder_end" timestamp NOT NULL,
  "release_date" timestamp NOT NULL,
  "early_access_discount" decimal(5, 2) DEFAULT 0, -- Percentage discount for preorders
  "max_preorder_quantity" integer,
  "current_preorder_count" integer DEFAULT 0,
  "preorder_benefits" jsonb, -- Array of benefits (early access, bonus content, etc.)
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Preorder purchases tracking
CREATE TABLE IF NOT EXISTS "preorder_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "preorder_id" uuid NOT NULL REFERENCES "book_preorders"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "discount_applied" decimal(10, 2) DEFAULT 0,
  "notification_sent" boolean DEFAULT false,
  "purchased_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" ("code");
CREATE INDEX IF NOT EXISTS "coupons_active_idx" ON "coupons" ("is_active", "starts_at", "expires_at");
CREATE INDEX IF NOT EXISTS "coupon_usage_coupon_id_idx" ON "coupon_usage" ("coupon_id");
CREATE INDEX IF NOT EXISTS "coupon_usage_user_id_idx" ON "coupon_usage" ("user_id");
CREATE INDEX IF NOT EXISTS "book_preorders_book_id_idx" ON "book_preorders" ("book_id");
CREATE INDEX IF NOT EXISTS "book_preorders_active_idx" ON "book_preorders" ("is_active", "preorder_start", "preorder_end");
CREATE INDEX IF NOT EXISTS "preorder_purchases_preorder_id_idx" ON "preorder_purchases" ("preorder_id");
CREATE INDEX IF NOT EXISTS "preorder_purchases_user_id_idx" ON "preorder_purchases" ("user_id");

-- Add unique constraint for user preorder purchases
CREATE UNIQUE INDEX IF NOT EXISTS "preorder_purchases_user_preorder_unique" ON "preorder_purchases" ("preorder_id", "user_id");
