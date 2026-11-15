-- ============================================================================
-- 03: CONCURRENT BOOKING SAFETY AND ROW-LEVEL LOCKING (SELECT ... FOR UPDATE)
-- ============================================================================
-- Prevents race conditions and double-booking bugs when two users attempt to
-- book the final available room at the exact same millisecond.
--
-- This pattern is actively implemented in NestMate backend repository:
-- src/booking-requests/booking-requests.repository.js

-- ----------------------------------------------------------------------------
-- Scenario: Host accepts a booking request atomically.
-- 1. Lock the booking request row and accommodation row using FOR UPDATE.
-- 2. Verify accommodation is still available and has rooms remaining.
-- 3. Transition booking status to 'accepted'.
-- 4. Decrement available_rooms or update status to 'booked' if 0 remaining.
-- 5. Auto-reject other competing pending requests for the same listing.
-- ----------------------------------------------------------------------------

BEGIN;

-- Step 1: Acquire exclusive row lock on the target accommodation listing
-- Any other transaction trying to modify or book this listing will WAIT here.
SELECT id, available_rooms, status
FROM accommodations
WHERE id = 'prop-12'
FOR UPDATE;

-- Step 2: Acquire exclusive lock on the booking request itself
SELECT id, status, sender_id, listing_id
FROM booking_requests
WHERE id = 'req-001'
FOR UPDATE;

-- Step 3: Update booking request status to 'accepted'
UPDATE booking_requests
SET status = 'accepted',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'req-001' AND status = 'pending';

-- Step 4: Decrement available rooms on accommodation
UPDATE accommodations
SET available_rooms = available_rooms - 1,
    status = CASE WHEN available_rooms - 1 <= 0 THEN 'booked' ELSE status END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'prop-12';

-- Step 5: If room count reached 0, automatically cancel or reject competing pending requests
UPDATE booking_requests
SET status = 'rejected',
    updated_at = CURRENT_TIMESTAMP
WHERE listing_id = 'prop-12' 
  AND status = 'pending' 
  AND id <> 'req-001';

-- Step 6: Commit transaction, releasing all row locks simultaneously
COMMIT;
