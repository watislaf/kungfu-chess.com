variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "rapid-chess-online"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "app_port" {
  description = "Port where the chess application runs"
  type        = number
  default     = 3001
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "public_key" {
  description = "Public key for SSH access"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/watislaf/kungfu-chess.com.git"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS (optional)"
  type        = string
  default     = ""
} 