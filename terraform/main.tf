terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "watislaf"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# VPC
resource "aws_vpc" "chess_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "chess_igw" {
  vpc_id = aws_vpc.chess_vpc.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

# Public Subnet
resource "aws_subnet" "chess_public_subnet" {
  vpc_id                  = aws_vpc.chess_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet"
    Environment = var.environment
  }
}

# Second Public Subnet (required for ALB)
resource "aws_subnet" "chess_public_subnet_2" {
  vpc_id                  = aws_vpc.chess_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-2"
    Environment = var.environment
  }
}

# Route Table
resource "aws_route_table" "chess_public_rt" {
  vpc_id = aws_vpc.chess_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.chess_igw.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
  }
}

# Route Table Association
resource "aws_route_table_association" "chess_public_rta" {
  subnet_id      = aws_subnet.chess_public_subnet.id
  route_table_id = aws_route_table.chess_public_rt.id
}

# Route Table Association for second subnet
resource "aws_route_table_association" "chess_public_rta_2" {
  subnet_id      = aws_subnet.chess_public_subnet_2.id
  route_table_id = aws_route_table.chess_public_rt.id
}

# Security Group for ALB
resource "aws_security_group" "chess_alb_sg" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.chess_vpc.id

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-alb-sg"
    Environment = var.environment
  }
}

# Security Group for EC2 Instance
resource "aws_security_group" "chess_server_sg" {
  name_prefix = "${var.project_name}-server-"
  vpc_id      = aws_vpc.chess_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # Chess application port (only from ALB)
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.chess_alb_sg.id]
    description     = "Chess application from ALB"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-server-sg"
    Environment = var.environment
  }
}

# IAM Role for EC2
resource "aws_iam_role" "chess_server_role" {
  name = "${var.project_name}-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-server-role"
    Environment = var.environment
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "chess_server_profile" {
  name = "${var.project_name}-server-profile"
  role = aws_iam_role.chess_server_role.name
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "chess_dynamodb_policy" {
  name        = "${var.project_name}-dynamodb-policy"
  description = "IAM policy for DynamoDB access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.chess_players.arn,
          aws_dynamodb_table.chess_games.arn,
          aws_dynamodb_table.chess_matchmaking.arn,
          "${aws_dynamodb_table.chess_players.arn}/*",
          "${aws_dynamodb_table.chess_games.arn}/*",
          "${aws_dynamodb_table.chess_matchmaking.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-dynamodb-policy"
    Environment = var.environment
  }
}

# Attach DynamoDB policy to IAM role
resource "aws_iam_role_policy_attachment" "chess_server_dynamodb_attachment" {
  role       = aws_iam_role.chess_server_role.name
  policy_arn = aws_iam_policy.chess_dynamodb_policy.arn
}

# DynamoDB table for players
resource "aws_dynamodb_table" "chess_players" {
  name           = "${var.project_name}-players"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "username"
    type = "S"
  }

  global_secondary_index {
    name     = "username-index"
    hash_key = "username"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-players"
    Environment = var.environment
  }
}

# DynamoDB table for games
resource "aws_dynamodb_table" "chess_games" {
  name           = "${var.project_name}-games"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name     = "status-createdAt-index"
    hash_key = "status"
    range_key = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.project_name}-games"
    Environment = var.environment
  }
}

# DynamoDB table for matchmaking queue
resource "aws_dynamodb_table" "chess_matchmaking" {
  name           = "${var.project_name}-matchmaking"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "playerId"

  attribute {
    name = "playerId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name     = "timestamp-index"
    hash_key = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.project_name}-matchmaking"
    Environment = var.environment
  }
}

# Key Pair (you can create this manually or import existing)
resource "aws_key_pair" "chess_key" {
  key_name   = "${var.project_name}-key"
  public_key = var.public_key

  tags = {
    Name        = "${var.project_name}-key"
    Environment = var.environment
  }
}

# EC2 Instance
resource "aws_instance" "chess_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type         = var.instance_type
  key_name              = aws_key_pair.chess_key.key_name
  vpc_security_group_ids = [aws_security_group.chess_server_sg.id]
  subnet_id             = aws_subnet.chess_public_subnet.id
  iam_instance_profile  = aws_iam_instance_profile.chess_server_profile.name

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    app_port     = var.app_port
    domain_name  = var.domain_name
    github_repo  = var.github_repo
    github_branch = var.github_branch
    aws_region   = var.aws_region
    dynamodb_players_table = aws_dynamodb_table.chess_players.name
    dynamodb_games_table = aws_dynamodb_table.chess_games.name
    dynamodb_matchmaking_table = aws_dynamodb_table.chess_matchmaking.name
  }))

  tags = {
    Name        = "${var.project_name}-server"
    Environment = var.environment
  }
}

# Elastic IP
resource "aws_eip" "chess_eip" {
  instance = aws_instance.chess_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-eip"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.chess_igw]
}

# Application Load Balancer
resource "aws_lb" "chess_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.chess_alb_sg.id]
  subnets           = [aws_subnet.chess_public_subnet.id, aws_subnet.chess_public_subnet_2.id]

  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

# Target Group for Chess Application
resource "aws_lb_target_group" "chess_tg" {
  name     = "${var.project_name}-tg"
  port     = var.app_port
  protocol = "HTTP"
  vpc_id   = aws_vpc.chess_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 30
    interval            = 60
    path                = "/"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  # Enable sticky sessions for Socket.IO
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = {
    Name        = "${var.project_name}-tg"
    Environment = var.environment
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "chess_tg_attachment" {
  target_group_arn = aws_lb_target_group.chess_tg.arn
  target_id        = aws_instance.chess_server.id
  port             = var.app_port
}

# ALB Listener for HTTP (redirect to HTTPS)
resource "aws_lb_listener" "chess_http_listener" {
  load_balancer_arn = aws_lb.chess_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ALB Listener for HTTPS
resource "aws_lb_listener" "chess_https_listener" {
  count             = var.ssl_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.chess_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.chess_tg.arn
  }
} 