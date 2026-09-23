# ─────────────────────────────────────────────────────────────────────────────
# FREE-TIER ALARM CEILING — keep total CloudWatch alarms ≤ 10
#
# AWS Free Tier includes 10 alarms/month free (account-wide, all regions). Each alarm beyond 10 costs
# $0.10/month (us-east-1, standard resolution). We deliberately stay within the free tier.
#
# Current managed alarms = 2 (headroom: 8):
#   1. cloudfront_5xx         2. rtmp_health
#
# ec2_cpu, ec2_status_check and ec2_disk_high retired with the old EC2 box
# (roboborealis-platform#400) — nothing left to alarm on. rtmp_health stays: it watches the
# Route53 health check, which now monitors the roboBOREALIS services box, not the old EC2.
# rds_storage_low and rds_cpu were already removed with the RDS instance (#364).
#
# Rule: before adding an 11th alarm, retire a lower-value one or consolidate.
# When you add/remove an alarm, update the census list above so the count stays auditable in one place.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
  tags = { Project = var.project }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudFront metrics require Region = "Global" dimension even in us-east-1
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  alarm_name        = "${var.project}-cloudfront-5xx-high"
  alarm_description = "HLS CDN 5xx error rate > 5% — MediaMTX or nginx origin issue"
  namespace         = "AWS/CloudFront"
  metric_name       = "5xxErrorRate"
  dimensions = {
    DistributionId = aws_cloudfront_distribution.hls_stream.id
    Region         = "Global"
  }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  tags                = { Project = var.project }
}

# Wires the existing Route53 TCP:1935 health check to SNS (was marked TODO in streaming.tf)
# HealthCheckStatus = 1 (healthy) or 0 (unhealthy); fires when status drops to 0 for 3 min
resource "aws_cloudwatch_metric_alarm" "rtmp_health" {
  alarm_name          = "${var.project}-rtmp-unhealthy"
  alarm_description   = "Route53 TCP:1935 health check failing — RTMP ingest may be down"
  namespace           = "AWS/Route53"
  metric_name         = "HealthCheckStatus"
  dimensions          = { HealthCheckId = aws_route53_health_check.rtmp.id }
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  tags                = { Project = var.project }
}
