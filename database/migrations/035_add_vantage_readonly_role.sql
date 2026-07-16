-- Dedicated, read-only Postgres role for vantage (a separate personal
-- dashboard app, github.com/maylortaylor/vantage) to read Eventbrite
-- ticket-revenue numbers for its "Businesses" section. Scoped to SELECT on
-- eventbrite_events + events ONLY — never artists/persons, which hold
-- encrypted payment/contact columns (see this repo's own
-- packages/db/src/db.ts top-of-file warning about those columns).
--
-- SECURITY: this migration intentionally does NOT set a password. This
-- file is committed to git and auto-applied to production on the next
-- deploy (see database/migrate.sh) — a password embedded here would be a
-- leaked production credential the moment this merges. After this
-- migration runs, set the password out-of-band (not in any committed
-- file):
--   ALTER ROLE vantage_readonly WITH PASSWORD '<generate one, do not commit it>';
-- then put the resulting connection string in vantage's .env.local as
-- STPETEMUSIC_DATABASE_URL (gitignored there, same convention as this
-- repo's own DATABASE_URL).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vantage_readonly') THEN
    CREATE ROLE vantage_readonly WITH LOGIN;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE stpetemusic TO vantage_readonly;
GRANT USAGE ON SCHEMA public TO vantage_readonly;
GRANT SELECT ON eventbrite_events, events TO vantage_readonly;

-- Deliberately no ALTER DEFAULT PRIVILEGES — future tables this role needs
-- require their own explicit GRANT in a new migration. Least-privilege by
-- default, not auto-expanding.
