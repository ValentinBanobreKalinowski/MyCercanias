output "site_url" {
  value = "https://${var.domain_name}"
}

output "api_url" {
  value = "https://${var.domain_name}/api/items"
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "site_bucket" {
  value = aws_s3_bucket.site.id
}

output "dynamodb_table" {
  value = aws_dynamodb_table.data.name
}
