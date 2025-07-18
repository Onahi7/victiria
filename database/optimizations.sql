-- Week 4: Database Optimization - Indexes and Performance Improvements

-- ============================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================

-- Books table indexes
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_price ON books(price);
CREATE INDEX IF NOT EXISTS idx_books_title_search ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_description_search ON books USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_books_tags ON books USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_books_status_category ON books(status, category);
CREATE INDEX IF NOT EXISTS idx_books_status_created_at ON books(status, created_at);
CREATE INDEX IF NOT EXISTS idx_books_author_status ON books(author_id, status);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON orders(created_at, status);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON order_items(book_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_order ON order_items(book_id, order_id);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_book_rating ON reviews(book_id, rating);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_book_id ON wishlists(book_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_book ON wishlists(user_id, book_id);

-- Reading progress indexes
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_updated_at ON reading_progress(updated_at);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================

-- Book statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS book_stats AS
SELECT 
    b.id,
    b.title,
    b.category,
    b.price,
    b.status,
    COUNT(DISTINCT r.id) AS review_count,
    ROUND(AVG(r.rating), 2) AS average_rating,
    COUNT(DISTINCT oi.order_id) AS sales_count,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.price * oi.quantity) AS total_revenue,
    MAX(o.created_at) AS last_sale_date,
    b.created_at,
    b.updated_at
FROM books b
LEFT JOIN reviews r ON b.id = r.book_id
LEFT JOIN order_items oi ON b.id = oi.book_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'COMPLETED'
WHERE b.status = 'PUBLISHED'
GROUP BY b.id, b.title, b.category, b.price, b.status, b.created_at, b.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_stats_id ON book_stats(id);
CREATE INDEX IF NOT EXISTS idx_book_stats_category ON book_stats(category);
CREATE INDEX IF NOT EXISTS idx_book_stats_sales_count ON book_stats(sales_count);
CREATE INDEX IF NOT EXISTS idx_book_stats_average_rating ON book_stats(average_rating);

-- User activity materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'COMPLETED') AS completed_orders,
    SUM(o.total_amount) FILTER (WHERE o.status = 'COMPLETED') AS total_spent,
    COUNT(DISTINCT r.id) AS reviews_count,
    AVG(r.rating) AS average_rating_given,
    COUNT(DISTINCT w.id) AS wishlist_count,
    COUNT(DISTINCT rp.id) AS books_reading,
    MAX(o.created_at) AS last_order_date,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN reviews r ON u.id = r.user_id
LEFT JOIN wishlists w ON u.id = w.user_id
LEFT JOIN reading_progress rp ON u.id = rp.user_id
GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_stats_id ON user_activity_stats(id);
CREATE INDEX IF NOT EXISTS idx_user_activity_stats_total_spent ON user_activity_stats(total_spent);
CREATE INDEX IF NOT EXISTS idx_user_activity_stats_total_orders ON user_activity_stats(total_orders);

-- ============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY book_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get book recommendations based on user behavior
CREATE OR REPLACE FUNCTION get_book_recommendations(p_user_id INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(book_id INTEGER, title TEXT, category TEXT, price DECIMAL, average_rating DECIMAL, sales_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH user_categories AS (
        -- Get user's preferred categories based on purchase history
        SELECT b.category, COUNT(*) as category_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN books b ON oi.book_id = b.id
        WHERE o.user_id = p_user_id AND o.status = 'COMPLETED'
        GROUP BY b.category
        ORDER BY category_count DESC
        LIMIT 3
    ),
    similar_users AS (
        -- Find users with similar purchase patterns
        SELECT DISTINCT o2.user_id
        FROM orders o1
        JOIN order_items oi1 ON o1.id = oi1.order_id
        JOIN order_items oi2 ON oi1.book_id = oi2.book_id
        JOIN orders o2 ON oi2.order_id = o2.id
        WHERE o1.user_id = p_user_id 
        AND o2.user_id != p_user_id
        AND o1.status = 'COMPLETED'
        AND o2.status = 'COMPLETED'
        LIMIT 20
    )
    SELECT DISTINCT 
        bs.id,
        bs.title,
        bs.category,
        bs.price,
        bs.average_rating,
        bs.sales_count
    FROM book_stats bs
    WHERE bs.id NOT IN (
        -- Exclude books user already owns
        SELECT DISTINCT oi.book_id 
        FROM orders o 
        JOIN order_items oi ON o.id = oi.order_id 
        WHERE o.user_id = p_user_id AND o.status = 'COMPLETED'
    )
    AND (
        -- Books in user's preferred categories
        bs.category IN (SELECT category FROM user_categories)
        OR
        -- Books purchased by similar users
        bs.id IN (
            SELECT DISTINCT oi.book_id
            FROM similar_users su
            JOIN orders o ON su.user_id = o.user_id
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status = 'COMPLETED'
        )
    )
    ORDER BY 
        bs.average_rating DESC,
        bs.sales_count DESC,
        RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate book popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score(p_book_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    score DECIMAL := 0;
    rating_weight DECIMAL := 0.4;
    sales_weight DECIMAL := 0.3;
    recency_weight DECIMAL := 0.2;
    review_weight DECIMAL := 0.1;
BEGIN
    SELECT 
        (COALESCE(bs.average_rating, 0) * rating_weight) +
        (LEAST(bs.sales_count, 100) * sales_weight) +
        (CASE 
            WHEN bs.last_sale_date > NOW() - INTERVAL '30 days' THEN 10 * recency_weight
            WHEN bs.last_sale_date > NOW() - INTERVAL '90 days' THEN 5 * recency_weight
            ELSE 0
        END) +
        (LEAST(bs.review_count, 50) * review_weight)
    INTO score
    FROM book_stats bs
    WHERE bs.id = p_book_id;
    
    RETURN COALESCE(score, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS FOR AUTOMATIC CACHE INVALIDATION
-- ============================================

-- Function to handle cache invalidation
CREATE OR REPLACE FUNCTION notify_cache_invalidation()
RETURNS trigger AS $$
BEGIN
    -- Notify application to invalidate relevant caches
    PERFORM pg_notify('cache_invalidation', json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'id', COALESCE(NEW.id, OLD.id)
    )::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cache invalidation
DROP TRIGGER IF EXISTS books_cache_invalidation ON books;
CREATE TRIGGER books_cache_invalidation
    AFTER INSERT OR UPDATE OR DELETE ON books
    FOR EACH ROW EXECUTE FUNCTION notify_cache_invalidation();

DROP TRIGGER IF EXISTS orders_cache_invalidation ON orders;
CREATE TRIGGER orders_cache_invalidation
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_cache_invalidation();

DROP TRIGGER IF EXISTS reviews_cache_invalidation ON reviews;
CREATE TRIGGER reviews_cache_invalidation
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION notify_cache_invalidation();

-- ============================================
-- MAINTENANCE PROCEDURES
-- ============================================

-- Procedure to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up old verification tokens (older than 24 hours)
    DELETE FROM verification_tokens 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up abandoned orders (older than 7 days and still pending)
    DELETE FROM orders 
    WHERE status = 'PENDING' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Clean up old payment transactions (failed ones older than 30 days)
    DELETE FROM payment_transactions 
    WHERE status = 'FAILED' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Refresh materialized views
    PERFORM refresh_analytics_views();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================

-- Query to find slow queries (requires pg_stat_statements extension)
-- SELECT query, calls, total_time, mean_time, rows
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- Query to find unused indexes
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;

-- Query to find table sizes
-- SELECT schemaname, tablename, 
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
