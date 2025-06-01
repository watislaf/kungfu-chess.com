# 🚀 Kung Fu Chess Online - AWS Terraform Deployment

This Terraform configuration deploys your Kung Fu Chess Online application to AWS using EC2.

## 🏗️ Infrastructure Overview

The Terraform configuration creates:

- **VPC** with public subnet and internet gateway
- **EC2 instance** (Ubuntu 22.04) with your chess application
- **Security Groups** allowing HTTP, HTTPS, SSH, and your app port
- **Elastic IP** for static public IP address
- **IAM roles** for EC2 instance permissions
- **Nginx reverse proxy** (optional, if domain provided)
- **PM2 process manager** for application lifecycle

## 📋 Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform installed** (>= 1.0)
3. **SSH key pair** for server access
4. **GitHub repository** with your chess application

## 🚀 Quick Deployment

### 1. Configure AWS Credentials

```bash
aws configure
```

### 2. Generate SSH Key Pair

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/chess-app-key
```

### 3. Clone and Configure

```bash
git clone <your-repo>
cd rapid-chess-online/terraform
```

### 4. Create Configuration File

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# AWS Configuration
aws_region = "us-east-1"

# SSH Access (your public key)
public_key = "ssh-rsa AAAAB3NzaC1yc2E... (content of ~/.ssh/chess-app-key.pub)"

# Application Repository
github_repo   = "https://github.com/watislaf/kungfu-chess.com.git"
github_branch = "main"

# Optional: Custom domain
domain_name = "chess.yourdomain.com"
```

### 5. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy
terraform apply
```

### 6. Access Your Application

After deployment completes:

```bash
# Get the public IP
terraform output application_url

# SSH to server (if needed)
terraform output ssh_connection
```

## 🔧 Configuration Options

### Instance Types

| Instance Type | vCPUs | Memory | Use Case |
|---------------|-------|--------|----------|
| `t3.micro`    | 2     | 1 GB   | Testing  |
| `t3.small`    | 2     | 2 GB   | Light production |
| `t3.medium`   | 2     | 4 GB   | Production |
| `t3.large`    | 2     | 8 GB   | High traffic |

### Security Groups

The configuration opens these ports:
- `22` - SSH access
- `80` - HTTP (Nginx proxy)
- `443` - HTTPS (if SSL configured)
- `3001` - Direct application access

## 🔄 Application Management

### Deploy Updates

SSH to your server and run:

```bash
ssh -i ~/.ssh/chess-app-key ubuntu@<public-ip>
cd /opt/chess-app
sudo -u ubuntu ./deploy.sh
```

### Monitor Application

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs chess-server

# Restart application
pm2 restart chess-server
```

### System Monitoring

```bash
# Check application health
/opt/chess-app/health-check.sh

# View system resources
htop

# Check Nginx status
sudo systemctl status nginx
```

## 🌐 Domain Setup (Optional)

If you have a domain:

1. **Update DNS**: Point your domain to the Elastic IP
2. **Update terraform.tfvars**: Set `domain_name = "your-domain.com"`
3. **Redeploy**: Run `terraform apply`

### SSL Certificate (HTTPS)

For HTTPS with custom domain:

1. **Request certificate** in AWS Certificate Manager
2. **Update terraform.tfvars**: Set `ssl_certificate_arn`
3. **Add ALB** (modify main.tf to include Application Load Balancer)

## 📊 Outputs

After deployment, Terraform provides:

```bash
terraform output
```

- `application_url` - Direct URL to your chess app
- `instance_public_ip` - Server's public IP
- `ssh_connection` - SSH command to access server

## 🧹 Cleanup

To destroy all resources:

```bash
terraform destroy
```

## 🛠️ Troubleshooting

### Common Issues

1. **Connection refused**
   ```bash
   # Check if application is running
   ssh ubuntu@<ip> "pm2 status"
   ```

2. **Build failures**
   ```bash
   # Check deployment logs
   ssh ubuntu@<ip> "tail -f /var/log/deployment.log"
   ```

3. **Memory issues**
   ```bash
   # Upgrade instance type in terraform.tfvars
   instance_type = "t3.medium"
   terraform apply
   ```

### Logs Locations

- **Application logs**: `/var/log/chess-app/`
- **Deployment logs**: `/var/log/deployment.log`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `/var/log/syslog`

## 🔒 Security Best Practices

1. **Restrict SSH access** to your IP in security groups
2. **Use strong SSH keys** and disable password auth
3. **Keep system updated** with regular `apt update && apt upgrade`
4. **Monitor logs** for suspicious activity
5. **Use HTTPS** in production with SSL certificates

## 💰 Cost Estimation

Monthly AWS costs (us-east-1):

| Resource | Cost |
|----------|------|
| t3.small EC2 | ~$15/month |
| EBS Volume (20GB) | ~$2/month |
| Elastic IP | ~$3/month |
| Data Transfer | Variable |

**Total**: ~$20-25/month for light usage

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. SSH to the server and check system logs
4. Verify your GitHub repository is accessible

For application-specific issues, check the main project README. 