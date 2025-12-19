-- AlterEnum
-- This migration adds OPENROUTER to the AiProvider enum
-- Note: GROK may already exist in the database, so we use IF NOT EXISTS pattern

DO $$ 
BEGIN
    -- Add GROK if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'GROK' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AiProvider')) THEN
        ALTER TYPE "AiProvider" ADD VALUE 'GROK';
    END IF;
    
    -- Add OPENROUTER
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OPENROUTER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AiProvider')) THEN
        ALTER TYPE "AiProvider" ADD VALUE 'OPENROUTER';
    END IF;
END $$;
