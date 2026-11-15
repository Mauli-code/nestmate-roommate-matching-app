/**
 * NestMate Database Engineering Query Evaluation Runner
 * Executes representative queries across all 12 SQL categories against nestmate_db.
 * Uses existing connection pool with parameterized queries and defensive error handling.
 */

const { isPostgres, query, closePool } = require('./connection.js');

async function evaluateQueries() {
  console.log('='.repeat(80));
  console.log(' NESTMATE POSTGRESQL DATABASE ENGINEERING — QUERY EVALUATION SUITE');
  console.log('='.repeat(80));

  if (!isPostgres()) {
    console.error('ERROR: STORAGE_MODE must be "postgres" to run query evaluation.');
    process.exit(1);
  }

  const querySuite = [
    {
      category: '01. Filter, Sort & Pagination',
      name: 'Affordable Pune Accommodations (Rent <= 20,000 INR)',
      sql: `SELECT id, title, city, preferred_area, type, monthly_rent 
            FROM accommodations 
            WHERE city = 'Pune' AND status = 'available' AND monthly_rent <= 20000 
            ORDER BY monthly_rent ASC LIMIT 3;`
    },
    {
      category: '02. Relational JOINs',
      name: 'INNER JOIN: Accommodations with Owner Contact Details',
      sql: `SELECT a.id AS listing_id, a.title, a.city, a.monthly_rent, u.full_name AS owner_name, u.email 
            FROM accommodations a 
            INNER JOIN users u ON a.owner_id = u.id 
            WHERE a.status = 'available' 
            LIMIT 3;`
    },
    {
      category: '02. Relational JOINs (M:N)',
      name: 'M:N Multi-Table JOIN: Accommodations with Amenity Catalog Tags',
      sql: `SELECT a.id, a.title, string_agg(am.name, ', ' ORDER BY am.name) AS amenities, count(am.id) AS count 
            FROM accommodations a 
            INNER JOIN accommodation_amenities aa ON a.id = aa.accommodation_id 
            INNER JOIN amenities am ON aa.amenity_id = am.id 
            GROUP BY a.id, a.title 
            ORDER BY count DESC LIMIT 3;`
    },
    {
      category: '03. Aggregations & Grouping',
      name: 'Rental Statistics Grouped by City (AVG, MIN, MAX, COUNT)',
      sql: `SELECT city, count(*) AS total_listings, min(monthly_rent) AS min_rent, 
                   max(monthly_rent) AS max_rent, round(avg(monthly_rent), 2) AS avg_rent 
            FROM accommodations 
            WHERE status = 'available' 
            GROUP BY city 
            ORDER BY avg_rent DESC;`
    },
    {
      category: '03. Group Filtering (HAVING)',
      name: 'Most Favorited / Bookmarked Accommodations',
      sql: `SELECT a.id, a.title, a.city, a.monthly_rent, count(sa.user_id) AS total_saves 
            FROM accommodations a 
            INNER JOIN saved_accommodations sa ON a.id = sa.listing_id 
            GROUP BY a.id, a.title, a.city, a.monthly_rent 
            HAVING count(sa.user_id) >= 1 
            ORDER BY total_saves DESC LIMIT 3;`
    },
    {
      category: '04. Subqueries & Predicates',
      name: 'Scalar Subquery: Seekers with Budget Above Average Platform Budget',
      sql: `SELECT u.full_name, u.city, rp.max_budget, 
                   round((SELECT avg(max_budget) FROM roommate_preferences), 2) AS platform_avg 
            FROM users u 
            INNER JOIN roommate_preferences rp ON u.id = rp.user_id 
            WHERE rp.max_budget > (SELECT avg(max_budget) FROM roommate_preferences) 
            ORDER BY rp.max_budget DESC LIMIT 3;`
    },
    {
      category: '04. Correlated Subquery & EXISTS',
      name: 'EXISTS: Active Users who have Initiated Booking Requests',
      sql: `SELECT u.id, u.full_name, u.email, u.city 
            FROM users u 
            WHERE EXISTS (SELECT 1 FROM booking_requests br WHERE br.sender_id = u.id) 
            LIMIT 3;`
    },
    {
      category: '05. Common Table Expressions (WITH)',
      name: 'Multi-Stage CTE: Engagement Activity Score (Bookings + Messages)',
      sql: `WITH user_bookings AS (
              SELECT sender_id AS user_id, count(*) AS bookings_count FROM booking_requests GROUP BY sender_id
            ),
            user_messages AS (
              SELECT sender_id AS user_id, count(*) AS messages_count FROM messages GROUP BY sender_id
            )
            SELECT u.id, u.full_name, 
                   COALESCE(ub.bookings_count, 0) AS bookings_sent, 
                   COALESCE(um.messages_count, 0) AS messages_sent,
                   (COALESCE(ub.bookings_count, 0) * 3 + COALESCE(um.messages_count, 0)) AS activity_score
            FROM users u
            LEFT JOIN user_bookings ub ON u.id = ub.user_id
            LEFT JOIN user_messages um ON u.id = um.user_id
            ORDER BY activity_score DESC, u.full_name ASC LIMIT 4;`
    },
    {
      category: '06. Window Functions',
      name: 'DENSE_RANK & ROW_NUMBER over Partitioned Cities',
      sql: `SELECT city, title, monthly_rent, 
                   ROW_NUMBER() OVER (PARTITION BY city ORDER BY monthly_rent ASC) AS row_in_city,
                   DENSE_RANK() OVER (PARTITION BY city ORDER BY monthly_rent ASC) AS price_rank 
            FROM accommodations 
            WHERE status = 'available' 
            ORDER BY city, monthly_rent ASC LIMIT 5;`
    },
    {
      category: '07. Date/Time & Timestamps',
      name: 'Account Longevity & Age Calculation using AGE() and DATE_TRUNC()',
      sql: `SELECT id, full_name, created_at::DATE AS signup_date, 
                   TO_CHAR(created_at, 'FMMonth DD, YYYY') AS readable_date,
                   AGE(CURRENT_TIMESTAMP, created_at) AS account_age 
            FROM users 
            ORDER BY created_at ASC LIMIT 3;`
    },
    {
      category: '08. String Functions & Pattern Matching',
      name: 'Email Parsing with SPLIT_PART and Casing Normalization',
      sql: `SELECT full_name, LOWER(email) AS email, 
                   SPLIT_PART(email, '@', 2) AS email_domain,
                   LENGTH(bio) AS bio_char_length 
            FROM users 
            ORDER BY full_name ASC LIMIT 3;`
    },
    {
      category: '09. Conditional Logic & Defaults',
      name: 'CASE Expression: Rent Bracket Categorization and COALESCE Fallback',
      sql: `SELECT title, city, monthly_rent,
                   COALESCE(NULLIF(description, ''), 'Standard accommodation') AS preview_desc,
                   CASE 
                     WHEN monthly_rent < 15000 THEN 'Economy'
                     WHEN monthly_rent BETWEEN 15000 AND 25000 THEN 'Moderate'
                     ELSE 'Premium'
                   END AS tier_classification
            FROM accommodations 
            ORDER BY monthly_rent ASC LIMIT 4;`
    },
    {
      category: '10. Set Operations',
      name: 'INTERSECT: Reciprocal Connection Request Participants',
      sql: `SELECT sender_id AS user_id FROM connection_requests 
            INTERSECT 
            SELECT receiver_id AS user_id FROM connection_requests;`
    },
    {
      category: '11. Analytics & Reporting',
      name: 'Supply vs Demand Analysis: Average Seeker Budget vs Market Rent',
      sql: `WITH city_demand AS (
              SELECT u.city, round(avg(rp.max_budget), 2) AS avg_max_budget, count(*) AS seeker_count
              FROM users u INNER JOIN roommate_preferences rp ON u.id = rp.user_id
              WHERE u.city <> '' GROUP BY u.city
            ),
            city_supply AS (
              SELECT city, round(avg(monthly_rent), 2) AS avg_rent, count(*) AS listing_count
              FROM accommodations WHERE status = 'available' GROUP BY city
            )
            SELECT COALESCE(s.city, d.city) AS city,
                   COALESCE(d.seeker_count, 0) AS seekers,
                   COALESCE(d.avg_max_budget, 0) AS avg_budget,
                   COALESCE(s.listing_count, 0) AS listings,
                   COALESCE(s.avg_rent, 0) AS avg_market_rent,
                   ROUND(COALESCE(s.avg_rent, 0) - COALESCE(d.avg_max_budget, 0), 2) AS budget_rent_gap
            FROM city_supply s
            FULL OUTER JOIN city_demand d ON s.city = d.city
            ORDER BY listings DESC;`
    },
    {
      category: '12. Keyset Pagination & Facets',
      name: 'Single-Query Paginated Results with Total Count via CTE',
      sql: `WITH filtered AS (
              SELECT id, title, city, monthly_rent FROM accommodations WHERE status = 'available'
            ),
            counted AS (
              SELECT count(*) AS total_rows FROM filtered
            )
            SELECT f.*, c.total_rows, CEIL(c.total_rows::NUMERIC / 3) AS total_pages
            FROM filtered f CROSS JOIN counted c
            ORDER BY f.monthly_rent ASC LIMIT 3;`
    }
  ];

  let passed = 0;
  for (let i = 0; i < querySuite.length; i++) {
    const q = querySuite[i];
    console.log(`\n[${i + 1}/${querySuite.length}] ${q.category}`);
    console.log(`Query: ${q.name}`);
    try {
      const startTime = Date.now();
      const result = await query(q.sql);
      const duration = Date.now() - startTime;
      console.log(`Status: PASS (${duration}ms) | Rows returned: ${result.rows.length}`);
      if (result.rows.length > 0) {
        console.log('Sample Result:', JSON.stringify(result.rows[0], null, 2));
      }
      passed++;
    } catch (err) {
      console.error(`Status: FAIL - Error executing query:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(` SUMMARY: ${passed}/${querySuite.length} queries successfully executed against nestmate_db`);
  console.log('='.repeat(80));

  await closePool();
  if (passed !== querySuite.length) {
    process.exit(1);
  }
}

evaluateQueries().catch(async (err) => {
  console.error('Fatal evaluation error:', err);
  await closePool();
  process.exit(1);
});
