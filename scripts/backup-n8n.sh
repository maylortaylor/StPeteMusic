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

echo "[$(date)] Starting n8n backup..."

# Stop n8n to ensure a consistent snapshot, then restart immediately
# If you prefer a live backup (slightly less consistent), remove the stop/start lines
echo "[$(date)] Stopping n8n container..."
docker stop n8n

echo "[$(date)] Creating volume snapshot..."
docker run --rm \
  -v n8n_data:/source:ro \
  -v /tmp:/backup \
  alpine tar czf "/backup/n8n-backup-${TIMESTAMP}.tar.gz" -C /source .

echo "[$(date)] Restarting n8n container..."
docker start n8n

echo "[$(date)] Uploading ${BACKUP_FILE} to s3://${BUCKET}/${S3_KEY}..."
aws s3 cp "${BACKUP_FILE}" "s3://${BUCKET}/${S3_KEY}" --region us-east-1

echo "[$(date)] Cleaning up local file..."
rm -f "${BACKUP_FILE}"

echo "[$(date)] Backup complete: s3://${BUCKET}/${S3_KEY}"
