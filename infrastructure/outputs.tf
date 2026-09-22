output "elastic_ip" {
  description = "Public Elastic IP address of the n8n EC2 instance"
  value       = aws_eip.n8n.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.n8n.id
}

output "n8n_url" {
  description = "Public URL for n8n"
  value       = "https://n8n.stpetemusic.live"
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.n8n.id
}

output "backup_bucket" {
  description = "S3 bucket name for n8n backups"
  value       = aws_s3_bucket.n8n_backups.id
}










output "linktree_api_url" {
  description = "Base URL for the Linktree API — use this in WordPress and Next.js fetch calls"
  value       = aws_apigatewayv2_api.linktree.api_endpoint
}

output "linktree_api_all_profiles" {
  description = "Full URL to fetch all Linktree profiles"
  value       = "${aws_apigatewayv2_api.linktree.api_endpoint}/linktree"
}

output "linktree_api_stpetemusic" {
  description = "Full URL to fetch the stpetemusic profile"
  value       = "${aws_apigatewayv2_api.linktree.api_endpoint}/linktree/stpetemusic"
}

output "linktree_api_suite_e_studios" {
  description = "Full URL to fetch the suite_e_studios profile"
  value       = "${aws_apigatewayv2_api.linktree.api_endpoint}/linktree/suite_e_studios"
}

output "vod_bucket" {
  description = "S3 bucket name for VOD recordings (private; EC2 uploads here after each stream)"
  value       = aws_s3_bucket.vod.id
}

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

output "assets_cdn_distribution_id" {
  description = "CloudFront distribution ID for cdn.stpetemusic.live — add as CDN_DISTRIBUTION_ID GitHub Actions variable"
  value       = aws_cloudfront_distribution.assets.id
}
