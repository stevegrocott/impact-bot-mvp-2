-- Initialize pgvector extension for Impact Bot v2
-- This script is run when the Docker container starts

-- Create vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create other required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE impact_bot_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE impact_bot_prod TO postgres;

-- Create indexes for vector operations (will be created by Prisma, but ensuring they exist)
-- These are sample indexes - actual ones will be created by Prisma migrations