# SSM SecureString parameters — single source of truth for app secrets
#
# roboborealis-platform#400: the two readers this file used to serve, Amplify (via Terraform
# data source) and the old EC2 deploy script (via instance role), are both gone. ~19 params
# that only fed those two were removed here. One exception stays: revalidation_secret needed
# an out-of-band `aws ssm delete-parameter` rather than a plain code removal, since it's the
# parameter behind this repo's long-running ParameterAlreadyExists drift (exists in AWS, not
# correctly tracked in tofu state) — see the PR for the exact command and verify it's gone
# post-apply. The old /stpetemusic/streaming/rtmp_stream_key was removed in #346 (mediamtx reads
# the /roboborealis/services/mediamtx/ copy).

resource "aws_ssm_parameter" "clarity_project_id" {
  count = var.clarity_project_id != "" ? 1 : 0

  name  = "/${var.project}/analytics/clarity_project_id"
  type  = "SecureString"
  value = var.clarity_project_id

  tags = {
    Project = var.project
  }
}
