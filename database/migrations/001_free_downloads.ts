import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { db } from '@/lib/db'

export async function up() {
  // Add freeDownloads table for tracking free book downloads
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "free_downloads" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
      "downloaded_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "ip_address" VARCHAR(45),
      "user_agent" TEXT,
      "source" VARCHAR(50) DEFAULT 'direct',
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // Add indexes for performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_free_downloads_user_id" ON "free_downloads"("user_id")
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_free_downloads_book_id" ON "free_downloads"("book_id")
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_free_downloads_downloaded_at" ON "free_downloads"("downloaded_at")
  `)

  // Add phone field to users table if it doesn't exist
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20)
  `)

  // Add isFree field to books table if it doesn't exist
  await db.execute(sql`
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "is_free" BOOLEAN DEFAULT FALSE
  `)

  // Update newsletter subscribers table
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20)
  `)
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "source" VARCHAR(50) DEFAULT 'direct'
  `)
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'active'
  `)
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "unsubscribed_at" TIMESTAMP WITH TIME ZONE
  `)
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{}'
  `)
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  `)
  await db.execute(sql`
    ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  `)

  // Add indexes for newsletter subscribers
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_email" ON "newsletter_subscribers"("email")
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_status" ON "newsletter_subscribers"("status")
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_source" ON "newsletter_subscribers"("source")
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_newsletter_subscribers_subscribed_at" ON "newsletter_subscribers"("subscribed_at")
  `)

  // Add trigger function to update updated_at timestamp
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `)

  // Apply triggers
  await db.execute(sql`
    DROP TRIGGER IF EXISTS update_free_downloads_updated_at ON "free_downloads"
  `)
  await db.execute(sql`
    CREATE TRIGGER update_free_downloads_updated_at
      BEFORE UPDATE ON "free_downloads"
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `)

  await db.execute(sql`
    DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON "newsletter_subscribers"
  `)
  await db.execute(sql`
    CREATE TRIGGER update_newsletter_subscribers_updated_at
      BEFORE UPDATE ON "newsletter_subscribers"
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `)

  console.log('✅ Free downloads migration completed successfully')
}

export async function down() {
  // Remove triggers
  await db.execute(sql`
    DROP TRIGGER IF EXISTS update_free_downloads_updated_at ON "free_downloads"
  `)
  await db.execute(sql`
    DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON "newsletter_subscribers"
  `)

  // Remove indexes
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_free_downloads_user_id"
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_free_downloads_book_id"
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_free_downloads_downloaded_at"
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_newsletter_subscribers_email"
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_newsletter_subscribers_status"
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_newsletter_subscribers_source"
  `)
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_newsletter_subscribers_subscribed_at"
  `)

  // Remove tables
  await db.execute(sql`
    DROP TABLE IF EXISTS "free_downloads"
  `)

  console.log('✅ Free downloads migration rolled back successfully')
}
