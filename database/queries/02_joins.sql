-- ============================================================================
-- 02: TABLE JOINS (INNER, LEFT, RIGHT, FULL OUTER, AND MULTI-TABLE M:N)
-- ============================================================================
-- Demonstrates relational algebra operators across 1:1, 1:N, and M:N relationships.

-- 2.1 INNER JOIN: Accommodations with their Owner (User) Details
-- Retrieves listings with owner contact information
SELECT 
    a.id AS listing_id,
    a.title AS listing_title,
    a.city,
    a.preferred_area,
    a.monthly_rent,
    u.full_name AS owner_name,
    u.email AS owner_email,
    u.phone AS owner_phone
FROM accommodations a
INNER JOIN users u ON a.owner_id = u.id
WHERE a.status = 'available'
ORDER BY a.city, a.monthly_rent ASC;

-- 2.2 LEFT JOIN: All Users and their Booking Activity
-- Includes users who have never sent any booking requests (returns NULL for booking columns)
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    u.city,
    b.id AS booking_id,
    b.listing_id,
    b.status AS booking_status,
    b.move_in_date
FROM users u
LEFT JOIN booking_requests b ON u.id = b.sender_id
ORDER BY u.full_name ASC;

-- 2.3 RIGHT JOIN: Accommodations and their Reviews
-- Shows all accommodations and any associated reviews, even if some have none
SELECT 
    a.id AS listing_id,
    a.title,
    a.city,
    r.id AS review_id,
    r.rating,
    r.comment,
    r.reviewer_id
FROM reviews r
RIGHT JOIN accommodations a ON r.target_accommodation_id = a.id AND r.target_type = 'accommodation'
ORDER BY a.title ASC;

-- 2.4 FULL OUTER JOIN: Bidirectional Connections between Users
-- Illustrates symmetric matching requests across all registered accounts
SELECT 
    COALESCE(u1.full_name, 'Unknown Sender') AS sender_name,
    COALESCE(u2.full_name, 'Unknown Receiver') AS receiver_name,
    cr.id AS connection_id,
    cr.status AS connection_status,
    cr.created_at
FROM connection_requests cr
FULL OUTER JOIN users u1 ON cr.sender_id = u1.id
FULL OUTER JOIN users u2 ON cr.receiver_id = u2.id
ORDER BY cr.created_at DESC NULLS LAST;

-- 2.5 Multi-Table M:N JOIN: Accommodations, Junction Table, and Amenities Catalog
-- Aggregates all amenity tags associated with each accommodation
SELECT 
    a.id AS listing_id,
    a.title,
    a.city,
    a.monthly_rent,
    string_agg(am.name, ', ' ORDER BY am.name) AS amenities_list,
    count(am.id) AS total_amenities
FROM accommodations a
INNER JOIN accommodation_amenities aa ON a.id = aa.accommodation_id
INNER JOIN amenities am ON aa.amenity_id = am.id
GROUP BY a.id, a.title, a.city, a.monthly_rent
ORDER BY total_amenities DESC, a.title ASC;
