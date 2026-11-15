-- ============================================================================
-- 07: DATE AND TIME MANIPULATION FUNCTIONS
-- ============================================================================
-- Demonstrates timestamp arithmetic, date truncations, formatting, and intervals.

-- 7.1 Formatted Timestamp and Member Longevity using AGE()
SELECT 
    id AS user_id,
    full_name,
    email,
    created_at,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS formatted_signup,
    TO_CHAR(created_at, 'FMMonth DD, YYYY') AS human_date,
    AGE(CURRENT_TIMESTAMP, created_at) AS account_age,
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400, 1) AS days_active
FROM users
ORDER BY created_at ASC;

-- 7.2 Monthly Grouping via DATE_TRUNC
SELECT 
    DATE_TRUNC('month', created_at)::DATE AS registration_month,
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
    COUNT(*) AS new_users_registered
FROM users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY registration_month ASC;

-- 7.3 Recent Bookings Filtered by Dynamic Interval (Within Last 30 Days)
SELECT 
    id AS booking_id,
    sender_id,
    listing_id,
    status,
    move_in_date,
    created_at,
    CURRENT_DATE - move_in_date AS days_to_move_in
FROM booking_requests
WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
ORDER BY created_at DESC;

-- 7.4 Extracting Date Parts (Year, Month, Day of Week, Hour)
SELECT 
    id,
    created_at,
    EXTRACT(YEAR FROM created_at) AS year_num,
    EXTRACT(MONTH FROM created_at) AS month_num,
    EXTRACT(DOW FROM created_at) AS day_of_week_0_sun,
    TO_CHAR(created_at, 'Day') AS day_name,
    EXTRACT(HOUR FROM created_at) AS hour_of_day
FROM messages
LIMIT 5;
