#!/usr/bin/env bash
# backup-n8n.sh — backs up the n8n Docker volume to S3
#
# Run via cron on the EC2 server:
#   0 4 */2 * * /home/ec2-user/stpetemusic/scripts/backup-n8n.sh >> /var/log/n8n-backup.log 2>&1
#
# Auth: uses the EC2 IAM instance profile — no keys needed.
# Retention: S3 lifecycle rule expires objects after 30 days automatically.

set -euo pipefail

BUCKET="stpetemusic-n8n-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="/tmp/n8n-backup-${TIMESTAMP}.tar.gz"
S3_KEY="n8n-data/n8n-backup-${TIMESTAMP}.tar.gz"
DB_DUMP_FILE="/tmp/stpetemusic-db-${TIMESTAMP}.sql.gz"
DB_S3_KEY="postgres/stpetemusic-db-${TIMESTAMP}.sql.gz"

# Load .env to get POSTGRES_USER and POSTGRES_PASSWORD
# shellcheck disable=SC1090
source /home/ec2-user/stpetemusic/.env

echo "[$(date)] Starting backup..."

# ---------------------------------------------------------------------------
# 1. n8n volume backup
# ---------------------------------------------------------------------------
echo "[$(date)] Stopping n8n container..."
docker stop n8n

echo "[$(date)] Creating n8n volume snapshot..."
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v n8n_data:/source:ro \
  -v /tmp:/backup \
  alpine tar czf "/backup/n8n-backup-${TIMESTAMP}.tar.gz" -C /source .

echo "[$(date)] Restarting n8n container..."
docker start n8n

echo "[$(date)] Uploading n8n backup to s3://${BUCKET}/${S3_KEY}..."
aws s3 cp "${BACKUP_FILE}" "s3://${BUCKET}/${S3_KEY}" --region us-east-1

echo "[$(date)] Cleaning up n8n backup file..."
rm -f "${BACKUP_FILE}"

# ---------------------------------------------------------------------------
# 2. PostgreSQL database dump
# ---------------------------------------------------------------------------
echo "[$(date)] Dumping PostgreSQL database..."
docker exec stpetemusic-postgres \
  bash -c "PGPASSWORD=\"${POSTGRES_PASSWORD}\" pg_dump -U \"${POSTGRES_USER}\" stpetemusic" \
  | gzip > "${DB_DUMP_FILE}"

echo "[$(date)] Uploading database dump to s3://${BUCKET}/${DB_S3_KEY}..."
aws s3 cp "${DB_DUMP_FILE}" "s3://${BUCKET}/${DB_S3_KEY}" --region us-east-1

echo "[$(date)] Cleaning up database dump file..."
rm -f "${DB_DUMP_FILE}"

# ---------------------------------------------------------------------------
echo "[$(date)] Backup complete."
echo "[$(date)]   n8n volume: s3://${BUCKET}/${S3_KEY}"
echo "[$(date)]   postgres:   s3://${BUCKET}/${DB_S3_KEY}"
