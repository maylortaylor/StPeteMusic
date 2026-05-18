#!/bin/sh
# Runs inside postgres:16-alpine container.
# Env required: PGHOST, PGUSER, PGPASSWORD, PGSSLMODE (all set via docker -e flags)
#
# To add a migration: drop a NNN_description.sql file in database/migrations/.
# It will be picked up automatically on the next deploy — no edits needed here.
set -e

apply_if_new() {
  name="$1"
  path="$2"
  count=$(psql -d stpetemusic -t -c "SELECT COUNT(*) FROM schema_migrations WHERE filename='$name';" | tr -d ' \n')
  if [ "$count" = "0" ]; then
    echo "  → $name"
    psql -d stpetemusic -f "$path"
    psql -d stpetemusic -c "INSERT INTO schema_migrations(filename) VALUES('$name') ON CONFLICT DO NOTHING;"
  else
    echo "  ✓ $name (already applied)"
  fi
}

psql -d stpetemusic -c "CREATE TABLE IF NOT EXISTS schema_migrations(filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());"

# Bootstrap: schema and seed data must run before numbered migrations
apply_if_new "schema.sql" "/sql/schema.sql"
apply_if_new "seed.sql"   "/sql/seed.sql"

# Auto-discover all numbered migrations in filename order (001_, 002_, ...)
for path in $(find /sql/migrations -maxdepth 1 -name '*.sql' | sort); do
  name=$(basename "$path")
  apply_if_new "$name" "$path"
done
