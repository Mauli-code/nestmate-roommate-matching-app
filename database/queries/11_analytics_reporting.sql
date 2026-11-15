-- ============================================================================
-- 11: ANALYTICS AND EXECUTIVE REPORTING DASHBOARDS
-- ============================================================================
-- High-level operational metrics, market intelligence, and KPI reporting.

-- 11.1 Supply vs Demand: City-Level Liquidity and Budget Match Analysis
-- Compares what seekers want to pay (preferences) vs what hosts charge (accommodations)
WITH demand_stats AS (
    SELECT 
        u.city,
        count(rp.user_id) AS total_seekers,
        round(avg(rp.min_budget), 2) AS avg_min_budget,
        round(avg(rp.max_budget), 2) AS avg_max_budget
    FROM users u
    INNER JOIN roommate_preferences rp ON u.id = rp.user_id
    WHERE u.city <> ''
    GROUP BY u.city
),
supply_stats AS (
    SELECT 
        city,
        count(*) AS total_listings,
        round(avg(monthly_rent), 2) AS avg_listing_rent,
        sum(available_rooms) AS total_rooms_offered
    FROM accommodations
    WHERE status = 'available'
    GROUP BY city
)
SELECT 
    COALESCE(s.city, d.city) AS city,
    COALESCE(d.total_seekers, 0) AS active_seekers,
    COALESCE(d.avg_max_budget, 0.00) AS seeker_avg_max_budget,
    COALESCE(s.total_listings, 0) AS available_listings,
    COALESCE(s.total_rooms_offered, 0) AS total_available_rooms,
    COALESCE(s.avg_listing_rent, 0.00) AS market_avg_rent,
    ROUND(COALESCE(s.avg_listing_rent, 0) - COALESCE(d.avg_max_budget, 0), 2) AS affordability_gap
FROM supply_stats s
FULL OUTER JOIN demand_stats d ON s.city = d.city
ORDER BY available_listings DESC;

-- 11.2 Host Performance: Booking Conversion Rate
SELECT 
    u.id AS host_id,
    u.full_name AS host_name,
    count(DISTINCT a.id) AS total_properties_managed,
    count(br.id) AS total_bookings_received,
    count(CASE WHEN br.status = 'accepted' THEN 1 END) AS accepted_bookings,
    count(CASE WHEN br.status = 'rejected' THEN 1 END) AS rejected_bookings,
    count(CASE WHEN br.status = 'pending' THEN 1 END) AS pending_bookings,
    ROUND(
        count(CASE WHEN br.status = 'accepted' THEN 1 END) * 100.0 / 
        NULLIF(count(br.id), 0), 
        1
    ) AS acceptance_rate_pct
FROM users u
INNER JOIN accommodations a ON u.id = a.owner_id
LEFT JOIN booking_requests br ON a.id = br.listing_id
GROUP BY u.id, u.full_name
ORDER BY total_bookings_received DESC, host_name ASC;

-- 11.3 Top Roommate Pairs by Mutual Connection Acceptance
SELECT 
    cr.id AS match_id,
    u1.full_name AS applicant,
    u1.city AS applicant_city,
    u2.full_name AS recipient,
    u2.city AS recipient_city,
    cr.created_at AS connected_date
FROM connection_requests cr
INNER JOIN users u1 ON cr.sender_id = u1.id
INNER JOIN users u2 ON cr.receiver_id = u2.id
WHERE cr.status = 'accepted'
ORDER BY cr.created_at DESC;
