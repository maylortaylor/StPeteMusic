#!/bin/bash
# vod-watcher.sh — watches MediaMTX recordings volume for completed .mp4 files,
# uploads to S3, and triggers the n8n processing workflow webhook.
# Runs as vod-watcher.service (systemd) on the EC2 host.
# Uses the EC2 instance role for AWS credentials — no keys needed.

set -uo pipefail

VOD_BUCKET="stpetemusic-vod"
N8N_WEBHOOK_URL="https://n8n.stpetemusic.live/webhook/vod-uploaded"
# Docker named volume path on the host — n8n_ prefix is the compose project name
RECORDINGS_BASE="/var/lib/docker/volumes/n8n_recordings/_data"

echo "[vod-watcher] Starting — watching ${RECORDINGS_BASE} for new recordings"

# inotifywait fires close_write when MediaMTX finishes writing (stream ends)
inotifywait -m -r -e close_write,moved_to "${RECORDINGS_BASE}" \
  --format '%w%f' \
  | grep --line-buffered '\.mp4$' \
  | while read -r FILEPATH; do
      FILENAME=$(basename "${FILEPATH}")
      DATE_PREFIX=$(echo "${FILENAME}" | cut -c1-10)   # e.g. 2026-05-15
      S3_KEY="vods/${DATE_PREFIX}/${FILENAME}"

      echo "[vod-watcher] New recording detected: ${FILENAME}"

      aws s3 cp "${FILEPATH}" "s3://${VOD_BUCKET}/${S3_KEY}" \
        --region us-east-1 \
        --no-progress

      echo "[vod-watcher] Uploaded: s3://${VOD_BUCKET}/${S3_KEY}"

      # Trigger n8n — future workflow will edit, trim, process, and publish to YouTube unlisted
      curl -s -X POST "${N8N_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -H "X-N8N-Webhook-Secret: ${N8N_WEBHOOK_SECRET}" \
        -d "{\"s3_key\": \"${S3_KEY}\", \"filename\": \"${FILENAME}\", \"date\": \"${DATE_PREFIX}\"}" \
        && echo "[vod-watcher] n8n webhook triggered" \
        || echo "[vod-watcher] WARNING: n8n webhook failed — recording is still safely in S3"
  done
