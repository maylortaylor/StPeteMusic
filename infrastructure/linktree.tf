# Linktree Scraper API
#
# Architecture:
#   EventBridge (hourly) → scraper Lambda → DynamoDB
#   HTTP API Gateway → api Lambda → DynamoDB
#
# Cost: ~$0/month at this traffic level (all within AWS free tier)

# ─────────────────────────────────────────────
# DynamoDB — stores scraped Linktree data
# ─────────────────────────────────────────────

resource "aws_dynamodb_table" "linktree_data" {
  name         = "linktree_data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "profile"

  attribute {
    name = "profile"
    type = "S"
  }

  # TTL safety net — items expire after 48h if scraper stops running
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name    = "linktree_data"
    Project = var.project
  }
}

# ─────────────────────────────────────────────
# IAM — Lambda execution role
# ─────────────────────────────────────────────

resource "aws_iam_role" "linktree_lambda" {
  name = "linktree_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = {
    Name    = "linktree_lambda_role"
    Project = var.project
  }
}

resource "aws_iam_role_policy_attachment" "linktree_lambda_logs" {
  role       = aws_iam_role.linktree_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "linktree_dynamo" {
  name = "linktree_dynamo_access"
  role = aws_iam_role.linktree_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
      ]
      Resource = aws_dynamodb_table.linktree_data.arn
    }]
  })
}

# ─────────────────────────────────────────────
# Lambda ZIP packages (bundled from repo source)
# ─────────────────────────────────────────────

data "archive_file" "scraper_zip" {
  type        = "zip"
  source_file = "${path.module}/../services/linktree-api/scraper/index.mjs"
  output_path = "${path.module}/.terraform/lambda-zips/scraper.zip"
}

data "archive_file" "api_zip" {
  type        = "zip"
  source_file = "${path.module}/../services/linktree-api/api/index.mjs"
  output_path = "${path.module}/.terraform/lambda-zips/api.zip"
}

# ─────────────────────────────────────────────
# Lambda — scraper (writes to DynamoDB)
# ─────────────────────────────────────────────

resource "aws_lambda_function" "linktree_scraper" {
  function_name = "linktree_scraper"
  role          = aws_iam_role.linktree_lambda.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  timeout       = 30  # Linktree fetches can be slow; 30s is generous

  filename         = data.archive_file.scraper_zip.output_path
  source_code_hash = data.archive_file.scraper_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME         = aws_dynamodb_table.linktree_data.name
      LINKTREE_PROFILES  = jsonencode(["stpetemusic", "suite_e_studios"])
    }
  }

  tags = {
    Name    = "linktree_scraper"
    Project = var.project
  }
}

# ─────────────────────────────────────────────
# Lambda — API (reads from DynamoDB)
# ─────────────────────────────────────────────

resource "aws_lambda_function" "linktree_api" {
  function_name = "linktree_api"
  role          = aws_iam_role.linktree_lambda.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  timeout       = 10

  filename         = data.archive_file.api_zip.output_path
  source_code_hash = data.archive_file.api_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.linktree_data.name
    }
  }

  tags = {
    Name    = "linktree_api"
    Project = var.project
  }
}

# ─────────────────────────────────────────────
# EventBridge — trigger scraper every hour
# ─────────────────────────────────────────────

resource "aws_cloudwatch_event_rule" "linktree_hourly" {
  name                = "linktree_scraper_hourly"
  description         = "Trigger Linktree scraper every hour"
  schedule_expression = "rate(1 hour)"

  tags = {
    Name    = "linktree_scraper_hourly"
    Project = var.project
  }
}

resource "aws_cloudwatch_event_target" "linktree_scraper" {
  rule      = aws_cloudwatch_event_rule.linktree_hourly.name
  target_id = "linktree_scraper"
  arn       = aws_lambda_function.linktree_scraper.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.linktree_scraper.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.linktree_hourly.arn
}

# ─────────────────────────────────────────────
# HTTP API Gateway — public REST API
# ─────────────────────────────────────────────

resource "aws_apigatewayv2_api" "linktree" {
  name          = "linktree-api"
  protocol_type = "HTTP"
  description   = "Public API serving scraped Linktree profile data"

  cors_configuration {
    allow_origins = [
      "https://www.suiteestudios.com",
      "https://suiteestudios.com",
      "https://www.stpetemusic.live",
      "https://stpetemusic.live",
    ]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 3600
  }

  tags = {
    Name    = "linktree-api"
    Project = var.project
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.linktree.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "linktree_api" {
  api_id                 = aws_apigatewayv2_api.linktree.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.linktree_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_all" {
  api_id    = aws_apigatewayv2_api.linktree.id
  route_key = "GET /linktree"
  target    = "integrations/${aws_apigatewayv2_integration.linktree_api.id}"
}

resource "aws_apigatewayv2_route" "get_one" {
  api_id    = aws_apigatewayv2_api.linktree.id
  route_key = "GET /linktree/{profile}"
  target    = "integrations/${aws_apigatewayv2_integration.linktree_api.id}"
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.linktree_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.linktree.execution_arn}/*/*"
}
