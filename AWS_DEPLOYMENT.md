# AWS Deployment Guide for Rapid Chess Online

This guide explains how to deploy the Rapid Chess Online application to AWS using serverless architecture.

## 🏗️ Architecture Overview

The application is deployed using a two-tier serverless architecture:

### 1. **Next.js Frontend** (`serverless.yml`)
- **Service**: `rapid-chess-online`
- **Infrastructure**: AWS Lambda + CloudFront + S3
- **Plugin**: `serverless-nextjs-plugin`
- **Purpose**: Serves the React/Next.js chess interface

### 2. **WebSocket Backend** (`serverless-websocket.yml`)
- **Service**: `rapid-chess-websocket` 
- **Infrastructure**: API Gateway WebSocket + Lambda + DynamoDB
- **Purpose**: Handles real-time game communication

### AWS Resources Created:
- **Lambda Functions**: Next.js pages, API routes, WebSocket handlers
- **API Gateway**: WebSocket API for real-time communication
- **CloudFront**: CDN for fast global content delivery
- **DynamoDB**: Game state and connection management
- **S3**: Static asset storage
- **IAM Roles**: Secure access management

## 🚀 Quick Start

### Prerequisites
```bash
# Install AWS CLI
brew install awscli  # macOS
# OR
pip install awscli   # Python

# Configure AWS credentials
aws configure
```

### 1. Deploy to Development
```bash
# Make scripts executable (one-time)
chmod +x deploy.sh destroy.sh

# Deploy to dev stage
./deploy.sh
# OR
npm run deploy
```

### 2. Deploy to Production
```bash
# Deploy to production stage
./deploy.sh prod us-east-1
# OR
npm run deploy:prod
```

## 📋 Detailed Setup Instructions

### Step 1: AWS Account Setup

1. **Create AWS Account**: Sign up at [aws.amazon.com](https://aws.amazon.com)

2. **Create IAM User**:
   ```bash
   # Create user with programmatic access
   aws iam create-user --user-name rapid-chess-deployer
   
   # Attach necessary policies
   aws iam attach-user-policy --user-name rapid-chess-deployer --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
   
   # Create access keys
   aws iam create-access-key --user-name rapid-chess-deployer
   ```

3. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your Access Key ID
   # Enter your Secret Access Key  
   # Default region: us-east-1
   # Default output format: json
   ```

### Step 2: Install Dependencies

```bash
# Install project dependencies
npm install

# Install Serverless Framework globally
npm install -g serverless

# Verify installation
serverless --version
```

### Step 3: Environment Configuration

The deployment automatically creates environment variables. For custom configuration:

```bash
# Check AWS connection
npm run aws:status

# Reconfigure AWS if needed
npm run aws:configure
```

### Step 4: Deploy Application

```bash
# Development deployment
./deploy.sh dev us-east-1

# Staging deployment  
./deploy.sh staging us-east-1

# Production deployment
./deploy.sh prod us-east-1
```

### Step 5: Custom Domain (Optional)

To use a custom domain:

```bash
# Deploy with custom domain
./deploy.sh prod us-east-1 yourdomain.com
```

**Prerequisites for custom domain**:
- Domain registered in Route 53 or external registrar
- SSL certificate in AWS Certificate Manager (us-east-1 region)

## 🔧 Configuration Options

### Environment Variables

The deployment script automatically creates these variables:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=wss://abc123.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_API_URL=https://api-dev.rapidchess.com
NODE_ENV=production
```

### Stage-Based Configuration

| Stage | Purpose | Domain Pattern |
|-------|---------|----------------|
| `dev` | Development testing | `abc123.cloudfront.net` |
| `staging` | Pre-production | `def456.cloudfront.net` |
| `prod` | Production | Custom domain or CloudFront |

### Resource Naming Convention

All AWS resources follow this pattern:
- **Service**: `{service-name}-{stage}`
- **Functions**: `{service-name}-{stage}-{function-name}`
- **Tables**: `{service-name}-{stage}-{table-name}`

Example: `rapid-chess-online-prod-websocketHandler`

## 🎮 Post-Deployment Testing

### 1. Verify Deployment
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name rapid-chess-online-dev

# Test WebSocket connection
aws cloudformation describe-stacks --stack-name rapid-chess-websocket-dev --query 'Stacks[0].Outputs'
```

### 2. Application Health Check
```bash
# Get application URLs from deployment output
# Test Next.js app: https://abc123.cloudfront.net  
# Test WebSocket: wss://def456.execute-api.us-east-1.amazonaws.com/dev
```

### 3. Monitor Logs
```bash
# View Lambda logs
serverless logs -f websocketHandler -t

# CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/rapid-chess"
```

## 💰 Cost Estimation

### AWS Free Tier (First 12 months):
- **Lambda**: 1 million requests/month
- **API Gateway**: 1 million requests/month  
- **DynamoDB**: 25 GB storage + 25 read/write units
- **CloudFront**: 50 GB data transfer

### Estimated Monthly Costs (Production):
- **Lambda**: $0.20-$2.00 (depends on usage)
- **API Gateway**: $0.35-$3.50 (WebSocket connections)
- **DynamoDB**: $0.25-$2.50 (on-demand pricing)
- **CloudFront**: $0.08-$0.85 (data transfer)
- **Total**: ~$1-$10/month for moderate usage

## 🛠️ Troubleshooting

### Common Issues:

1. **Permission Denied**:
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Reconfigure if needed
   aws configure
   ```

2. **Deployment Timeout**:
   ```bash
   # Check CloudFormation events
   aws cloudformation describe-stack-events --stack-name rapid-chess-online-dev
   ```

3. **WebSocket Connection Failed**:
   ```bash
   # Verify WebSocket URL in environment
   cat .env.production
   
   # Check API Gateway WebSocket
   aws apigatewayv2 get-apis
   ```

4. **Build Errors**:
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build:server
   npm run build
   ```

### Debug Commands:
```bash
# View stack outputs
aws cloudformation describe-stacks --stack-name rapid-chess-online-dev --query 'Stacks[0].Outputs'

# Check DynamoDB tables
aws dynamodb list-tables

# View Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `rapid-chess`)]'
```

## 🧹 Cleanup & Maintenance

### Remove All Resources:
```bash
# Remove development environment
./destroy.sh dev us-east-1

# Remove production environment  
./destroy.sh prod us-east-1
```

### Update Application:
```bash
# Make changes to code
# Redeploy (only changed resources will update)
./deploy.sh
```

### Monitor Costs:
```bash
# Check AWS billing
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-02-01 --granularity MONTHLY --metrics BlendedCost
```

## 📝 Additional Notes

### Security Considerations:
- All resources use least-privilege IAM roles
- API Gateway enforces CORS policies
- DynamoDB tables have TTL for automatic cleanup
- CloudFront provides DDoS protection

### Performance Optimization:
- CloudFront caching for static assets
- Lambda function warm-up strategies
- DynamoDB on-demand scaling
- WebSocket connection pooling

### Backup Strategy:
- DynamoDB Point-in-Time Recovery (enable in production)
- S3 versioning for static assets
- CloudFormation templates in version control

## 🆘 Support

For deployment issues:
1. Check this guide's troubleshooting section
2. Review AWS CloudFormation events
3. Check application logs in CloudWatch
4. Verify AWS service limits and quotas

**Happy deploying! 🚀** 