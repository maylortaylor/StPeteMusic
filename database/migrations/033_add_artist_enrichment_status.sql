-- enrichment_status values: null | 'pending' | 'enrichment_ready' | 'enrichment_failed' | 'enrichment_approved'
ALTER TABLE artists ADD COLUMN IF NOT EXISTS enrichment_status VARCHAR(50);
