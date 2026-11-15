-- ============================================================================
-- 13: INDEXING STRATEGY AND QUERY PLAN ANALYSIS (EXPLAIN)
-- ============================================================================
-- Demonstrates cost estimation, index scans, filter nodes, and PostgreSQL query planner.

-- 13.1 Inspect All Existing Indexes in the Public Schema
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 13.2 EXPLAIN Plan for City and Rent Filtering
-- Shows use of idx_accommodations_city_rent (composite index with status='available' partial filter)
EXPLAIN 
SELECT id, title, monthly_rent 
FROM accommodations 
WHERE city = 'Pune' 
  AND monthly_rent <= 20000.00 
  AND status = 'available';

-- 13.3 EXPLAIN Plan for Booking Request Lookup by Sender
-- Shows use of idx_booking_requests_sender
EXPLAIN 
SELECT id, listing_id, status, move_in_date 
FROM booking_requests 
WHERE sender_id = 'user-1';

-- 13.4 EXPLAIN Plan for Polymorphic Reviews Lookup
-- Shows use of partial index idx_reviews_target_acc
EXPLAIN 
SELECT id, reviewer_id, rating, comment 
FROM reviews 
WHERE target_type = 'accommodation' 
  AND target_accommodation_id = 'prop-12';

-- 13.5 EXPLAIN Plan for Chat Messages Ordered by Timestamp
-- Shows Index Scan using idx_messages_conversation
EXPLAIN 
SELECT id, sender_id, content, created_at 
FROM messages 
WHERE conversation_id = 'conv-1' 
ORDER BY created_at ASC;
