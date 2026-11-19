variable "project" {
  type    = string
  default = "mymadrid"
}

variable "region" {
  type    = string
  default = "eu-south-2"
}

variable "domain_name" {
  type    = string
  default = "valentin-cloud.com"
}

# app lives on <subdomain>.<domain_name>, apex and www redirect there
variable "subdomain" {
  type    = string
  default = "mi-cercanias"
}

variable "fetch_schedule" {
  type    = string
  default = "rate(1 minute)"
}

variable "fetch_interval_seconds" {
  type    = number
  default = 30
}

variable "frontend_dist_dir" {
  type    = string
  default = "../frontend/dist"
}

variable "log_retention_days" {
  type    = number
  default = 14
}
