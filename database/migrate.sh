#!/bin/sh
# Runs inside postgres:16-alpine container.
# Env required: PGHOST, PGUSER, PGPASSWORD, PGSSLMODE (all set via docker -e flags)
set -e

apply_if_new() {
  name="$1"
  path="$2"
  count=$(psql -d n8n -t -c "SELECT COUNT(*) FROM schema_migrations WHERE filename='$name';" | tr -d ' \n')
  if [ "$count" = "0" ]; then
    echo "  → $name"
    psql -d n8n -f "$path"
    psql -d n8n -c "INSERT INTO schema_migrations(filename) VALUES('$name') ON CONFLICT DO NOTHING;"
  else
    echo "  ✓ $name (already applied)"
  fi
}

psql -d n8n -c "CREATE TABLE IF NOT EXISTS schema_migrations(filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());"

apply_if_new "schema.sql"                "/sql/schema.sql"
apply_if_new "001_add_public_fields.sql" "/sql/migrations/001_add_public_fields.sql"
apply_if_new "002_add_artist_shows.sql"  "/sql/migrations/002_add_artist_shows.sql"
apply_if_new "003_seed_venues.sql"       "/sql/migrations/003_seed_venues.sql"
apply_if_new "seed.sql"                  "/sql/seed.sql"
apply_if_new "004_seed_artist_slugs.sql" "/sql/migrations/004_seed_artist_slugs.sql"
apply_if_new "005_fix_artist_slugs.sql"  "/sql/migrations/005_fix_artist_slugs.sql"
