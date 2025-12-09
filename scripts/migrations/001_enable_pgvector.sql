-- Migration 001: Enable pgvector extension
-- This extension provides vector data types and similarity search operators

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
