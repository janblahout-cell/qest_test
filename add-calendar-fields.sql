-- Add calendar consent fields to oauth table
-- Run this in Supabase SQL Editor

ALTER TABLE oauth
ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT,
ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "calendarConsent" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "consentGrantedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'oauth'
ORDER BY ordinal_position;
