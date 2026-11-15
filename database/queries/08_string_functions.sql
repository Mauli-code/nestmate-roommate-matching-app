-- ============================================================================
-- 08: STRING AND TEXT PROCESSING FUNCTIONS
-- ============================================================================
-- Demonstrates casing, sub-string parsing, concatenation, trimming, and regex/wildcards.

-- 8.1 Email Domain Extraction and Normalized Full Names
SELECT 
    id,
    UPPER(full_name) AS full_name_uppercase,
    LOWER(email) AS email_normalized,
    SPLIT_PART(email, '@', 1) AS email_username,
    SPLIT_PART(email, '@', 2) AS email_domain,
    LENGTH(bio) AS bio_character_count
FROM users
ORDER BY full_name ASC;

-- 8.2 Case-Insensitive Search (ILIKE) Across Title and Description
-- Finds accommodations mentioning terms like 'spacious' or 'wifi' regardless of case
SELECT 
    id,
    title,
    city,
    preferred_area,
    monthly_rent
FROM accommodations
WHERE title ILIKE '%spacious%' 
   OR description ILIKE '%spacious%'
   OR description ILIKE '%wifi%'
ORDER BY monthly_rent ASC;

-- 8.3 Formatted Address and Display Strings via CONCAT and ||
SELECT 
    id,
    title,
    CONCAT(title, ' (', preferred_area, ', ', city, ')') AS full_display_title,
    '₹ ' || TO_CHAR(monthly_rent, 'FM99,99,999.00') || ' / mo' AS formatted_rent_inr
FROM accommodations
ORDER BY monthly_rent DESC
LIMIT 5;

-- 8.4 Cleaned Bio Text and Substring Snippet Preview
SELECT 
    full_name,
    city,
    TRIM(bio) AS trimmed_bio,
    CASE 
        WHEN LENGTH(bio) > 50 THEN SUBSTRING(bio FROM 1 FOR 50) || '...'
        ELSE bio
    END AS short_preview
FROM users
WHERE bio IS NOT NULL AND bio <> ''
ORDER BY full_name ASC;
