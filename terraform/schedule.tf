resource "aws_cloudwatch_event_rule" "fetch" {
  name                = "${var.project}-fetch"
  schedule_expression = var.fetch_schedule
}

resource "aws_cloudwatch_event_target" "fetch" {
  rule = aws_cloudwatch_event_rule.fetch.name
  arn  = aws_lambda_function.this["fetcher"].arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["fetcher"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.fetch.arn
}
