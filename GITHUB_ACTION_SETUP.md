# 🚀 GitHub Actions Auto-Deployment Setup

This guide explains how to configure GitHub Actions for automatic deployment of Kung Fu Chess Online to AWS when pushing to the `main` branch.

## 📋 Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### 🔐 AWS Credentials
- **`AWS_ACCESS_KEY_ID`**: Your AWS access key ID
- **`AWS_SECRET_ACCESS_KEY`**: Your AWS secret access key

### 🗝️ SSH Configuration
- **`SSH_PRIVATE_KEY`**: Your private SSH key content (for server access)
- **`TF_VAR_PUBLIC_KEY`**: Your public SSH key content (for Terraform)

### 🏗️ Terraform Variables
- **`TF_VAR_PROJECT_NAME`** (optional): Project name (default: "rapid-chess-online")
- **`TF_VAR_ENVIRONMENT`** (optional): Environment (default: "production")
- **`TF_VAR_INSTANCE_TYPE`** (optional): EC2 instance type (default: "t3.micro")
- **`TF_VAR_APP_PORT`** (optional): Application port (default: "3001")
- **`TF_VAR_DOMAIN_NAME`** (optional): Your domain name
- **`TF_VAR_SSL_CERTIFICATE_ARN`** (optional): AWS SSL certificate ARN

## 🔧 Setup Instructions

### 1. Generate SSH Key Pair
```bash
# Generate a new SSH key pair for deployment
ssh-keygen -t rsa -b 4096 -f ~/.ssh/chess_deployment_key -N ""

# Copy the private key content
cat ~/.ssh/chess_deployment_key
# Copy this content to GitHub secret: SSH_PRIVATE_KEY

# Copy the public key content  
cat ~/.ssh/chess_deployment_key.pub
# Copy this content to GitHub secret: TF_VAR_PUBLIC_KEY
```

### 2. Configure AWS Credentials
```bash
# Get your AWS credentials
aws configure list
# Use these credentials for GitHub secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

### 3. Set Up SSL Certificate (Optional)
If you have a domain and SSL certificate:
```bash
# Get your SSL certificate ARN from AWS Certificate Manager
aws acm list-certificates --region us-east-1
# Copy the CertificateArn to GitHub secret: TF_VAR_SSL_CERTIFICATE_ARN
```

## 🎯 Workflow Behavior

### Automatic Triggers
- **Push to `main` branch**: Automatically deploys the application
- **Manual trigger**: Use "Run workflow" button in GitHub Actions tab

### Deployment Process
1. **Build**: Compiles the application and server code
2. **Infrastructure**: Deploys/updates AWS infrastructure with Terraform
3. **Code Deployment**: Uploads code to the server and restarts services
4. **Verification**: Waits 3 minutes, then tests HTTP and Socket.IO connectivity
5. **Summary**: Posts deployment status and URLs to GitHub

### 📊 Deployment Verification

The workflow includes enhanced verification with:
- **3-minute startup wait**: Ensures all services are fully initialized
- **Retry logic**: Up to 5 attempts for connectivity tests
- **Multiple tests**: HTTP, Socket.IO, and WebSocket functionality
- **Detailed logging**: Shows progress and troubleshooting info

## 🔍 Monitoring Deployments

### GitHub Actions Tab
- View deployment progress in real-time
- See detailed logs for each step
- Get deployment summaries with URLs

### Manual Verification
After deployment, you can manually verify:
```bash
# SSH to server (if you have access)
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_SERVER_IP

# Check application status
pm2 status
pm2 logs chess-app

# Test connectivity locally
curl http://YOUR_SERVER_IP:3001
curl http://YOUR_SERVER_IP:3001/socket.io/?EIO=4&transport=polling
```

## 🚨 Troubleshooting

### Common Issues

1. **SSH Permission Denied**
   - Ensure `SSH_PRIVATE_KEY` secret contains the full private key
   - Verify the corresponding public key is in Terraform configuration

2. **AWS Access Denied**
   - Check AWS credentials have sufficient permissions for EC2, DynamoDB, VPC
   - Ensure the region matches your configuration

3. **Terraform State Lock**
   - If deployment fails mid-way, manually unlock: `terraform force-unlock LOCK_ID`

4. **Application Not Starting**
   - Check server logs: `pm2 logs chess-app`
   - Verify environment variables and DynamoDB connectivity

### Security Considerations

- **Use separate AWS credentials** for GitHub Actions (not your personal account)
- **Limit IAM permissions** to only what's needed for deployment
- **Rotate SSH keys** periodically
- **Monitor deployment logs** for sensitive information leaks

## ✅ Verification Checklist

Before enabling auto-deployment:
- [ ] All required secrets are configured in GitHub
- [ ] SSH key pair is generated and configured
- [ ] AWS credentials have proper permissions
- [ ] Terraform configuration is tested manually
- [ ] Domain and SSL certificate are configured (if using)
- [ ] First manual deployment is successful

## 🎮 Ready to Deploy!

Once configured, simply push to the `main` branch:
```bash
git add .
git commit -m "🚀 Deploy Kung Fu Chess Online"
git push origin main
```

Watch the magic happen in the GitHub Actions tab! 🎯 