-- Migration number: 002_enhance_schema.sql

-- Add published_at for timeline view (ISO8601 string YYYY-MM-DD or YYYY-MM)
ALTER TABLE papers ADD COLUMN published_at TEXT;

-- Add type to distinguish between standard papers and regular blogs/tutorials
-- Expected values: 'paper', 'blog'
ALTER TABLE papers ADD COLUMN type TEXT DEFAULT 'paper';
