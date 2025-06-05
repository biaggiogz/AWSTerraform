resource "aws_codestarconnections_connection" "codestar_connection" {
  for_each = var.codestar_connections

  name            = each.value.connection_name
  provider_type   = each.value.provider_type

  tags = merge(
    {
      "Name" = each.value.connection_name
    },
    each.value.tags,
    var.tags,
  )
}
