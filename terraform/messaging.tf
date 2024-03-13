# -- SQS --
// This is mapped from the Terraform infrastructure defined in the
// podaac/swodlr-api repo
data "aws_sqs_queue" "user_notify" {
  name = "${local.app_prefix}-user-notify-queue"
}

# -- Event Mapping --
resource "aws_lambda_event_source_mapping" "user_notify_lambda" {
  event_source_arn = data.aws_sqs_queue.user_notify.arn
  function_name = aws_lambda_function.main.arn
}
