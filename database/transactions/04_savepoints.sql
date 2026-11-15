-- ============================================================================
-- 04: SAVEPOINTS AND PARTIAL TRANSACTION ROLLBACK
-- ============================================================================
-- Demonstrates nested transaction control using SAVEPOINT, RELEASE SAVEPOINT,
-- and ROLLBACK TO SAVEPOINT. Enables resilient multi-step business logic
-- where optional operations (e.g. sending a notification) can fail or be rolled
-- back without canceling the primary business transaction (e.g. creating a booking).

BEGIN;

-- Step 1: Mandatory Core Action - Create Booking Request
INSERT INTO booking_requests (
    id, sender_id, owner_id, listing_id, status, move_in_date, message
) VALUES (
    'demo-savepoint-req',
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM users OFFSET 1 LIMIT 1),
    (SELECT id FROM accommodations LIMIT 1),
    'pending',
    CURRENT_DATE + INTERVAL '14 days',
    'Application with savepoint verification.'
);

-- Establish Savepoint after critical write succeeds
SAVEPOINT after_booking_created;

-- Step 2: Attempt Secondary Non-Critical Action (Dispatching Alert Notification)
-- Suppose this second write encounters a transient validation issue or foreign key test
INSERT INTO notifications (
    id, recipient_id, type, title, body
) VALUES (
    'demo-notif-sp',
    'non-existent-user-id', -- Foreign Key Violation!
    'booking',
    'New Booking Request',
    'A seeker applied for your room.'
);

-- In a handler, when an error occurs during the secondary step:
-- Instead of aborting the entire booking, roll back ONLY to the savepoint!
ROLLBACK TO SAVEPOINT after_booking_created;

-- Step 3: Dispatch fallback notification to valid recipient
INSERT INTO notifications (
    id, recipient_id, type, title, body
) VALUES (
    'demo-notif-fallback',
    (SELECT id FROM users OFFSET 1 LIMIT 1),
    'booking',
    'New Booking Request',
    'A seeker applied for your room.'
);

-- Release the savepoint once complete
RELEASE SAVEPOINT after_booking_created;

-- Step 4: Commit transaction - primary booking and fallback notification persist!
COMMIT;
