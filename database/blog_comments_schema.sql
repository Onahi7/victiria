-- Blog Comments Table
-- This table stores comments and replies for blog posts

CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_author_id ON blog_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_blog_comments_timestamp
BEFORE UPDATE ON blog_comments
FOR EACH ROW
EXECUTE FUNCTION update_blog_comments_updated_at();

-- Add comment for documentation
COMMENT ON TABLE blog_comments IS 'Stores comments and nested replies for blog posts with author information and like counts';
COMMENT ON COLUMN blog_comments.parent_id IS 'References parent comment for threaded replies, NULL for top-level comments';
COMMENT ON COLUMN blog_comments.likes IS 'Number of likes/upvotes for the comment';
