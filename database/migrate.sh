#!/bin/sh
# Runs inside postgres:16-alpine container.
# Env required: PGHOST, PGUSER, PGPASSWORD, PGSSLMODE (all set via docker -e flags)
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

apply_if_new "schema.sql"                "/sql/schema.sql"
apply_if_new "001_add_public_fields.sql" "/sql/migrations/001_add_public_fields.sql"
apply_if_new "002_add_artist_shows.sql"  "/sql/migrations/002_add_artist_shows.sql"
apply_if_new "003_seed_venues.sql"       "/sql/migrations/003_seed_venues.sql"
apply_if_new "seed.sql"                  "/sql/seed.sql"
apply_if_new "004_seed_artist_slugs.sql" "/sql/migrations/004_seed_artist_slugs.sql"
apply_if_new "005_fix_artist_slugs.sql"  "/sql/migrations/005_fix_artist_slugs.sql"
apply_if_new "006_rename_sr_producer_remove_artists.sql" "/sql/migrations/006_rename_sr_producer_remove_artists.sql"
apply_if_new "007_fix_event_producer_type.sql"          "/sql/migrations/007_fix_event_producer_type.sql"
apply_if_new "008_expand_schema.sql"                   "/sql/migrations/008_expand_schema.sql"
apply_if_new "009_seed_new_artists.sql"                "/sql/migrations/009_seed_new_artists.sql"
apply_if_new "010_backfill_existing.sql"               "/sql/migrations/010_backfill_existing.sql"
apply_if_new "011_seed_venues.sql"                     "/sql/migrations/011_seed_venues.sql"
apply_if_new "012_seed_persons.sql"                    "/sql/migrations/012_seed_persons.sql"
apply_if_new "013_seed_organizations.sql"              "/sql/migrations/013_seed_organizations.sql"
apply_if_new "014_update_venues.sql"                   "/sql/migrations/014_update_venues.sql"
apply_if_new "015_add_events_table.sql"                "/sql/migrations/015_add_events_table.sql"
apply_if_new "016_add_venue_to_events.sql"             "/sql/migrations/016_add_venue_to_events.sql"
apply_if_new "017_add_venue_platform_ids.sql"          "/sql/migrations/017_add_venue_platform_ids.sql"
