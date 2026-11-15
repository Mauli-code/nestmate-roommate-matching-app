-- ============================================================================
-- 02: TRANSACTION ISOLATION LEVELS IN POSTGRESQL
-- ============================================================================
-- The ANSI/ISO SQL standard defines 4 isolation levels:
-- 1. READ UNCOMMITTED
-- 2. READ COMMITTED (PostgreSQL Default)
-- 3. REPEATABLE READ
-- 4. SERIALIZABLE
--
-- CRITICAL POSTGRESQL IMPLEMENTATION DETAIL:
-- In PostgreSQL, READ UNCOMMITTED behaves identically to READ COMMITTED!
-- Why? PostgreSQL implements Multiversion Concurrency Control (MVCC).
-- In MVCC, readers never block writers and writers never block readers.
-- Rows maintain transaction creation (xmin) and expiration (xmax) metadata.
-- An uncommitted row version is physically invisible to concurrent transactions.
-- Therefore, "Dirty Reads" (reading uncommitted writes of another transaction)
-- are physically impossible in PostgreSQL.

-- ----------------------------------------------------------------------------
-- 1. READ COMMITTED (Default)
-- ----------------------------------------------------------------------------
-- Each individual SELECT statement sees only data committed before that specific
-- query executed. If another transaction commits a change between Query A and
-- Query B, Query B will see the new change (Non-Repeatable Read).

BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Statement 1 sees the state at time T1
SELECT count(*) AS available_count FROM accommodations WHERE status = 'available';

-- (If concurrent Transaction B inserts a new listing and commits at T2...)

-- Statement 2 sees the state at time T3, which includes Transaction B's changes!
SELECT count(*) AS available_count FROM accommodations WHERE status = 'available';

COMMIT;

-- ----------------------------------------------------------------------------
-- 2. REPEATABLE READ
-- ----------------------------------------------------------------------------
-- A query in a REPEATABLE READ transaction sees only data committed before the
-- transaction's FIRST query began. Even if concurrent transactions insert,
-- update, or delete rows and commit, this transaction's snapshot remains frozen.
-- Prevents Non-Repeatable Reads and Phantom Reads.

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Snapshot is acquired at the first query
SELECT id, title, monthly_rent FROM accommodations WHERE city = 'Pune';

-- Concurrent updates committed elsewhere will NOT be visible here during this session.
SELECT id, title, monthly_rent FROM accommodations WHERE city = 'Pune';

COMMIT;

-- ----------------------------------------------------------------------------
-- 3. SERIALIZABLE
-- ----------------------------------------------------------------------------
-- Guarantees that concurrent transactions produce results identical to some
-- purely sequential, non-concurrent execution order.
-- PostgreSQL implements Serializable Snapshot Isolation (SSI), which detects
-- dependency cycles ("rw-antidependencies") and automatically raises a
-- 40001 (serialization_failure) error, requiring the application to retry.

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

SELECT sum(available_rooms) FROM accommodations WHERE preferred_area = 'Kothrud';

-- If another serializable transaction concurrently modifies the same domain,
-- one of them will safely abort with a serialization_failure error.

COMMIT;
