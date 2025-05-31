#!/bin/bash

# Simplified AWS Deployment Script for Rapid Chess Online
# This script deploys both the Next.js static site and WebSocket services to AWS

set -e  # Exit on any error

# Configuration - Default to production
STAGE=${1:-prod}
REGION=${2:-us-east-1}
DOMAIN=${3:-""}

echo "🚀 Starting simplified deployment to AWS..."
echo "Stage: $STAGE"
echo "Region: $REGION"
if [ ! -z "$DOMAIN" ]; then
    echo "Domain: $DOMAIN"
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy WebSocket service first
echo "🌐 Deploying WebSocket service..."
serverless deploy -c serverless-websocket.yml --stage $STAGE --region $REGION

# Get WebSocket URL
echo "📡 Getting WebSocket URL..."
WEBSOCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name rapid-chess-websocket-$STAGE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebSocketURI`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$WEBSOCKET_URL" ]; then
    echo "WebSocket URL: $WEBSOCKET_URL"
    
    # Create .env.production for Next.js
    echo "⚙️ Creating production environment variables..."
    cat > .env.production << EOF
NEXT_PUBLIC_WEBSOCKET_URL=$WEBSOCKET_URL
# Socket.IO server URL - you need to deploy the Node.js server separately
# NEXT_PUBLIC_SOCKETIO_URL=https://your-socketio-server.herokuapp.com
NODE_ENV=production
EOF
fi

# Build Next.js static export
echo "🔨 Building Next.js static export..."
npm run build

# Deploy static site
echo "🚀 Deploying static site..."
if [ ! -z "$DOMAIN" ]; then
    serverless deploy --stage $STAGE --region $REGION --domain $DOMAIN
else
    serverless deploy --stage $STAGE --region $REGION
fi

# Sync static files to S3
echo "📤 Syncing static files to S3..."
serverless s3sync --stage $STAGE --region $REGION

# Get CloudFront URL
echo "🌐 Getting application URLs..."
STATIC_URL=$(aws cloudformation describe-stacks \
    --stack-name rapid-chess-online-$STAGE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text 2>/dev/null || echo "Not available")

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Static Site: $STATIC_URL"
if [ ! -z "$WEBSOCKET_URL" ]; then
    echo "   WebSocket:   $WEBSOCKET_URL"
fi
echo ""
echo "🎮 Your chess game is now live on AWS!"
echo ""
echo "📊 AWS Resources created:"
echo "   - CloudFront Distribution"
echo "   - S3 Bucket for static files"
echo "   - Lambda Functions (WebSocket)"
echo "   - API Gateway (WebSocket)"
echo ""
echo "💡 To update the application:"
echo "   ./deploy.sh $STAGE $REGION"
echo ""
echo "🧹 To clean up resources:"
echo "   ./destroy.sh $STAGE $REGION" 