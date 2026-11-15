-- ============================================================================
-- 03: AGGREGATIONS AND GROUPING (GROUP BY, HAVING, COUNT, SUM, AVG, MIN, MAX)
-- ============================================================================
-- Demonstrates aggregate statistics, multi-column grouping, and group-level filtering.

-- 3.1 Rental Statistics by City
-- Computes listing count, minimum, maximum, and average rent per market
SELECT 
    city,
    count(*) AS total_listings,
    min(monthly_rent) AS lowest_rent,
    max(monthly_rent) AS highest_rent,
    round(avg(monthly_rent), 2) AS average_rent,
    sum(available_rooms) AS total_available_rooms
FROM accommodations
WHERE status = 'available'
GROUP BY city
ORDER BY average_rent DESC;

-- 3.2 Cities with High Accommodation Density (HAVING Clause)
-- Filters groups to only cities having at least 3 active listings
SELECT 
    city,
    count(*) AS listing_count,
    round(avg(monthly_rent), 2) AS avg_rent,
    min(monthly_rent) AS min_rent,
    max(monthly_rent) AS max_rent
FROM accommodations
WHERE status = 'available'
GROUP BY city
HAVING count(*) >= 3
ORDER BY listing_count DESC;

-- 3.3 Booking Request Breakdown by Status
-- Counts total booking requests in each state (pending, accepted, rejected, cancelled)
SELECT 
    status,
    count(*) AS total_requests,
    round(count(*) * 100.0 / sum(count(*)) OVER (), 1) AS percentage_of_total
FROM booking_requests
GROUP BY status
ORDER BY total_requests DESC;

-- 3.4 Most Saved (Favorited) Accommodations
-- Identifies top-demanded properties based on user bookmarks
SELECT 
    a.id AS listing_id,
    a.title,
    a.city,
    a.monthly_rent,
    count(sa.user_id) AS total_saves
FROM accommodations a
INNER JOIN saved_accommodations sa ON a.id = sa.listing_id
GROUP BY a.id, a.title, a.city, a.monthly_rent
HAVING count(sa.user_id) >= 1
ORDER BY total_saves DESC, a.title ASC;

-- 3.5 Average Rating and Review Volume per Accommodation
-- Summarizes community sentiment on reviewed properties
SELECT 
    a.id AS listing_id,
    a.title,
    a.city,
    count(r.id) AS review_count,
    round(avg(r.rating), 2) AS average_rating,
    min(r.rating) AS lowest_rating,
    max(r.rating) AS highest_rating
FROM accommodations a
INNER JOIN reviews r ON a.id = r.target_accommodation_id
WHERE r.target_type = 'accommodation'
GROUP BY a.id, a.title, a.city
ORDER BY average_rating DESC, review_count DESC;
