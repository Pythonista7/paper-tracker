-- Migration number: 003_add_completed_at.sql

-- Add completed_at timestamp to track when a paper/blog was finished
ALTER TABLE papers ADD COLUMN completed_at TEXT;
