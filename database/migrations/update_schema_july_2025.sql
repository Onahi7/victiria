-- =====================================================
-- VICTIRIA BOOKSTORE DATABASE MIGRATION
-- Update existing schema to match schema.ts
-- Date: July 17, 2025
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- UPDATE EXISTING ENUMS AND CREATE NEW ONES
-- =====================================================

-- Update user_role enum to include 'author' and 'reader', and change 'member' to 'reader'
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('admin', 'author', 'reader', 'guest');

-- Update users table to use new enum and migrate data
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role::text = 'member' THEN 'reader'::user_role
    WHEN role::text = 'admin' THEN 'admin'::user_role
    ELSE 'reader'::user_role
  END;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'reader';

-- Drop old enum
DROP TYPE user_role_old;

-- Update book_status enum to include new statuses
ALTER TYPE book_status RENAME TO book_status_old;
CREATE TYPE book_status AS ENUM ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived');

-- Update books table to use new enum
ALTER TABLE books ALTER COLUMN status DROP DEFAULT;
ALTER TABLE books ALTER COLUMN status TYPE book_status USING 
  CASE 
    WHEN status::text = 'draft' THEN 'draft'::book_status
    WHEN status::text = 'published' THEN 'published'::book_status
    WHEN status::text = 'archived' THEN 'archived'::book_status
    ELSE 'draft'::book_status
  END;
ALTER TABLE books ALTER COLUMN status SET DEFAULT 'draft';

-- Drop old enum
DROP TYPE book_status_old;

-- Create new enums that don't exist
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published');
CREATE TYPE event_type AS ENUM ('workshop', 'webinar', 'book_launch', 'masterclass', 'meet_greet', 'conference');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE registration_status AS ENUM ('registered', 'attended', 'cancelled', 'no_show');

-- =====================================================
-- UPDATE EXISTING TABLES WITH NEW COLUMNS
-- =====================================================

-- Update books table with new author publishing features
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS book_file TEXT,
ADD COLUMN IF NOT EXISTS page_count INTEGER,
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS royalty_rate DECIMAL(5, 2) DEFAULT 70.00,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS author_revenue DECIMAL(12, 2) DEFAULT 0.00;

-- Update events table with comprehensive event management features
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS short_description VARCHAR(500),
ADD COLUMN IF NOT EXISTS type event_type,
ADD COLUMN IF NOT EXISTS status event_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS agenda JSONB,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS what_you_will_learn TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP;

-- =====================================================
-- CREATE NEW TABLES FOR AUTHOR PUBLISHING PLATFORM
-- =====================================================

-- Book submissions table for author publishing workflow
CREATE TABLE IF NOT EXISTS book_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    book_id UUID REFERENCES books(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    manuscript_file TEXT NOT NULL,
    cover_image TEXT,
    synopsis TEXT,
    author_bio TEXT,
    target_audience TEXT,
    marketing_plan TEXT,
    status submission_status DEFAULT 'draft' NOT NULL,
    submission_fee DECIMAL(10, 2) DEFAULT 5000.00,
    fee_payment_status payment_status DEFAULT 'pending',
    fee_payment_reference VARCHAR(255),
    submitted_at TIMESTAMP,
    review_started_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Author revenue tracking table
CREATE TABLE IF NOT EXISTS author_revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    sale_amount DECIMAL(10, 2) NOT NULL,
    royalty_rate DECIMAL(5, 2) NOT NULL,
    author_earning DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP,
    payment_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Author payouts table
CREATE TABLE IF NOT EXISTS author_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    bank_details JSONB,
    payment_reference VARCHAR(255),
    processed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Author-admin communications table
CREATE TABLE IF NOT EXISTS author_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    admin_id UUID REFERENCES users(id),
    submission_id UUID REFERENCES book_submissions(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_from_author BOOLEAN NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal',
    attachments JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    read_at TIMESTAMP
);

-- Author profiles table (extended user info for authors)
CREATE TABLE IF NOT EXISTS author_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(255),
    bio TEXT,
    website VARCHAR(255),
    social_links JSONB,
    genres JSONB,
    publishing_goals TEXT,
    experience TEXT,
    education TEXT,
    awards JSONB,
    total_books INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    bank_details JSONB,
    tax_info JSONB,
    contract_signed BOOLEAN DEFAULT false,
    contract_signed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- UPDATE EVENT REGISTRATION SYSTEM
-- =====================================================

-- Drop old event_attendees table and create new event_registrations
DROP TABLE IF EXISTS event_attendees;

CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    status registration_status DEFAULT 'registered',
    payment_status payment_status DEFAULT 'pending',
    payment_reference VARCHAR(255),
    amount_paid DECIMAL(10, 2),
    special_requests TEXT,
    attended_at TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT false,
    registered_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CREATE COURSE REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    is_verified_enrollment BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    instructor_reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CREATE TRIGGERS FOR NEW TABLES
-- =====================================================

-- Create triggers for updated_at columns on new tables
CREATE TRIGGER update_book_submissions_updated_at 
    BEFORE UPDATE ON book_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_author_payouts_updated_at 
    BEFORE UPDATE ON author_payouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_author_profiles_updated_at 
    BEFORE UPDATE ON author_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at 
    BEFORE UPDATE ON event_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at 
    BEFORE UPDATE ON course_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADD NEW CONSTRAINTS
-- =====================================================

-- Add rating constraints for course reviews
ALTER TABLE course_reviews ADD CONSTRAINT course_reviews_rating_check CHECK (rating >= 1 AND rating <= 5);

-- Add unique constraints
ALTER TABLE author_profiles ADD CONSTRAINT author_profiles_user_id_unique UNIQUE (user_id);
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_user_event_unique UNIQUE (user_id, event_id);
ALTER TABLE course_reviews ADD CONSTRAINT course_reviews_user_course_unique UNIQUE (user_id, course_id);

-- =====================================================
-- CREATE NEW INDEXES FOR PERFORMANCE
-- =====================================================

-- Author publishing indexes
CREATE INDEX IF NOT EXISTS idx_book_submissions_author_id ON book_submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_book_submissions_status ON book_submissions(status);
CREATE INDEX IF NOT EXISTS idx_book_submissions_created_at ON book_submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_author_revenues_author_id ON author_revenues(author_id);
CREATE INDEX IF NOT EXISTS idx_author_revenues_book_id ON author_revenues(book_id);
CREATE INDEX IF NOT EXISTS idx_author_revenues_order_id ON author_revenues(order_id);
CREATE INDEX IF NOT EXISTS idx_author_revenues_status ON author_revenues(status);

CREATE INDEX IF NOT EXISTS idx_author_payouts_author_id ON author_payouts(author_id);
CREATE INDEX IF NOT EXISTS idx_author_payouts_status ON author_payouts(status);
CREATE INDEX IF NOT EXISTS idx_author_payouts_created_at ON author_payouts(created_at);

CREATE INDEX IF NOT EXISTS idx_author_messages_author_id ON author_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_author_messages_admin_id ON author_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_author_messages_submission_id ON author_messages(submission_id);
CREATE INDEX IF NOT EXISTS idx_author_messages_is_read ON author_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_author_profiles_user_id ON author_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_author_profiles_is_verified ON author_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_author_profiles_status ON author_profiles(status);

-- Event system indexes
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_free ON events(is_free);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON event_registrations(payment_status);

-- Course reviews indexes
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_course_reviews_is_published ON course_reviews(is_published);

-- Additional book indexes
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_reviewed_by ON books(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_books_royalty_rate ON books(royalty_rate);
CREATE INDEX IF NOT EXISTS idx_books_sales_count ON books(sales_count);

-- =====================================================
-- UPDATE VIEWS TO INCLUDE NEW FEATURES
-- =====================================================

-- Drop and recreate book_stats view with new columns
DROP VIEW IF EXISTS book_stats;
CREATE VIEW book_stats AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.author_id,
    b.price,
    b.status,
    b.category,
    b.sales_count,
    b.total_revenue,
    b.author_revenue,
    b.royalty_rate,
    COUNT(r.id) as review_count,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT w.user_id) as wishlist_count,
    COUNT(DISTINCT oi.order_id) as order_count
FROM books b
LEFT JOIN reviews r ON b.id = r.book_id AND r.is_published = true
LEFT JOIN wishlists w ON b.id = w.book_id
LEFT JOIN order_items oi ON b.id = oi.book_id
GROUP BY b.id, b.title, b.author, b.author_id, b.price, b.status, b.category, b.sales_count, b.total_revenue, b.author_revenue, b.royalty_rate;

-- Create new views for author dashboard
CREATE VIEW author_dashboard_stats AS
SELECT 
    u.id as author_id,
    u.name as author_name,
    ap.total_books,
    ap.total_sales,
    ap.total_revenue,
    COUNT(DISTINCT bs.id) as pending_submissions,
    COUNT(DISTINCT am.id) FILTER (WHERE am.is_read = false AND am.is_from_author = false) as unread_messages,
    SUM(ar.author_earning) FILTER (WHERE ar.status = 'pending') as pending_earnings
FROM users u
LEFT JOIN author_profiles ap ON u.id = ap.user_id
LEFT JOIN book_submissions bs ON u.id = bs.author_id AND bs.status IN ('submitted', 'under_review')
LEFT JOIN author_messages am ON u.id = am.author_id
LEFT JOIN author_revenues ar ON u.id = ar.author_id
WHERE u.role = 'author'
GROUP BY u.id, u.name, ap.total_books, ap.total_sales, ap.total_revenue;

-- Create event statistics view
CREATE VIEW event_stats AS
SELECT 
    e.id,
    e.title,
    e.type,
    e.status,
    e.start_date,
    e.price,
    e.is_free,
    e.max_attendees,
    COUNT(er.id) as total_registrations,
    COUNT(er.id) FILTER (WHERE er.status = 'registered') as confirmed_registrations,
    COUNT(er.id) FILTER (WHERE er.status = 'attended') as actual_attendees,
    SUM(er.amount_paid) as total_revenue
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.title, e.type, e.status, e.start_date, e.price, e.is_free, e.max_attendees;

-- =====================================================
-- CREATE FUNCTIONS FOR NEW FEATURES
-- =====================================================

-- Function to calculate author earnings for a sale
CREATE OR REPLACE FUNCTION calculate_author_earnings(
    book_uuid UUID,
    sale_amount DECIMAL(10, 2)
) RETURNS TABLE (
    author_earning DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    royalty_rate DECIMAL(5, 2)
) AS $$
DECLARE
    book_royalty_rate DECIMAL(5, 2);
BEGIN
    SELECT b.royalty_rate INTO book_royalty_rate
    FROM books b
    WHERE b.id = book_uuid;
    
    IF book_royalty_rate IS NULL THEN
        book_royalty_rate := 70.00; -- Default 70%
    END IF;
    
    RETURN QUERY SELECT 
        ROUND(sale_amount * book_royalty_rate / 100, 2) as author_earning,
        ROUND(sale_amount * (100 - book_royalty_rate) / 100, 2) as platform_fee,
        book_royalty_rate as royalty_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update book sales statistics
CREATE OR REPLACE FUNCTION update_book_sales_stats(
    book_uuid UUID,
    sale_amount DECIMAL(10, 2)
) RETURNS VOID AS $$
DECLARE
    earnings_data RECORD;
BEGIN
    -- Calculate earnings
    SELECT * INTO earnings_data FROM calculate_author_earnings(book_uuid, sale_amount);
    
    -- Update book statistics
    UPDATE books 
    SET 
        sales_count = sales_count + 1,
        total_revenue = total_revenue + sale_amount,
        author_revenue = author_revenue + earnings_data.author_earning,
        updated_at = NOW()
    WHERE id = book_uuid;
    
    -- Update author profile statistics
    UPDATE author_profiles 
    SET 
        total_sales = total_sales + 1,
        total_revenue = total_revenue + earnings_data.author_earning,
        updated_at = NOW()
    WHERE user_id = (SELECT author_id FROM books WHERE id = book_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to get event availability
CREATE OR REPLACE FUNCTION get_event_availability(event_uuid UUID)
RETURNS TABLE (
    is_available BOOLEAN,
    spots_remaining INTEGER,
    registration_open BOOLEAN
) AS $$
DECLARE
    event_data RECORD;
    registration_count INTEGER;
BEGIN
    SELECT 
        e.max_attendees,
        e.registration_deadline,
        e.start_date,
        e.status,
        e.is_published
    INTO event_data
    FROM events e
    WHERE e.id = event_uuid;
    
    SELECT COUNT(*) INTO registration_count
    FROM event_registrations er
    WHERE er.event_id = event_uuid AND er.status = 'registered';
    
    RETURN QUERY SELECT 
        -- Is available if published, not full, and registration is open
        (event_data.is_published AND 
         (event_data.max_attendees IS NULL OR registration_count < event_data.max_attendees) AND
         NOW() < COALESCE(event_data.registration_deadline, event_data.start_date) AND
         event_data.status = 'published') as is_available,
        
        -- Spots remaining
        CASE 
            WHEN event_data.max_attendees IS NULL THEN NULL
            ELSE (event_data.max_attendees - registration_count)
        END as spots_remaining,
        
        -- Registration open
        (NOW() < COALESCE(event_data.registration_deadline, event_data.start_date) AND
         event_data.status = 'published') as registration_open;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POPULATE DEFAULT DATA FOR NEW FEATURES
-- =====================================================

-- Create admin user for EdifyPub
INSERT INTO users (
    id, 
    email, 
    name, 
    password,
    role, 
    is_active, 
    email_verified,
    created_at, 
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@edifybooks.com',
    'EdifyPub Admin',
    '$2a$12$jNJIjltr/hO4Hj7orl5UC.g6.ozxfCicjPnfQTZ437v6OnYxRI6j.',
    'admin',
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Create a second admin user for testing
INSERT INTO users (
    id, 
    email, 
    name, 
    password,
    role, 
    is_active, 
    email_verified,
    created_at, 
    updated_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    'admin@edifybooks.com',
    'Admin User',
    '$2a$12$jNJIjltr/hO4Hj7orl5UC.g6.ozxfCicjPnfQTZ437v6OnYxRI6j.',
    'admin',
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Update existing books to have author_id if not set
UPDATE books 
SET author_id = (
    SELECT id FROM users WHERE role = 'admin' LIMIT 1
)
WHERE author_id IS NULL;

-- Update existing events to have required new fields
UPDATE events 
SET 
    type = 'conference',
    status = 'published',
    is_published = true,
    is_free = true,
    price = 0.00,
    organizer_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE type IS NULL;

-- =====================================================
-- SECURITY UPDATES
-- =====================================================

-- Enable RLS on new sensitive tables
ALTER TABLE book_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for book submissions (authors can only see their own)
CREATE POLICY book_submissions_author_policy ON book_submissions
    FOR ALL USING (author_id = current_setting('app.current_user_id', true)::UUID);

-- Create RLS policies for author revenues (authors can only see their own)
CREATE POLICY author_revenues_policy ON author_revenues
    FOR ALL USING (author_id = current_setting('app.current_user_id', true)::UUID);

-- Create RLS policies for author payouts (authors can only see their own)
CREATE POLICY author_payouts_policy ON author_payouts
    FOR ALL USING (author_id = current_setting('app.current_user_id', true)::UUID);

-- Create RLS policies for author messages
CREATE POLICY author_messages_policy ON author_messages
    FOR ALL USING (
        author_id = current_setting('app.current_user_id', true)::UUID OR
        admin_id = current_setting('app.current_user_id', true)::UUID
    );

-- Create RLS policies for author profiles (authors can only see their own)
CREATE POLICY author_profiles_policy ON author_profiles
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Create RLS policies for event registrations (users can only see their own)
CREATE POLICY event_registrations_policy ON event_registrations
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- =====================================================
-- FINAL COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE book_submissions IS 'Author book submission workflow and review process';
COMMENT ON TABLE author_revenues IS 'Track author earnings from book sales';
COMMENT ON TABLE author_payouts IS 'Author payment processing and history';
COMMENT ON TABLE author_messages IS 'Communication between authors and admins';
COMMENT ON TABLE author_profiles IS 'Extended profiles for authors with publishing details';
COMMENT ON TABLE event_registrations IS 'Event registration and attendance tracking';
COMMENT ON TABLE course_reviews IS 'Course reviews and ratings from students';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Insert sample books for testing
INSERT INTO books (
    title, 
    author, 
    author_id,
    description, 
    price, 
    status, 
    category, 
    stock, 
    is_available,
    cover_image,
    created_at, 
    updated_at
) VALUES 
(
    'Digital Transformation in Nigeria',
    'EdifyPub Team',
    '550e8400-e29b-41d4-a716-446655440000',
    'A comprehensive guide to digital transformation strategies for Nigerian businesses.',
    45.99,
    'published',
    'Business',
    100,
    true,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    NOW(),
    NOW()
),
(
    'The Future of African Literature',
    'EdifyPub Team',
    '550e8400-e29b-41d4-a716-446655440000',
    'Exploring the evolving landscape of contemporary African literature and its global impact.',
    38.50,
    'published',
    'Literature',
    75,
    true,
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    NOW(),
    NOW()
),
(
    'Entrepreneurship in the Digital Age',
    'EdifyPub Team',
    '550e8400-e29b-41d4-a716-446655440000',
    'Practical strategies for building successful businesses in today\'s digital economy.',
    52.00,
    'published',
    'Business',
    50,
    true,
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample events for testing
INSERT INTO events (
    title,
    description,
    short_description,
    type,
    status,
    start_date,
    end_date,
    timezone,
    location,
    is_online,
    meeting_url,
    price,
    is_free,
    max_attendees,
    organizer_id,
    is_published,
    registration_deadline,
    created_at,
    updated_at
) VALUES 
(
    'Digital Marketing Masterclass',
    'Learn advanced digital marketing strategies and techniques to grow your business online. This comprehensive workshop covers social media marketing, content creation, email marketing, and analytics.',
    'Advanced digital marketing strategies for business growth',
    'masterclass',
    'published',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '30 days' + INTERVAL '3 hours',
    'Africa/Lagos',
    null,
    true,
    'https://meet.google.com/abc-defg-hij',
    15000.00,
    false,
    50,
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    NOW() + INTERVAL '25 days',
    NOW(),
    NOW()
),
(
    'Book Launch: The Future of African Literature',
    'Join EdifyPub for the official launch of our latest book "The Future of African Literature". Meet the team, get your signed copy, and engage in discussions about contemporary African literary works.',
    'Official book launch event with author meet and greet',
    'book_launch',
    'published',
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '15 days' + INTERVAL '2 hours',
    'Africa/Lagos',
    'Lagos, Nigeria',
    false,
    null,
    0.00,
    true,
    100,
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    NOW() + INTERVAL '10 days',
    NOW(),
    NOW()
),
(
    'Writing Workshop: Crafting Compelling Stories',
    'A hands-on workshop for aspiring writers to learn the fundamentals of storytelling, character development, and narrative structure. Suitable for beginners and intermediate writers.',
    'Learn storytelling fundamentals and character development',
    'workshop',
    'published',
    NOW() + INTERVAL '45 days',
    NOW() + INTERVAL '45 days' + INTERVAL '4 hours',
    'Africa/Lagos',
    null,
    true,
    'https://zoom.us/j/123456789',
    8000.00,
    false,
    25,
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    NOW() + INTERVAL '40 days',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample courses for testing
INSERT INTO courses (
    title,
    description,
    price,
    thumbnail_image,
    instructor_id,
    is_published,
    duration,
    level,
    created_at,
    updated_at
) VALUES 
(
    'Creative Writing Fundamentals',
    'Master the basics of creative writing with this comprehensive course covering character development, plot structure, dialogue, and narrative techniques.',
    25000.00,
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    480,
    'beginner',
    NOW(),
    NOW()
),
(
    'Digital Publishing Mastery',
    'Learn how to publish your books digitally across multiple platforms, including formatting, cover design, marketing strategies, and distribution.',
    35000.00,
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    360,
    'intermediate',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Log migration completion
INSERT INTO categories (name, slug, description, type, is_active, created_at, updated_at) 
VALUES ('Migration Log', 'migration-log', 'Database migration tracking', 'blog', false, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

SELECT 'Database migration completed successfully on ' || NOW()::TEXT as migration_status;
