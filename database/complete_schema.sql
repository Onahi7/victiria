-- =====================================================
-- VICTIRIA BOOKSTORE DATABASE SCHEMA
-- Generated from Drizzle ORM Schema
-- Date: July 7, 2025
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'member', 'guest');

-- Book status enum
CREATE TYPE book_status AS ENUM ('draft', 'published', 'archived');

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Post status enum
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- =====================================================
-- USERS & AUTHENTICATION TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    avatar TEXT,
    phone VARCHAR(20),
    bio TEXT,
    role user_role DEFAULT 'member' NOT NULL,
    email_verified TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Accounts table (for OAuth providers)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(50),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Verification tokens table
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- BOOKS & PRODUCTS TABLES
-- =====================================================

-- Book categories table
CREATE TABLE book_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    excerpt TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cover_image TEXT,
    status book_status DEFAULT 'draft' NOT NULL,
    category VARCHAR(100),
    tags JSONB,
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    digital_download TEXT,
    isbn VARCHAR(50),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Categories table (generic for books and blogs)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'book' or 'blog'
    color VARCHAR(7), -- hex color
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ORDERS & PAYMENTS TABLES
-- =====================================================

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    total DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending' NOT NULL,
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    payment_reference VARCHAR(255),
    tracking_number VARCHAR(100),
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    payment_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status payment_status DEFAULT 'pending' NOT NULL,
    provider VARCHAR(50), -- 'paystack' or 'flutterwave'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Payment transactions table
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    reference VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- 'paystack' or 'flutterwave'
    status VARCHAR(50) NOT NULL, -- 'successful', 'failed', 'pending'
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    metadata JSONB,
    provider_response JSONB,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- USER FEATURES TABLES
-- =====================================================

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
    email_notifications JSONB,
    privacy_settings JSONB,
    reading_preferences JSONB,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Wishlists table
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL, -- 1-5 stars
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Reading progress table
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER,
    percentage INTEGER DEFAULT 0, -- 0-100
    last_read_at TIMESTAMP DEFAULT NOW() NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- BLOG & CONTENT TABLES
-- =====================================================

-- Post categories table
CREATE TABLE post_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Blog posts table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    cover_image TEXT,
    status post_status DEFAULT 'draft' NOT NULL,
    category VARCHAR(100),
    tags JSONB, -- Array of tag strings
    author_id UUID NOT NULL REFERENCES users(id),
    seo_title VARCHAR(255),
    seo_description TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- COMMUNITY TABLES
-- =====================================================

-- Community members table
CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    bio TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Discussions table
CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Discussion replies table
CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES discussion_replies(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    is_online BOOLEAN DEFAULT false,
    max_attendees INTEGER,
    organizer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Event attendees table
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'attending', -- 'attending', 'maybe', 'not_attending'
    registered_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- COURSES & ACADEMY TABLES
-- =====================================================

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    thumbnail_image TEXT,
    instructor_id UUID NOT NULL REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    duration INTEGER, -- in minutes
    level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Course modules table
CREATE TABLE course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    video_url TEXT,
    duration INTEGER, -- in minutes
    "order" INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    progress INTEGER DEFAULT 0, -- percentage 0-100
    completed_at TIMESTAMP,
    enrolled_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- NEWSLETTER TABLES
-- =====================================================

-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    unsubscribed_at TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Books indexes
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_price ON books(price);
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_books_published_at ON books(published_at);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Reviews indexes
CREATE INDEX idx_reviews_book_id ON reviews(book_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Blog posts indexes
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Wishlists indexes
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_book_id ON wishlists(book_id);

-- Reading progress indexes
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_book_id ON reading_progress(book_id);

-- Sessions indexes
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Accounts indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider);

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert sample admin user
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@edifybooks.com', 'Admin User', 'admin', true, NOW(), NOW());

-- Insert sample book categories
INSERT INTO book_categories (name, description, slug, created_at) VALUES
('Fiction', 'Fictional books and novels', 'fiction', NOW()),
('Non-Fiction', 'Non-fictional books', 'non-fiction', NOW()),
('Science', 'Science and technology books', 'science', NOW()),
('Business', 'Business and entrepreneurship books', 'business', NOW()),
('Technology', 'Programming and technology books', 'technology', NOW());

-- Insert sample categories
INSERT INTO categories (name, slug, description, type, is_active, created_at, updated_at) VALUES
('Programming', 'programming', 'Programming and coding books', 'book', true, NOW(), NOW()),
('Self Help', 'self-help', 'Self improvement and help books', 'book', true, NOW(), NOW()),
('News', 'news', 'Latest news and updates', 'blog', true, NOW(), NOW()),
('Tutorials', 'tutorials', 'Educational tutorials and guides', 'blog', true, NOW(), NOW());

-- Insert sample books
INSERT INTO books (title, author, description, price, status, category, stock, is_available, created_at, updated_at) VALUES
('The Art of Programming', 'John Doe', 'A comprehensive guide to programming best practices', 29.99, 'published', 'Technology', 100, true, NOW(), NOW()),
('Building Modern Web Apps', 'Jane Smith', 'Learn to build modern web applications with latest technologies', 39.99, 'published', 'Technology', 75, true, NOW(), NOW()),
('Business Strategy 101', 'Michael Johnson', 'Essential business strategies for entrepreneurs', 24.99, 'published', 'Business', 50, true, NOW(), NOW());

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON reading_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussion_replies_updated_at BEFORE UPDATE ON discussion_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONSTRAINTS AND ADDITIONAL RULES
-- =====================================================

-- Add check constraints
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE reading_progress ADD CONSTRAINT reading_progress_percentage_check CHECK (percentage >= 0 AND percentage <= 100);
ALTER TABLE enrollments ADD CONSTRAINT enrollments_progress_check CHECK (progress >= 0 AND progress <= 100);

-- Add unique constraints for better data integrity
ALTER TABLE wishlists ADD CONSTRAINT wishlists_user_book_unique UNIQUE (user_id, book_id);
ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);
ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_user_event_unique UNIQUE (user_id, event_id);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for book statistics
CREATE VIEW book_stats AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.price,
    b.status,
    b.category,
    COUNT(r.id) as review_count,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT w.user_id) as wishlist_count,
    COUNT(DISTINCT oi.order_id) as sales_count
FROM books b
LEFT JOIN reviews r ON b.id = r.book_id AND r.is_published = true
LEFT JOIN wishlists w ON b.id = w.book_id
LEFT JOIN order_items oi ON b.id = oi.book_id
GROUP BY b.id, b.title, b.author, b.price, b.status, b.category;

-- View for user activity
CREATE VIEW user_activity AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT w.id) as wishlist_items,
    COUNT(DISTINCT rp.id) as reading_books,
    u.created_at as member_since
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN reviews r ON u.id = r.user_id
LEFT JOIN wishlists w ON u.id = w.user_id
LEFT JOIN reading_progress rp ON u.id = rp.user_id
GROUP BY u.id, u.name, u.email, u.role, u.created_at;

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to calculate book average rating
CREATE OR REPLACE FUNCTION calculate_book_rating(book_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM reviews 
    WHERE book_id = book_uuid AND is_published = true;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's reading progress for a book
CREATE OR REPLACE FUNCTION get_reading_progress(user_uuid UUID, book_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    progress_percentage INTEGER;
BEGIN
    SELECT COALESCE(percentage, 0) INTO progress_percentage
    FROM reading_progress 
    WHERE user_id = user_uuid AND book_id = book_uuid;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY POLICIES (RLS)
-- =====================================================

-- Enable Row Level Security on sensitive tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences (users can only see their own)
CREATE POLICY user_preferences_policy ON user_preferences
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Create policies for reading_progress (users can only see their own)
CREATE POLICY reading_progress_policy ON reading_progress
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Create policies for wishlists (users can only see their own)
CREATE POLICY wishlists_policy ON wishlists
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Add comments to document the schema
COMMENT ON DATABASE postgres IS 'Victiria Bookstore Application Database';
COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE books IS 'Book catalog with details and metadata';
COMMENT ON TABLE orders IS 'Customer orders and order management';
COMMENT ON TABLE reviews IS 'Book reviews and ratings from users';
COMMENT ON TABLE blog_posts IS 'Blog content and articles';
COMMENT ON TABLE courses IS 'Educational courses and training materials';
COMMENT ON TABLE discussions IS 'Community discussions and forums';
