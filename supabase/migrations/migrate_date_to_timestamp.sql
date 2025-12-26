-- =====================================================
-- Migration: Convert '日期' column from TEXT to BIGINT (timestamp)
-- This script migrates existing date strings to Unix timestamps (milliseconds)
-- =====================================================

-- Step 1: Add new column for timestamps
ALTER TABLE problems ADD COLUMN IF NOT EXISTS "日期_new" BIGINT;

-- Step 2: Migrate data from old string format to timestamp
-- Supports multiple date formats:
-- - ISO 8601: "2025-01-01T10:00:00.000Z"
-- - With space: "2025-01-01 10:00:00"
-- - With slashes: "2025/01/01 10:00:00"
UPDATE problems
SET "日期_new" = CASE
  -- Try parsing as ISO 8601 or standard date format
  WHEN "日期" ~ '^\d{4}-\d{2}-\d{2}' THEN
    EXTRACT(EPOCH FROM ("日期"::timestamp) AT TIME ZONE 'UTC') * 1000
  -- Try parsing with slash separator
  WHEN "日期" ~ '^\d{4}/\d{2}/\d{2}' THEN
    EXTRACT(EPOCH FROM (replace("日期", '/', '-')::timestamp) AT TIME ZONE 'UTC') * 1000
  -- Fallback: use current time
  ELSE EXTRACT(EPOCH FROM now() AT TIME ZONE 'UTC') * 1000
END;

-- Step 3: Make new column NOT NULL after successful migration
ALTER TABLE problems ALTER COLUMN "日期_new" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE problems DROP COLUMN "日期";

-- Step 5: Rename new column
ALTER TABLE problems RENAME COLUMN "日期_new" TO "日期";

-- Step 6: Recreate index on the timestamp column
DROP INDEX IF EXISTS problems_date_idx;
CREATE INDEX problems_date_idx ON problems("日期");

-- =====================================================
-- Verification Query (run after migration to check)
-- =====================================================
-- SELECT
--   id,
--   "日期",
--   to_timestamp("日期" / 1000) AT TIME ZONE 'UTC' as converted_date,
--   created_at
-- FROM problems
-- ORDER BY "日期" DESC
-- LIMIT 10;
