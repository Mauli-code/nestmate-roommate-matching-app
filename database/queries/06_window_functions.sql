-- ============================================================================
-- 06: WINDOW FUNCTIONS (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, NTILE)
-- ============================================================================
-- Demonstrates analytic operations over row partitions without collapsing result sets.

-- 6.1 Ranking Accommodations by Rent Within Each City (RANK & DENSE_RANK)
SELECT 
    city,
    title,
    type,
    monthly_rent,
    ROW_NUMBER() OVER (PARTITION BY city ORDER BY monthly_rent ASC) AS row_num_in_city,
    RANK() OVER (PARTITION BY city ORDER BY monthly_rent ASC) AS price_rank_in_city,
    DENSE_RANK() OVER (PARTITION BY city ORDER BY monthly_rent ASC) AS dense_price_rank
FROM accommodations
WHERE status = 'available'
ORDER BY city, monthly_rent ASC;

-- 6.2 Running Total and Cumulative Share of Rental Inventory by City
SELECT 
    city,
    title,
    monthly_rent,
    SUM(monthly_rent) OVER (PARTITION BY city ORDER BY monthly_rent ASC 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_city_rent_total,
    ROUND(monthly_rent * 100.0 / SUM(monthly_rent) OVER (PARTITION BY city), 2) AS pct_of_city_total_rent
FROM accommodations
ORDER BY city, monthly_rent ASC;

-- 6.3 LAG and LEAD: Analyzing Sequence of Booking Requests Over Time
SELECT 
    id AS booking_id,
    sender_id,
    created_at,
    LAG(created_at, 1) OVER (PARTITION BY sender_id ORDER BY created_at ASC) AS prev_request_time,
    LEAD(created_at, 1) OVER (PARTITION BY sender_id ORDER BY created_at ASC) AS next_request_time,
    ROUND(EXTRACT(EPOCH FROM (created_at - LAG(created_at, 1) OVER (PARTITION BY sender_id ORDER BY created_at ASC))) / 86400, 2) AS days_since_last_booking
FROM booking_requests
ORDER BY sender_id, created_at ASC;

-- 6.4 NTILE(4): Quartile Distribution of Accommodations by Price
SELECT 
    title,
    city,
    monthly_rent,
    NTILE(4) OVER (ORDER BY monthly_rent ASC) AS price_quartile,
    CASE NTILE(4) OVER (ORDER BY monthly_rent ASC)
        WHEN 1 THEN 'Budget Friendly (Q1)'
        WHEN 2 THEN 'Moderate (Q2)'
        WHEN 3 THEN 'Mid-Premium (Q3)'
        WHEN 4 THEN 'Luxury (Q4)'
    END AS tier_label
FROM accommodations
ORDER BY monthly_rent ASC;
