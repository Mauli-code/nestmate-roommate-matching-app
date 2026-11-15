-- ============================================================================
-- 01: BASIC SELECT, FILTERING (WHERE), SORTING (ORDER BY), AND PAGINATION
-- ============================================================================
-- Demonstrates projection, predicate filtering, multi-column sorting, and
-- LIMIT/OFFSET pagination on the NestMate relational schema.

-- 1.1 Find affordable accommodations in Pune with monthly rent <= 20,000 INR
-- Ordered by monthly rent ascending (most affordable first)
SELECT 
    id,
    title,
    city,
    preferred_area,
    type,
    monthly_rent,
    security_deposit,
    available_rooms,
    available_from
FROM accommodations
WHERE city = 'Pune'
  AND status = 'available'
  AND monthly_rent <= 20000.00
ORDER BY monthly_rent ASC, title ASC;

-- 1.2 Paginated user directory with column aliases and status filter
-- Page 1: 5 users per page
SELECT 
    id AS user_id,
    full_name,
    email,
    city,
    occupation,
    created_at AS joined_date
FROM users
WHERE account_status = 'active'
ORDER BY city ASC, full_name ASC
LIMIT 5 OFFSET 0;

-- Page 2: Next 5 users
SELECT 
    id AS user_id,
    full_name,
    email,
    city,
    occupation,
    created_at AS joined_date
FROM users
WHERE account_status = 'active'
ORDER BY city ASC, full_name ASC
LIMIT 5 OFFSET 5;

-- 1.3 Find listings featuring 360-degree virtual room tours
SELECT 
    id,
    title,
    city,
    preferred_area,
    type,
    monthly_rent,
    has_virtual_tour
FROM accommodations
WHERE has_virtual_tour = TRUE
ORDER BY monthly_rent DESC;
