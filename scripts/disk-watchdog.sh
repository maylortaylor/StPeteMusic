#!/bin/bash
# disk-watchdog.sh — backstop that keeps the EC2 root volume from filling with stream recordings.
# Runs as disk-watchdog.service (systemd oneshot, root) on a 10-minute timer.
# Uses the EC2 instance role for AWS credentials — no keys needed.
#
# vod-watcher.service is the primary cleanup (uploads recordings to S3, then deletes them). This is the
# safety net for when it fails: on 2026-07-19 the volume hit 100%, refused RTMP, and 502'd HLS because
# vod-watcher had silently stopped uploading. This script never lets that happen again, and publishes a
# DiskUsedPercent metric so a CloudWatch alarm can page before the disk wedges.

set -uo pipefail

RECORDINGS_BASE="/var/lib/docker/volumes/n8n_recordings/_data"
STALE_HOURS=6            # recordings older than this were already uploaded (or vod-watcher failed) — purge
EMERGENCY_PCT=80         # if disk is still above this, purge finished recordings until below it
SAFE_MIN_AGE_MIN=15      # never delete a recording touched in the last 15 min — it may be an active stream
NAMESPACE="StPeteMusic/Host"
REGION="us-east-1"

disk_pct() { df --output=pcent / | tail -1 | tr -dc '0-9'; }

log() { echo "[disk-watchdog] $*"; }

log "Start — disk at $(disk_pct)% used"

# 1) Routine sweep: delete recordings older than STALE_HOURS. A finished .mp4 still present after 6h means
#    it was already uploaded to S3 (vod-watcher deletes on success) or the upload failed and is now stale.
if [ -d "${RECORDINGS_BASE}" ]; then
  DELETED=$(find "${RECORDINGS_BASE}" -type f -name '*.mp4' -mmin +$((STALE_HOURS * 60)) -print -delete 2>/dev/null | wc -l)
  log "Routine sweep removed ${DELETED} recording(s) older than ${STALE_HOURS}h"
else
  log "WARNING: recordings dir ${RECORDINGS_BASE} not found — skipping sweep"
fi

# 2) Emergency valve: if the disk is still critically full, delete finished recordings oldest-first until
#    under EMERGENCY_PCT. SAFE_MIN_AGE_MIN protects an in-progress recording (mtime keeps updating while a
#    stream is live, so it never qualifies) — better to risk one active stream than corrupt it.
PCT=$(disk_pct)
if [ "${PCT:-0}" -ge "${EMERGENCY_PCT}" ] && [ -d "${RECORDINGS_BASE}" ]; then
  log "Disk at ${PCT}% (>= ${EMERGENCY_PCT}%) — emergency purge of finished recordings, oldest first"
  # oldest-first list of recordings not modified in the last SAFE_MIN_AGE_MIN minutes
  while IFS= read -r FILE; do
    [ -z "${FILE}" ] && continue
    rm -f "${FILE}" && log "Emergency-purged $(basename "${FILE}")"
    [ "$(disk_pct)" -lt "${EMERGENCY_PCT}" ] && break
  done < <(find "${RECORDINGS_BASE}" -type f -name '*.mp4' -mmin +${SAFE_MIN_AGE_MIN} -printf '%T@ %p\n' 2>/dev/null | sort -n | cut -d' ' -f2-)
  log "After emergency purge: disk at $(disk_pct)%"
fi

# 3) Publish the current disk usage as a custom CloudWatch metric so an alarm can fire before 100%.
#    Default EC2 metrics do not include disk usage — this is the only signal available without the agent.
# This instance has MetadataOptions.HttpTokens=required, so IMDSv1 (a bare GET) returns an empty
# body. That silently blanked INSTANCE_ID and skipped every publish, leaving the ec2-disk-high alarm
# with zero datapoints — it sat in ALARM on "missing data treated as breaching" while reporting
# nothing about the actual disk. Always take the IMDSv2 token first.
IMDS_TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 60" --max-time 3 2>/dev/null)
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: ${IMDS_TOKEN}" \
  --max-time 3 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null)
FINAL_PCT=$(disk_pct)
if [ -n "${INSTANCE_ID}" ] && [ -n "${FINAL_PCT}" ]; then
  aws cloudwatch put-metric-data \
    --namespace "${NAMESPACE}" \
    --metric-name DiskUsedPercent \
    --unit Percent \
    --value "${FINAL_PCT}" \
    --dimensions "InstanceId=${INSTANCE_ID}" \
    --region "${REGION}" \
    && log "Published DiskUsedPercent=${FINAL_PCT} for ${INSTANCE_ID}" \
    || log "WARNING: failed to publish CloudWatch metric (check instance-role cloudwatch:PutMetricData)"
else
  log "WARNING: missing instance-id or disk pct — skipping metric publish"
fi

log "Done — disk at $(disk_pct)% used"
