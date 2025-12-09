#!/bin/bash
# Run all Supabase migrations in order
# Usage: ./scripts/run-migrations.sh <SUPABASE_URL> <SERVICE_KEY>

set -e  # Exit on error

SUPABASE_URL=$1
SUPABASE_SERVICE_KEY=$2

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ Error: Missing required arguments"
  echo "Usage: ./run-migrations.sh <SUPABASE_URL> <SERVICE_KEY>"
  echo ""
  echo "Example:"
  echo "  ./scripts/run-migrations.sh https://xxxxx.supabase.co eyJhbGc..."
  exit 1
fi

echo "🚀 Starting Supabase migrations..."
echo "📍 Target: $SUPABASE_URL"
echo ""

# Extract database connection string from Supabase URL
# Supabase URL format: https://xxxxx.supabase.co
# Database URL format: postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found"
    echo "Please install PostgreSQL client tools:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls -1 scripts/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "❌ Error: No migration files found in scripts/migrations/"
    exit 1
fi

echo "Found $MIGRATION_COUNT migration files"
echo ""

# Run each migration in order
for file in scripts/migrations/*.sql; do
  filename=$(basename "$file")
  echo "📝 Running migration: $filename"

  # Execute the SQL file
  psql "$DB_URL" -f "$file" -v ON_ERROR_STOP=1

  if [ $? -eq 0 ]; then
    echo "✅ Successfully applied: $filename"
  else
    echo "❌ Failed to apply: $filename"
    exit 1
  fi

  echo ""
done

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify schema in Supabase dashboard"
echo "  2. Run seed script: npm run seed"
