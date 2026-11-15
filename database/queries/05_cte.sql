-- ============================================================================
-- 05: COMMON TABLE EXPRESSIONS (WITH CLAUSE) AND MULTI-STAGE PIPELINES
-- ============================================================================
-- Demonstrates modular SQL workflows, intermediate calculation views, and recursive CTEs.

-- 5.1 Single-Stage CTE: City Rental Summary and Affordability Benchmark
WITH city_stats AS (
    SELECT 
        city,
        count(*) AS total_properties,
        round(avg(monthly_rent), 2) AS city_avg_rent,
        min(monthly_rent) AS min_rent,
        max(monthly_rent) AS max_rent
    FROM accommodations
    WHERE status = 'available'
    GROUP BY city
)
SELECT 
    a.title,
    a.city,
    a.monthly_rent,
    cs.city_avg_rent,
    round(a.monthly_rent - cs.city_avg_rent, 2) AS diff_from_avg,
    CASE 
        WHEN a.monthly_rent < cs.city_avg_rent THEN 'Below City Average'
        WHEN a.monthly_rent = cs.city_avg_rent THEN 'Equal to City Average'
        ELSE 'Above City Average'
    END AS price_category
FROM accommodations a
INNER JOIN city_stats cs ON a.city = cs.city
ORDER BY a.city, a.monthly_rent ASC;

-- 5.2 Multi-Stage CTE: User Activity Scoring Dashboard
-- Step 1: Count bookings sent per user
-- Step 2: Count messages sent per user
-- Step 3: Combine metrics into composite engagement score
WITH booking_counts AS (
    SELECT sender_id AS user_id, count(*) AS total_bookings
    FROM booking_requests
    GROUP BY sender_id
),
message_counts AS (
    SELECT sender_id AS user_id, count(*) AS total_messages
    FROM messages
    GROUP BY sender_id
),
connection_counts AS (
    SELECT sender_id AS user_id, count(*) AS total_connections
    FROM connection_requests
    GROUP BY sender_id
)
SELECT 
    u.id,
    u.full_name,
    u.city,
    COALESCE(bc.total_bookings, 0) AS bookings_sent,
    COALESCE(mc.total_messages, 0) AS messages_sent,
    COALESCE(cc.total_connections, 0) AS connections_sent,
    (COALESCE(bc.total_bookings, 0) * 3 + 
     COALESCE(mc.total_messages, 0) * 1 + 
     COALESCE(cc.total_connections, 0) * 2) AS engagement_score
FROM users u
LEFT JOIN booking_counts bc ON u.id = bc.user_id
LEFT JOIN message_counts mc ON u.id = mc.user_id
LEFT JOIN connection_counts cc ON u.id = cc.user_id
ORDER BY engagement_score DESC, u.full_name ASC;

-- 5.3 Recursive CTE: Sequential Month Calendar Generation for Booking Trends
WITH RECURSIVE calendar AS (
    SELECT date_trunc('month', CURRENT_DATE - INTERVAL '5 months')::DATE AS month_start
    UNION ALL
    SELECT (month_start + INTERVAL '1 month')::DATE
    FROM calendar
    WHERE month_start < date_trunc('month', CURRENT_DATE)::DATE
)
SELECT 
    to_char(c.month_start, 'Mon YYYY') AS display_month,
    count(br.id) AS bookings_created
FROM calendar c
LEFT JOIN booking_requests br 
    ON date_trunc('month', br.created_at) = c.month_start
GROUP BY c.month_start
ORDER BY c.month_start ASC;
