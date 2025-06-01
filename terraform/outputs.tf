output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.chess_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.chess_eip.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.chess_server.public_dns
}

output "application_url" {
  description = "URL to access the chess application"
  value       = var.ssl_certificate_arn != "" ? "https://${var.domain_name}" : "http://${aws_eip.chess_eip.public_ip}:${var.app_port}"
}

output "ssh_connection" {
  description = "SSH connection command"
  value       = "ssh -i ~/.ssh/your-key.pem ubuntu@${aws_eip.chess_eip.public_ip}"
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.chess_server_sg.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.chess_vpc.id
}

output "subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.chess_public_subnet.id
} 

# DynamoDB outputs
output "dynamodb_players_table_name" {
  description = "Name of the DynamoDB players table"
  value       = aws_dynamodb_table.chess_players.name
}

output "dynamodb_games_table_name" {
  description = "Name of the DynamoDB games table"
  value       = aws_dynamodb_table.chess_games.name
}

output "dynamodb_matchmaking_table_name" {
  description = "Name of the DynamoDB matchmaking table"
  value       = aws_dynamodb_table.chess_matchmaking.name
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.chess_alb.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.chess_alb.zone_id
}

output "https_url" {
  description = "HTTPS URL (when SSL certificate is configured)"
  value       = var.ssl_certificate_arn != "" ? "https://${var.domain_name}" : "Not configured - SSL certificate required"
} 