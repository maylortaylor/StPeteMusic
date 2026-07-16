-- Widens vantage_readonly (see 035_add_vantage_readonly_role.sql) from
-- SELECT on just eventbrite_events/events to SELECT on every table in the
-- public schema, including future ones. Deliberate choice by the account
-- owner — not worried about narrower scope for this role, prefers broader
-- access over re-granting per new table.
--
-- Note: artists/persons have a few BYTEA columns (venmo, zelle,
-- other_payment, email, phone) that are application-level encrypted (see
-- packages/db/src/db.ts's own comment on those columns). SELECT access
-- doesn't decrypt them — that requires a session-level encryption key
-- (app.encryption_key) this role's connection never sets — so those
-- specific columns remain ciphertext even with this grant. Every other
-- column in every table is now plainly readable by this role.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO vantage_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO vantage_readonly;
