-- Add freeDownloads table for tracking free book downloads
CREATE TABLE IF NOT EXISTS "free_downloads" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
  "downloaded_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "source" VARCHAR(50) DEFAULT 'direct', -- direct, newsletter, social, etc.
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_free_downloads_user_id" ON "free_downloads"("user_id");
CREATE INDEX IF NOT EXISTS "idx_free_downloads_book_id" ON "free_downloads"("book_id");
CREATE INDEX IF NOT EXISTS "idx_free_downloads_downloaded_at" ON "free_downloads"("downloaded_at");

-- Add phone field to users table if it doesn't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);

-- Add isFree field to books table if it doesn't exist
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "is_free" BOOLEAN DEFAULT FALSE;

-- Add newsletter subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255),
  "phone" VARCHAR(20),
  "source" VARCHAR(50) DEFAULT 'direct', -- free_download, homepage, blog, etc.
  "status" VARCHAR(20) DEFAULT 'active', -- active, unsubscribed, bounced
  "subscribed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "unsubscribed_at" TIMESTAMP WITH TIME ZONE,
  "preferences" JSONB DEFAULT '{}', -- email preferences, frequency, etc.
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for newsletter subscribers
CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_email" ON "newsletter_subscribers"("email");
CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_status" ON "newsletter_subscribers"("status");
CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_source" ON "newsletter_subscribers"("source");
CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_subscribed_at" ON "newsletter_subscribers"("subscribed_at");

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_free_downloads_updated_at ON "free_downloads";
CREATE TRIGGER update_free_downloads_updated_at
  BEFORE UPDATE ON "free_downloads"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON "newsletter_subscribers";
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON "newsletter_subscribers"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO "newsletter_subscribers" (email, name, source, status) VALUES
  ('test1@example.com', 'Test User 1', 'free_download', 'active'),
  ('test2@example.com', 'Test User 2', 'homepage', 'active'),
  ('test3@example.com', 'Test User 3', 'free_download', 'unsubscribed')
ON CONFLICT (email) DO NOTHING;
