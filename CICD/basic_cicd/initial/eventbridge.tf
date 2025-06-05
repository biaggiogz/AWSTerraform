resource "random_string" "tf_workshop_event_bus" {
  length  = 4
  special = false
  upper   = false
}
resource "aws_cloudwatch_event_bus" "tf_workshop_event_bus" {
  name = "${var.project_prefix}-event_bus-${random_string.tf_workshop_event_bus.result}"
  tags = merge(
    {
      "Name" = "${var.project_prefix}-event_bus-${random_string.tf_workshop_event_bus.result}"
    },
    var.tags,
  )
}

resource "aws_cloudwatch_event_rule" "default_event_bus_to_tf_workshop_event_bus" {
  for_each       = var.codepipeline_pipelines
  name          = "${each.value.name}-default_event_bus_to_${var.project_prefix}-event_bus"
  description   = "Send all defined events (GitHub) from default event bus to TF Workshop event bus."
  role_arn      = aws_iam_role.eventbridge_invoke_tf_workshop_event_bus[0].arn
  force_destroy = var.eventbridge_rules_enable_force_destroy
  event_pattern = jsonencode({
    source = ["aws.codestar-connections"],
    detail-type = [
      "CodeStar Connections Repository State Change"
    ],
    resources = [
      "arn:aws:codestar-connections:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:connection/${each.value.name}",
    ]
    detail = {
      event = [
        "referenceCreated",
        "referenceUpdated"
      ]
      referenceType = [
        "branch"
      ]
      referenceName = [
        "main"
      ]
    }
  })

  tags = merge(
    var.tags,
    {
      "Name" = "${var.project_prefix}-default_event_bus_to_${var.project_prefix}-event_bus"
    },
  )
}

resource "aws_cloudwatch_event_target" "default_event_bus_to_tf_workshop_event_bus" {
  for_each       = var.codepipeline_pipelines
  rule      = aws_cloudwatch_event_rule.default_event_bus_to_tf_workshop_event_bus[each.key].name
  force_destroy = var.eventbridge_rules_enable_force_destroy
  target_id = aws_cloudwatch_event_bus.tf_workshop_event_bus.name
  arn       = aws_cloudwatch_event_bus.tf_workshop_event_bus.arn
  role_arn  = aws_iam_role.eventbridge_invoke_tf_workshop_event_bus[0].arn
}


resource "aws_cloudwatch_event_rule" "invoke_codepipeline" {
  for_each       = var.codepipeline_pipelines
  name           = "invoke${each.value.name}-codepipeline"
  event_bus_name = aws_cloudwatch_event_bus.tf_workshop_event_bus.name
  description    = "Invoke CodePipeline when changes are pushed to GitHub repository."
  role_arn       = aws_iam_role.eventbridge_invoke_codepipeline.arn
  force_destroy  = var.eventbridge_rules_enable_force_destroy
  event_pattern = jsonencode({
    source = ["aws.codestar-connections"],
    detail-type = [
      "CodeStar Connections Repository State Change"
    ],
    resources = [
      "arn:aws:codestar-connections:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:connection/${each.value.name}",
    ]
    detail = {
      event = [
        "referenceCreated",
        "referenceUpdated"
      ]
      referenceType = [
        "branch"
      ]
      referenceName = [
        "main"
      ]
    }
  })

  tags = merge(
    var.tags,
    {
      "Name" = each.value.name
    },
  )
}

resource "aws_cloudwatch_event_target" "module_validation_codepipeline" {
  for_each       = var.codepipeline_pipelines
  force_destroy  = var.eventbridge_rules_enable_force_destroy
  rule           = aws_cloudwatch_event_rule.invoke_codepipeline[each.key].name
  target_id      = aws_codepipeline.codepipeline[each.key].name
  arn            = aws_codepipeline.codepipeline[each.key].arn
  role_arn       = aws_iam_role.eventbridge_invoke_codepipeline.arn
  event_bus_name = aws_cloudwatch_event_bus.tf_workshop_event_bus.name
}