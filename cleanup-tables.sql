-- SQL to cleanup unused NextAuth tables
-- Run this in Supabase SQL Editor

-- Drop Account table
DROP TABLE IF EXISTS "Account" CASCADE;

-- Drop Session table
DROP TABLE IF EXISTS "Session" CASCADE;

-- Drop User table (capital U - not needed, using lowercase 'users' instead)
DROP TABLE IF EXISTS "User" CASCADE;

-- Verify remaining tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
