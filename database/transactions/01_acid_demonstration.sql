-- ============================================================================
-- 01: ACID PROPERTIES DEMONSTRATION IN POSTGRESQL
-- ============================================================================
-- ACID stands for:
--  A - ATOMICITY: All operations succeed, or all are rolled back.
--  C - CONSISTENCY: Every transaction transitions the database from one valid state
--                   to another, preserving all foreign keys, CHECK constraints, and types.
--  I - ISOLATION: Uncommitted transactions are invisible to concurrent transactions.
--  D - DURABILITY: Once committed, write-ahead logs (WAL) ensure changes survive power failure.

-- ----------------------------------------------------------------------------
-- DEMO 1: Successful Atomic Operation (BEGIN -> Multi-table Write -> COMMIT)
-- ----------------------------------------------------------------------------
-- Scenario: When a user creates an accommodation, we insert the accommodation
-- and attach default amenities inside a single transaction.

BEGIN;

INSERT INTO accommodations (
    id, owner_id, title, description, city, preferred_area,
    type, monthly_rent, security_deposit, available_rooms,
    available_from, status, has_virtual_tour
) VALUES (
    'demo-acc-101',
    (SELECT id FROM users LIMIT 1),
    'Demo Student Flat with WiFi',
    'Spacious 2BHK near university campus.',
    'Pune',
    'Kothrud',
    'flat',
    18500.00,
    37000.00,
    2,
    CURRENT_DATE + INTERVAL '7 days',
    'available',
    FALSE
);

-- Link an amenity within the same atomic boundary
INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
VALUES ('demo-acc-101', (SELECT id FROM amenities LIMIT 1));

COMMIT;

-- ----------------------------------------------------------------------------
-- DEMO 2: Consistency Failure and Atomicity Rollback (BEGIN -> Error -> ROLLBACK)
-- ----------------------------------------------------------------------------
-- Scenario: Attempting to insert an invalid negative rent or violating CHECK constraint
-- causes the entire transaction block to abort, ensuring consistency is never corrupted.

BEGIN;

-- Valid first statement
INSERT INTO notifications (id, recipient_id, type, title, body)
VALUES ('notif-demo-1', (SELECT id FROM users LIMIT 1), 'system', 'Alert', 'Test notice');

-- Invalid second statement violating monthly_rent > 0 CHECK constraint
-- This will cause an error: (monthly_rent > 0)
INSERT INTO accommodations (
    id, owner_id, title, description, city, preferred_area,
    type, monthly_rent, available_from
) VALUES (
    'demo-acc-invalid',
    (SELECT id FROM users LIMIT 1),
    'Invalid Rent Flat',
    'Desc',
    'Pune',
    'Viman Nagar',
    'flat',
    -5000.00, -- VIOLATION!
    CURRENT_DATE
);

-- Because the statement above fails, the transaction enters an aborted state.
-- Calling ROLLBACK returns the database to its pristine state prior to BEGIN.
ROLLBACK;
