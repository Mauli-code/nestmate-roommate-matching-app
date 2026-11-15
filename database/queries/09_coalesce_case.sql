-- ============================================================================
-- 09: CONDITIONAL LOGIC (COALESCE, NULLIF, CASE WHEN)
-- ============================================================================
-- Demonstrates defensive NULL handling and multi-branch value mapping.

-- 9.1 COALESCE for Safe Fallback Values in User Profiles
SELECT 
    id,
    full_name,
    COALESCE(NULLIF(occupation, ''), 'Student / Unspecified') AS resolved_occupation,
    COALESCE(NULLIF(city, ''), 'Location Not Specified') AS resolved_city,
    COALESCE(NULLIF(bio, ''), 'No self-introduction provided yet.') AS resolved_bio,
    COALESCE(NULLIF(phone, ''), 'Private Contact') AS resolved_phone
FROM users
ORDER BY full_name ASC;

-- 9.2 CASE Expression: Classifying Accommodations into Budget Brackets
SELECT 
    title,
    city,
    monthly_rent,
    CASE 
        WHEN monthly_rent < 12000 THEN 'Economy / Low-Cost'
        WHEN monthly_rent BETWEEN 12000 AND 22000 THEN 'Mid-Tier Affordable'
        WHEN monthly_rent BETWEEN 22001 AND 35000 THEN 'Upper Mid-Range'
        ELSE 'Luxury / Premium'
    END AS price_segment,
    CASE 
        WHEN has_virtual_tour THEN 'Includes 360° VR Tour'
        ELSE 'Standard Media Only'
    END AS tour_feature_flag
FROM accommodations
ORDER BY monthly_rent ASC;

-- 9.3 Mapping Booking Status Codes to Actionable UI Labels and Colors
SELECT 
    id AS booking_id,
    sender_id,
    owner_id,
    status,
    CASE status
        WHEN 'pending'   THEN 'Awaiting Owner Approval'
        WHEN 'accepted'  THEN 'Confirmed Booking'
        WHEN 'rejected'  THEN 'Declined by Host'
        WHEN 'cancelled' THEN 'Withdrawn by Applicant'
        ELSE 'Unknown Status'
    END AS human_status_label,
    CASE status
        WHEN 'pending'   THEN '#FFA500' -- Orange
        WHEN 'accepted'  THEN '#28A745' -- Green
        WHEN 'rejected'  THEN '#DC3545' -- Red
        WHEN 'cancelled' THEN '#6C757D' -- Grey
    END AS ui_badge_color
FROM booking_requests
ORDER BY created_at DESC;
