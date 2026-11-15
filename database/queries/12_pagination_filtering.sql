-- ============================================================================
-- 12: PAGINATION AND MULTI-FACET FILTERING PATTERNS
-- ============================================================================
-- Demonstrates production-grade pagination (OFFSET vs Keyset) and unified counting.

-- 12.1 Unified Count & Paginated Results in a Single Query (Using CTE)
-- Eliminates the need for 2 round-trips to the database
WITH filtered_accommodations AS (
    SELECT 
        id,
        title,
        city,
        preferred_area,
        type,
        monthly_rent,
        available_rooms,
        has_virtual_tour,
        created_at
    FROM accommodations
    WHERE status = 'available'
      AND monthly_rent BETWEEN 10000.00 AND 30000.00
      AND (city = 'Pune' OR city = 'Mumbai')
),
total_count AS (
    SELECT count(*) AS total_matches FROM filtered_accommodations
)
SELECT 
    fa.*,
    tc.total_matches,
    CEIL(tc.total_matches::NUMERIC / 5) AS total_pages
FROM filtered_accommodations fa
CROSS JOIN total_count tc
ORDER BY fa.monthly_rent ASC, fa.id ASC
LIMIT 5 OFFSET 0;

-- 12.2 Keyset (Cursor-Based) Pagination
-- Avoids OFFSET scan performance degradation on large datasets
-- Using (monthly_rent, id) as composite deterministic cursor
SELECT 
    id,
    title,
    city,
    type,
    monthly_rent
FROM accommodations
WHERE status = 'available'
  -- Simulates fetching next page where last row was rent=18000.00 and id='acc-003'
  AND (monthly_rent, id) > (18000.00, 'acc-003')
ORDER BY monthly_rent ASC, id ASC
LIMIT 5;

-- 12.3 Multi-Facet Search Filter (Location, Price, Lifestyle Preferences)
SELECT 
    u.id,
    u.full_name,
    u.city,
    rp.min_budget,
    rp.max_budget,
    rp.cleanliness,
    rp.sleep_schedule,
    rp.food_habits
FROM users u
INNER JOIN roommate_preferences rp ON u.id = rp.user_id
WHERE u.account_status = 'active'
  AND rp.cleanliness IN ('high', 'medium', 'moderate')
  AND rp.food_habits IN ('vegetarian', 'vegan')
  AND rp.max_budget >= 15000.00
ORDER BY rp.max_budget ASC;
