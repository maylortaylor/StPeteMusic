output "rtmp_ingest_url" {
  description = "RTMP URL to enter as Restream custom destination server"
  value       = "rtmp://stream.stpetemusic.live/live"
}

output "hls_playback_url" {
  description = "Public HLS manifest URL for the live stream (embed this on the website)"
  value       = "https://hls.stpetemusic.live/live/index.m3u8"
}

output "cloudfront_hls_domain" {
  description = "CloudFront distribution domain name for the HLS stream"
  value       = aws_cloudfront_distribution.hls_stream.domain_name
}

output "alerts_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms — subscribe additional emails via AWS console"
  value       = aws_sns_topic.alerts.arn
}

