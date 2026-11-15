-- ============================================================================
-- 10: SET OPERATIONS (UNION, UNION ALL, INTERSECT, EXCEPT)
-- ============================================================================
-- Demonstrates mathematical set theory operations across compatible relational sets.

-- 10.1 UNION vs UNION ALL: Combining User Locations Across Cities
-- UNION: Eliminates duplicates, returning distinct cities
SELECT city FROM users WHERE city <> ''
UNION
SELECT city FROM accommodations WHERE city <> ''
ORDER BY city ASC;

-- UNION ALL: Preserves duplicates to observe frequency of city occurrences
SELECT 'User Profile' AS entity_type, city FROM users WHERE city <> ''
UNION ALL
SELECT 'Accommodation' AS entity_type, city FROM accommodations WHERE city <> ''
ORDER BY city, entity_type;

-- 10.2 INTERSECT: Users who have Both Sent AND Received Connection Requests
-- Identifies highly collaborative or reciprocal participants
SELECT sender_id AS user_id FROM connection_requests
INTERSECT
SELECT receiver_id AS user_id FROM connection_requests
ORDER BY user_id;

-- 10.3 EXCEPT: Users who have Sent Connection Requests but Never Received Any
SELECT sender_id AS user_id FROM connection_requests
EXCEPT
SELECT receiver_id AS user_id FROM connection_requests
ORDER BY user_id;

-- 10.4 EXCEPT: Registered Users who have Never Created an Accommodation Listing
SELECT id AS user_id, full_name, email 
FROM users
WHERE id IN (
    SELECT id FROM users
    EXCEPT
    SELECT owner_id FROM accommodations
)
ORDER BY full_name ASC;
