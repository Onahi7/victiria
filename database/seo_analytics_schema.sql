-- =====================================================
-- SEO ANALYTICS TABLES
-- Database schema for SEO tracking and analytics
-- Date: July 27, 2025
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SEO ANALYTICS TABLES
-- =====================================================

-- SEO Analytics table for tracking page views and user behavior
CREATE TABLE seo_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    bounce_rate BOOLEAN DEFAULT false,
    time_on_page INTEGER, -- in seconds
    scroll_depth INTEGER, -- percentage 0-100
    conversion_goal VARCHAR(255),
    is_conversion BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- SEO Redirects table for managing URL redirects
CREATE TABLE seo_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_url TEXT NOT NULL UNIQUE,
    to_url TEXT NOT NULL,
    redirect_type INTEGER DEFAULT 301, -- 301, 302, etc.
    is_active BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- SEO Meta data table for page-specific SEO settings
CREATE TABLE seo_meta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL UNIQUE,
    page_type VARCHAR(50), -- 'page', 'blog', 'book', 'course', etc.
    title VARCHAR(255),
    description TEXT,
    keywords TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image TEXT,
    og_type VARCHAR(50) DEFAULT 'website',
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image TEXT,
    twitter_card VARCHAR(50) DEFAULT 'summary',
    canonical_url TEXT,
    robots TEXT DEFAULT 'index,follow',
    schema_markup JSONB,
    custom_meta JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- SEO Performance tracking table
CREATE TABLE seo_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    keyword VARCHAR(255),
    search_engine VARCHAR(50), -- 'google', 'bing', etc.
    position INTEGER,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4), -- Click-through rate
    average_position DECIMAL(5,2),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- SEO Site audit table for tracking technical SEO issues
CREATE TABLE seo_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_url TEXT NOT NULL,
    audit_type VARCHAR(100), -- 'broken_link', 'missing_meta', 'slow_loading', etc.
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    issue VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'ignored'
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR SEO TABLES
-- =====================================================

-- SEO Analytics indexes
CREATE INDEX idx_seo_analytics_page_url ON seo_analytics(page_url);
CREATE INDEX idx_seo_analytics_created_at ON seo_analytics(created_at);
CREATE INDEX idx_seo_analytics_user_id ON seo_analytics(user_id);
CREATE INDEX idx_seo_analytics_session_id ON seo_analytics(session_id);
CREATE INDEX idx_seo_analytics_referrer ON seo_analytics(referrer);
CREATE INDEX idx_seo_analytics_device_type ON seo_analytics(device_type);
CREATE INDEX idx_seo_analytics_conversion ON seo_analytics(is_conversion);
CREATE INDEX idx_seo_analytics_utm_source ON seo_analytics(utm_source);
CREATE INDEX idx_seo_analytics_utm_campaign ON seo_analytics(utm_campaign);

-- SEO Redirects indexes
CREATE INDEX idx_seo_redirects_from_url ON seo_redirects(from_url);
CREATE INDEX idx_seo_redirects_to_url ON seo_redirects(to_url);
CREATE INDEX idx_seo_redirects_is_active ON seo_redirects(is_active);
CREATE INDEX idx_seo_redirects_created_at ON seo_redirects(created_at);
CREATE INDEX idx_seo_redirects_hit_count ON seo_redirects(hit_count);

-- SEO Meta indexes
CREATE INDEX idx_seo_meta_page_url ON seo_meta(page_url);
CREATE INDEX idx_seo_meta_page_type ON seo_meta(page_type);
CREATE INDEX idx_seo_meta_is_active ON seo_meta(is_active);
CREATE INDEX idx_seo_meta_created_at ON seo_meta(created_at);

-- SEO Performance indexes
CREATE INDEX idx_seo_performance_page_url ON seo_performance(page_url);
CREATE INDEX idx_seo_performance_keyword ON seo_performance(keyword);
CREATE INDEX idx_seo_performance_date ON seo_performance(date);
CREATE INDEX idx_seo_performance_search_engine ON seo_performance(search_engine);
CREATE INDEX idx_seo_performance_position ON seo_performance(position);

-- SEO Audit indexes
CREATE INDEX idx_seo_audit_page_url ON seo_audit(page_url);
CREATE INDEX idx_seo_audit_audit_type ON seo_audit(audit_type);
CREATE INDEX idx_seo_audit_severity ON seo_audit(severity);
CREATE INDEX idx_seo_audit_status ON seo_audit(status);
CREATE INDEX idx_seo_audit_created_at ON seo_audit(created_at);
CREATE INDEX idx_seo_audit_assigned_to ON seo_audit(assigned_to);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Create triggers for SEO tables with updated_at columns
CREATE TRIGGER update_seo_analytics_updated_at 
    BEFORE UPDATE ON seo_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_redirects_updated_at 
    BEFORE UPDATE ON seo_redirects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_meta_updated_at 
    BEFORE UPDATE ON seo_meta 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_audit_updated_at 
    BEFORE UPDATE ON seo_audit 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR SEO OPERATIONS
-- =====================================================

-- Function to get page views for a specific URL
CREATE OR REPLACE FUNCTION get_page_views(url TEXT, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM seo_analytics 
    WHERE page_url = url
    AND (start_date IS NULL OR created_at::date >= start_date)
    AND (end_date IS NULL OR created_at::date <= end_date);
    
    RETURN view_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get top pages by views
CREATE OR REPLACE FUNCTION get_top_pages(limit_count INTEGER DEFAULT 10, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE(page_url TEXT, view_count BIGINT, unique_visitors BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.page_url,
        COUNT(*) as view_count,
        COUNT(DISTINCT sa.session_id) as unique_visitors
    FROM seo_analytics sa
    WHERE (start_date IS NULL OR sa.created_at::date >= start_date)
    AND (end_date IS NULL OR sa.created_at::date <= end_date)
    GROUP BY sa.page_url
    ORDER BY view_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bounce rate for a page
CREATE OR REPLACE FUNCTION calculate_bounce_rate(url TEXT, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_sessions INTEGER;
    bounce_sessions INTEGER;
    bounce_rate DECIMAL(5,2);
BEGIN
    -- Count total sessions
    SELECT COUNT(DISTINCT session_id) INTO total_sessions
    FROM seo_analytics 
    WHERE page_url = url
    AND (start_date IS NULL OR created_at::date >= start_date)
    AND (end_date IS NULL OR created_at::date <= end_date);
    
    -- Count bounce sessions (sessions with only one page view)
    SELECT COUNT(*) INTO bounce_sessions
    FROM (
        SELECT session_id
        FROM seo_analytics 
        WHERE page_url = url
        AND (start_date IS NULL OR created_at::date >= start_date)
        AND (end_date IS NULL OR created_at::date <= end_date)
        GROUP BY session_id
        HAVING COUNT(*) = 1
    ) single_page_sessions;
    
    -- Calculate bounce rate
    IF total_sessions > 0 THEN
        bounce_rate := (bounce_sessions::DECIMAL / total_sessions::DECIMAL) * 100;
    ELSE
        bounce_rate := 0;
    END IF;
    
    RETURN bounce_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to track conversion events
CREATE OR REPLACE FUNCTION track_conversion(
    url TEXT,
    goal_name TEXT,
    user_session TEXT,
    user_uuid UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE seo_analytics 
    SET 
        conversion_goal = goal_name,
        is_conversion = true,
        updated_at = NOW()
    WHERE page_url = url 
    AND session_id = user_session
    AND (user_uuid IS NULL OR user_id = user_uuid)
    AND created_at >= NOW() - INTERVAL '1 day'; -- Only recent sessions
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR SEO REPORTING
-- =====================================================

-- Daily analytics summary view
CREATE VIEW daily_analytics AS
SELECT 
    created_at::date as date,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_visitors,
    COUNT(DISTINCT page_url) as pages_visited,
    AVG(time_on_page) as avg_time_on_page,
    AVG(scroll_depth) as avg_scroll_depth,
    COUNT(CASE WHEN is_conversion THEN 1 END) as conversions,
    COUNT(CASE WHEN bounce_rate THEN 1 END) as bounces
FROM seo_analytics
GROUP BY created_at::date
ORDER BY date DESC;

-- Top referrers view
CREATE VIEW top_referrers AS
SELECT 
    referrer,
    COUNT(*) as visits,
    COUNT(DISTINCT session_id) as unique_visitors,
    AVG(time_on_page) as avg_time_on_page
FROM seo_analytics
WHERE referrer IS NOT NULL AND referrer != ''
GROUP BY referrer
ORDER BY visits DESC;

-- Device analytics view
CREATE VIEW device_analytics AS
SELECT 
    device_type,
    browser,
    os,
    COUNT(*) as visits,
    COUNT(DISTINCT session_id) as unique_visitors,
    AVG(time_on_page) as avg_time_on_page,
    AVG(scroll_depth) as avg_scroll_depth
FROM seo_analytics
WHERE device_type IS NOT NULL
GROUP BY device_type, browser, os
ORDER BY visits DESC;

-- UTM campaign performance view
CREATE VIEW utm_performance AS
SELECT 
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    COUNT(*) as visits,
    COUNT(DISTINCT session_id) as unique_visitors,
    COUNT(CASE WHEN is_conversion THEN 1 END) as conversions,
    (COUNT(CASE WHEN is_conversion THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100) as conversion_rate
FROM seo_analytics
WHERE utm_source IS NOT NULL
GROUP BY utm_source, utm_medium, utm_campaign, utm_term, utm_content
ORDER BY visits DESC;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert some sample SEO analytics data
INSERT INTO seo_analytics (page_url, page_title, referrer, user_agent, session_id, device_type, browser, os, time_on_page, scroll_depth) VALUES
('/', 'Home - Victiria Bookstore', 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'session_001', 'desktop', 'Chrome', 'Windows', 120, 85),
('/books', 'Books - Victiria Bookstore', 'https://google.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)', 'session_002', 'mobile', 'Safari', 'iOS', 90, 65),
('/blog', 'Blog - Victiria Bookstore', 'direct', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'session_003', 'desktop', 'Safari', 'macOS', 200, 95);

-- Insert sample SEO meta data
INSERT INTO seo_meta (page_url, page_type, title, description, og_title, og_description, twitter_title, twitter_description) VALUES
('/', 'page', 'Victiria - Premier Online Bookstore', 'Discover amazing books, courses, and educational content at Victiria. Your gateway to knowledge and learning.', 'Victiria - Premier Online Bookstore', 'Discover amazing books, courses, and educational content at Victiria.', 'Victiria Bookstore', 'Your gateway to knowledge and learning'),
('/books', 'books', 'Books Collection - Victiria', 'Browse our extensive collection of books across various categories and genres.', 'Books Collection - Victiria', 'Browse our extensive collection of books across various categories.', 'Books - Victiria', 'Extensive book collection across various genres'),
('/blog', 'blog', 'Blog - Victiria', 'Read our latest articles, insights, and educational content on our blog.', 'Blog - Victiria', 'Latest articles, insights, and educational content.', 'Victiria Blog', 'Educational articles and insights');

-- Insert sample redirect rules
INSERT INTO seo_redirects (from_url, to_url, redirect_type, is_active) VALUES
('/old-books', '/books', 301, true),
('/shop', '/books', 301, true),
('/articles', '/blog', 301, true);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE seo_analytics IS 'Tracks page views, user behavior, and analytics data';
COMMENT ON TABLE seo_redirects IS 'Manages URL redirects for SEO and user experience';
COMMENT ON TABLE seo_meta IS 'Stores SEO metadata for pages including Open Graph and Twitter cards';
COMMENT ON TABLE seo_performance IS 'Tracks search engine performance metrics and keyword rankings';
COMMENT ON TABLE seo_audit IS 'Records SEO audit findings and recommendations';

COMMENT ON COLUMN seo_analytics.bounce_rate IS 'True if user left after viewing only one page';
COMMENT ON COLUMN seo_analytics.time_on_page IS 'Time spent on page in seconds';
COMMENT ON COLUMN seo_analytics.scroll_depth IS 'How far user scrolled (percentage 0-100)';
COMMENT ON COLUMN seo_redirects.redirect_type IS 'HTTP redirect status code (301, 302, etc.)';
COMMENT ON COLUMN seo_meta.robots IS 'Robots meta tag directive (e.g., "index,follow")';

-- =====================================================
-- END OF SEO ANALYTICS SCHEMA
-- =====================================================
