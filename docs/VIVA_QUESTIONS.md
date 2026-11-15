# NestMate Database Engineering & RDBMS Viva Voce Preparation Guide

This guide contains **44 curated questions and concise technical answers** covering fundamental database concepts, SQL, normalization, concurrency control, transaction isolation, and NestMate's specific PostgreSQL implementation.

---

## Part 1: Relational Database Foundations & SQL Basics

### Q1. What is an RDBMS, and how does PostgreSQL differ from traditional flat-file storage?
**Answer**: An RDBMS (Relational Database Management System) organizes data into structured tables consisting of rows and columns with strict relational constraints (PK, FK, CHECK). Flat-file storage lacks ACID transaction safety, concurrent multi-user write protection, relational indexing, and schema enforcement, leading to race conditions and corruption upon crashes.

### Q2. Categorize the main sub-languages of SQL with examples.
**Answer**:
- **DDL (Data Definition Language)**: Defines schema structure (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`).
- **DML (Data Manipulation Language)**: Modifies table data (`INSERT`, `UPDATE`, `DELETE`).
- **DQL (Data Query Language)**: Reads and projects data (`SELECT`).
- **DCL (Data Control Language)**: Manages permissions and security (`GRANT`, `REVOKE`).
- **TCL (Transaction Control Language)**: Manages transaction boundaries (`BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`).

### Q3. What is the difference between `CHAR`, `VARCHAR`, and `TEXT` in PostgreSQL?
**Answer**: `CHAR(n)` is fixed-length with blank padding. `VARCHAR(n)` is variable-length with a maximum cap $n$. In PostgreSQL, `TEXT` is variable-length without an explicit character limit. Under the hood, PostgreSQL uses the same `varlena` storage engine for both `VARCHAR` and `TEXT`, meaning performance between `VARCHAR` and `TEXT` is identical.

### Q4. What is the difference between `DELETE`, `TRUNCATE`, and `DROP`?
**Answer**:
- `DELETE`: DML operation; removes rows one by one (or filtered by WHERE); triggers table row-level triggers; generates full WAL logging; can be rolled back.
- `TRUNCATE`: DDL operation; quickly empties the table by deallocating data pages; cannot use WHERE; resets high-water mark; faster for large tables.
- `DROP`: DDL operation; completely removes the table schema, indexes, constraints, and data from the database catalog.

### Q5. What is the difference between `COUNT(*)`, `COUNT(column)`, and `COUNT(DISTINCT column)`?
**Answer**: `COUNT(*)` counts all rows returned by the query regardless of NULL values. `COUNT(column)` counts only rows where the specified column is NOT NULL. `COUNT(DISTINCT column)` counts the number of unique, non-null values for that column.

---

## Part 2: Keys, Integrity, and Constraints

### Q6. What is a Primary Key and how does it differ from a Unique Constraint?
**Answer**: A Primary Key uniquely identifies each row in a table, strictly forbids `NULL` values, and a table can have only ONE primary key. A `UNIQUE` constraint also enforces value uniqueness, but allows `NULL` values (in standard SQL), and a single table can contain multiple `UNIQUE` constraints.

### Q7. What is a Composite Key? Where is it used in NestMate?
**Answer**: A composite key is a primary key composed of two or more columns combined to enforce entity uniqueness. In NestMate, composite keys are used in junction tables:
- `accommodation_amenities(accommodation_id, amenity_id)`
- `saved_accommodations(user_id, listing_id)`
- `saved_roommates(user_id, roommate_id)`
- `user_blocks(owner_id, blocked_user_id)`

### Q8. What is Referential Integrity and what does `ON DELETE CASCADE` do?
**Answer**: Referential integrity ensures that foreign key relationships remain valid and no orphaned child records exist without a corresponding parent. `ON DELETE CASCADE` specifies that when a parent row is deleted (e.g., a user in `users`), all associated child records (e.g., their `roommate_preferences`, `accommodations`, and `booking_requests`) are automatically removed by the database engine.

### Q9. What is a CHECK constraint? Give two real examples from NestMate.
**Answer**: A CHECK constraint specifies a boolean predicate that every row in the table must satisfy upon insert or update.
1. Budget range integrity: `CHECK (max_budget >= min_budget)` in `roommate_preferences`.
2. Anti-self-booking check: `CHECK (sender_id <> owner_id)` in `booking_requests`.

### Q10. What is a Partial Index and why is it advantageous in NestMate?
**Answer**: A partial index is an index built over a subset of rows defined by a conditional `WHERE` clause. In NestMate:
```sql
CREATE INDEX idx_accommodations_city_rent 
ON accommodations(city, monthly_rent) 
WHERE status = 'available';
```
This excludes inactive or booked properties, reducing index memory size and speeding up student searches for available housing.

---

## Part 3: Database Normalization (1NF through BCNF)

### Q11. What is Normalization and what problems does it solve?
**Answer**: Normalization is a systematic database design technique that decomposes tables to eliminate data redundancy and prevent data modification anomalies (Insertion, Update, and Deletion anomalies).

### Q12. Explain First Normal Form (1NF) with respect to NestMate.
**Answer**: A relation is in 1NF if all attribute values are atomic (indivisible) and there are no repeating groups. In NestMate, rather than storing amenities as a comma-separated string like `'WiFi, AC, Kitchen'` inside `accommodations`, we created a dedicated `amenities` catalog and linked them via `accommodation_amenities`.

### Q13. Explain Second Normal Form (2NF).
**Answer**: A relation is in 2NF if it is in 1NF and every non-key attribute is fully functionally dependent on the primary key (no partial dependencies on a subset of a composite primary key). In `accommodation_amenities(accommodation_id, amenity_id)`, there are no descriptive non-key columns, guaranteeing 2NF compliance.

### Q14. Explain Third Normal Form (3NF).
**Answer**: A relation is in 3NF if it is in 2NF and has no transitive functional dependencies ($X \to Y$ and $Y \to Z$ where $Z$ is a non-key attribute). In NestMate's `accommodations`, we do not store host details like `owner_name` or `owner_phone`; we only store `owner_id` (FK $\to$ `users.id`). Host contact information is retrieved via JOIN, avoiding update anomalies if a user changes their phone.

### Q15. Explain Boyce-Codd Normal Form (BCNF).
**Answer**: A relation is in BCNF if for every non-trivial functional dependency $X \to Y$, the determinant $X$ is a superkey (candidate key). NestMate's `users` table is in BCNF because the determinants are `id` (PK) and `email` (UNIQUE), both of which are valid candidate keys.

### Q16. Is `notification_preferences` with multiple boolean flags a normalization violation?
**Answer**: No. Each boolean flag represents an independent attribute of a user's notification configuration (e.g., `email_alerts`, `push_notifications`, `messages`). Storing them as explicit boolean columns enforces static typing, schema clarity, and fast single-row reads without requiring an extra key-value EAV (Entity-Attribute-Value) anti-pattern.

### Q17. How does NestMate handle the polymorphic review relationship without violating 1NF?
**Answer**: In `reviews`, a review can target either a roommate or an accommodation. Rather than storing an untyped generic string ID, NestMate defines two explicit nullable foreign keys: `target_user_id` and `target_accommodation_id`, governed by a domain CHECK constraint:
```sql
CHECK (
  (target_type = 'roommate' AND target_user_id IS NOT NULL AND target_accommodation_id IS NULL)
  OR
  (target_type = 'accommodation' AND target_accommodation_id IS NOT NULL AND target_user_id IS NULL)
)
```
This guarantees foreign key referential integrity while maintaining atomic, typed values.

---

## Part 4: Advanced SQL Queries & Relational Operators

### Q18. What is the difference between `WHERE` and `HAVING`?
**Answer**: `WHERE` filters individual rows BEFORE any grouping or aggregate calculations take place. `HAVING` filters grouped rows AFTER the `GROUP BY` and aggregate functions (like `COUNT`, `AVG`, `SUM`) have been evaluated.

### Q19. What is the difference between `INNER JOIN`, `LEFT JOIN`, and `FULL OUTER JOIN`?
**Answer**:
- `INNER JOIN`: Returns only rows that have matching values in both tables.
- `LEFT JOIN`: Returns all rows from the left table, and matched rows from the right table (with NULLs for unmatched right rows).
- `FULL OUTER JOIN`: Returns all rows when there is a match in either left or right table, filling unmatched columns on either side with NULLs.

### Q20. What is a Correlated Subquery and how does it execute?
**Answer**: A correlated subquery is an inner subquery that references columns from the outer query. Unlike a regular subquery which executes once, a correlated subquery conceptually executes once for every candidate row evaluated by the outer query (e.g., finding accommodations where rent is lower than the average rent of that specific accommodation's city).

### Q21. What is the difference between `EXISTS` and `IN`?
**Answer**: `IN` evaluates whether a value matches any value in a list or subquery result set (and handles NULLs cautiously). `EXISTS` tests for the presence of any row returned by a subquery and short-circuits to `TRUE` as soon as the first matching row is found, typically yielding superior performance for large subquery sets.

### Q22. What is a Common Table Expression (CTE) and what are its advantages?
**Answer**: A CTE (`WITH` clause) defines a temporary, named result set valid only within the execution scope of a single query. Advantages include modularizing complex multi-stage pipelines, improving readability over deeply nested subqueries, and enabling recursive hierarchical queries.

### Q23. What is a Window Function and how does it differ from `GROUP BY`?
**Answer**: Both perform calculations across a set of rows. However, `GROUP BY` collapses the rows into a single summary row per group. A Window Function (using `OVER (PARTITION BY ... ORDER BY ...)`) computes an aggregate or ranking value across the partition while preserving the individual row identity and count of the original table.

### Q24. Explain the difference between `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()`.
**Answer**: When ranking ties (e.g., rents of ₹10,000, ₹10,000, ₹15,000):
- `ROW_NUMBER()`: Assigns consecutive unique integers regardless of ties (1, 2, 3).
- `RANK()`: Assigns same rank to ties but leaves gaps in subsequent ranks (1, 1, 3).
- `DENSE_RANK()`: Assigns same rank to ties without skipping subsequent ranks (1, 1, 2).

### Q25. What is the difference between `UNION` and `UNION ALL`?
**Answer**: `UNION` combines result sets from two queries and performs an implicit `DISTINCT` sort pass to remove duplicate rows. `UNION ALL` combines result sets without deduplication, making it significantly faster when duplicates are acceptable or known not to exist.

---

## Part 5: Transactions, ACID, and Concurrency Control

### Q26. Define ACID properties with an example from NestMate.
**Answer**:
- **Atomicity**: In booking acceptance, updating booking status to `accepted` and decrementing `available_rooms` occur together; if either fails, all changes rollback.
- **Consistency**: Database transitions between valid states, never permitting `available_rooms < 0` or orphan foreign keys.
- **Isolation**: Concurrent users viewing accommodation lists do not see partial uncommitted state during booking acceptance.
- **Durability**: Once `COMMIT` returns, PostgreSQL Write-Ahead Logging (WAL) guarantees the booking survives sudden power outages.

### Q27. What are the four ANSI SQL transaction isolation levels?
**Answer**:
1. Read Uncommitted
2. Read Committed
3. Repeatable Read
4. Serializable

### Q28. How does PostgreSQL implement `READ UNCOMMITTED`?
**Answer**: In PostgreSQL, `READ UNCOMMITTED` behaves identically to `READ COMMITTED`. PostgreSQL uses Multiversion Concurrency Control (MVCC) where row visibility is determined by tuple header transaction IDs (`xmin`, `xmax`). An uncommitted write is physically invisible to other transactions, making "Dirty Reads" impossible by design in PostgreSQL.

### Q29. What is a Non-Repeatable Read vs a Phantom Read?
**Answer**:
- **Non-Repeatable Read**: Transaction T1 reads a row; Transaction T2 updates or deletes that row and commits; T1 re-reads the row and finds the values changed.
- **Phantom Read**: Transaction T1 reads a set of rows matching a WHERE filter; Transaction T2 inserts a new row matching that filter and commits; T1 re-executes the query and finds a new "phantom" row.

### Q30. What is a SAVEPOINT and why is it useful?
**Answer**: A SAVEPOINT defines a checkpoint within an active transaction. If an error occurs in a non-essential step (e.g., sending an alert notification), the transaction can execute `ROLLBACK TO SAVEPOINT` to undo only that failed step while preserving preceding operations (e.g., the primary booking insert) before issuing a final `COMMIT`.

### Q31. What is Row-Level Locking and how does `SELECT ... FOR UPDATE` work?
**Answer**: `SELECT ... FOR UPDATE` acquires an exclusive lock on the specific rows returned by the query. Any concurrent transaction attempting to read the same row with `FOR UPDATE` or update/delete that row will block until the first transaction commits or rolls back, preventing double-booking race conditions.

---

## Part 6: Performance, Indexing, and Query Optimization

### Q32. What is an Index and what underlying data structure does PostgreSQL use by default?
**Answer**: An index is an auxiliary data structure that accelerates data retrieval without scanning every page in the table. By default, PostgreSQL creates balanced B-Tree (B+ Tree) indexes, which support equality (`=`) and range queries (`<`, `<=`, `>`, `>=`, `BETWEEN`).

### Q33. What is the difference between a Sequential Scan (Seq Scan) and an Index Scan?
**Answer**: A Sequential Scan reads the table page by page from beginning to end ($O(N)$). An Index Scan traverses a B-Tree index to locate specific tuple pointers ($O(\log N)$) and then fetches the exact heap pages. For small tables or queries returning a large fraction of the table, the query planner prefers Seq Scan to avoid random disk I/O.

### Q34. How does `EXPLAIN` work in PostgreSQL?
**Answer**: `EXPLAIN` displays the execution plan generated by the PostgreSQL cost-based query optimizer. It details the planned execution tree (Seq Scan, Index Scan, Hash Join, Nested Loop), estimated startup and total cost units, estimated row counts, and projected tuple widths.

### Q35. What is a Composite Index and what is the "Leftmost Prefix" rule?
**Answer**: A composite index is defined on multiple columns, e.g., `(city, monthly_rent)`. Under the leftmost prefix rule, the index can be used for queries filtering on `city` alone or `city AND monthly_rent`, but cannot be efficiently used for queries filtering only on `monthly_rent` without `city`.

---

## Part 7: NestMate Architecture & College Project Implementation

### Q36. How does NestMate support both PostgreSQL and In-Memory modes?
**Answer**: Through the `STORAGE_MODE` environment variable. When `STORAGE_MODE=postgres`, repositories execute parameterized SQL statements via a PostgreSQL connection pool (`src/database/connection.js`). When `STORAGE_MODE=memory`, repositories interact with lightweight JavaScript in-memory Maps, allowing unit tests (`npm test`) to execute in isolation without requiring a live database.

### Q37. Why are parameterized queries (`$1, $2, ...`) critical in NestMate?
**Answer**: Parameterized queries separate the SQL code from user-supplied input data. The database driver transmits data separately from the command string, completely preventing SQL Injection attacks and allowing the query planner to cache query execution plans.

### Q38. How does NestMate enforce canonical uniqueness in 1-on-1 chat conversations?
**Answer**: The `conversations` table enforces `CHECK (user1_id < user2_id)` and `UNIQUE (user1_id, user2_id)`. When two users chat, the backend sorts their IDs lexicographically before lookup or insertion. This prevents duplicate converse rows like `(A, B)` and `(B, A)`.

### Q39. How does NestMate model 360-degree virtual room tours in PostgreSQL?
**Answer**: In `virtual_tour_scenes`, each scene belongs to an `accommodation_id` (FK), storing `room_name`, `panorama_url`, default landing flag, initial `yaw` and `pitch` coordinates, and an interactive `hotspots` column stored as PostgreSQL `JSONB`.

### Q40. Why did you use `JSONB` for virtual tour hotspots instead of a separate table?
**Answer**: Hotspots represent visual coordinates (x, y, pitch, yaw, targetSceneId) that are always loaded and rendered together with the parent scene. Storing them as structured `JSONB` provides document-style schema flexibility without requiring multiple JOINs during high-frequency 360° panorama scene transitions.

### Q41. How does NestMate ensure password security?
**Answer**: Passwords are never stored in plain text. When a user registers or changes their password, NestMate salts and hashes the password using `bcryptjs` with an adaptive work factor before persisting the resulting hash into `users.password_hash`. The password hash is explicitly excluded from API responses.

### Q42. What happens to related records when an accommodation is deleted?
**Answer**: Because all child foreign keys (`accommodation_amenities`, `virtual_tour_scenes`, `booking_requests`, `saved_accommodations`) define `ON DELETE CASCADE`, removing an accommodation automatically and atomically deletes all associated scenes, amenity links, bookmarks, and booking records without leaving dangling references.

### Q43. How does the roommate matching algorithm integrate with PostgreSQL?
**Answer**: Candidate roommate profiles are queried from `users` and `roommate_preferences` using SQL filters (excluding the current user, deactivated accounts, and blocked users). The 4-pillar compatibility algorithm (Budget 25%, Location 25%, Lifestyle 25%, Habits 25%) is computed, and results are ranked and paginated.

### Q44. How does NestMate verify database connectivity and migration status?
**Answer**: The repository includes dedicated CLI scripts:
- `npm run db:check`: Verifies TCP connectivity and pool initialization.
- `npm run db:migrate`: Executes `database/schema.sql` idempotently (`CREATE TABLE IF NOT EXISTS`).
- `npm run db:seed`: Seeds realistic fictional demonstration data.
- `npm run db:evaluate`: Programmatically executes 15 advanced SQL queries across all 12 RDBMS categories.
