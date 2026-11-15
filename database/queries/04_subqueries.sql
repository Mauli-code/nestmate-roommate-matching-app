-- ============================================================================
-- 04: SUBQUERIES AND CORRELATED SUBQUERIES (EXISTS, NOT EXISTS, IN)
-- ============================================================================
-- Demonstrates nested queries across scalar, set-membership, and row-by-row contexts.

-- 4.1 Scalar Subquery: Users with Max Budget Greater than the Platform Average
SELECT 
    u.id,
    u.full_name,
    u.city,
    rp.max_budget,
    round((SELECT avg(max_budget) FROM roommate_preferences), 2) AS platform_avg_budget,
    round(rp.max_budget - (SELECT avg(max_budget) FROM roommate_preferences), 2) AS budget_delta
FROM users u
INNER JOIN roommate_preferences rp ON u.id = rp.user_id
WHERE rp.max_budget > (SELECT avg(max_budget) FROM roommate_preferences)
ORDER BY rp.max_budget DESC;

-- 4.2 Multi-Row Subquery with IN: Accommodations in Cities with at Least 2 Registered Listings
SELECT 
    id,
    title,
    city,
    type,
    monthly_rent
FROM accommodations
WHERE city IN (
    SELECT city 
    FROM accommodations 
    GROUP BY city 
    HAVING count(*) >= 2
)
ORDER BY city, monthly_rent ASC;

-- 4.3 Correlated Subquery: Accommodations Cheaper than the Average Rent of their Respective City
SELECT 
    a1.id,
    a1.title,
    a1.city,
    a1.monthly_rent,
    (SELECT round(avg(a2.monthly_rent), 2) 
     FROM accommodations a2 
     WHERE a2.city = a1.city) AS city_avg_rent
FROM accommodations a1
WHERE a1.monthly_rent < (
    SELECT avg(a2.monthly_rent) 
    FROM accommodations a2 
    WHERE a2.city = a1.city
)
ORDER BY a1.city, a1.monthly_rent ASC;

-- 4.4 EXISTS: Users who have Sent at Least One Booking Request
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.city
FROM users u
WHERE EXISTS (
    SELECT 1 
    FROM booking_requests br 
    WHERE br.sender_id = u.id
)
ORDER BY u.full_name ASC;

-- 4.5 NOT EXISTS: Users who have Registered but Never Sent a Connection Request
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.city
FROM users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM connection_requests cr 
    WHERE cr.sender_id = u.id
)
ORDER BY u.full_name ASC;
