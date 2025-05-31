#!/bin/bash

# Simplified AWS Cleanup Script for Rapid Chess Online
# This script removes all AWS resources created for the application

set -e  # Exit on any error

# Configuration - Default to production
STAGE=${1:-prod}
REGION=${2:-us-east-1}

echo "🧹 Starting cleanup of AWS resources..."
echo "Stage: $STAGE"
echo "Region: $REGION"

# Confirmation prompt
read -p "⚠️  This will permanently delete all resources for stage '$STAGE'. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Function to safely remove stack
remove_stack() {
    local stack_name=$1
    local config_file=$2
    
    echo "🗑️  Removing stack: $stack_name"
    
    if aws cloudformation describe-stacks --stack-name $stack_name --region $REGION > /dev/null 2>&1; then
        if [ ! -z "$config_file" ]; then
            serverless remove -c $config_file --stage $STAGE --region $REGION
        else
            serverless remove --stage $STAGE --region $REGION
        fi
        echo "✅ Stack $stack_name removed"
    else
        echo "ℹ️  Stack $stack_name not found or already removed"
    fi
}

# Remove Next.js application stack
echo "🗑️  Removing Next.js application..."
remove_stack "rapid-chess-online-$STAGE" ""

# Remove WebSocket service stack  
echo "🗑️  Removing WebSocket service..."
remove_stack "rapid-chess-websocket-$STAGE" "serverless-websocket.yml"

# Clean up any remaining S3 buckets (force delete with contents)
echo "🗑️  Cleaning up S3 buckets..."
aws s3api list-buckets --region $REGION --query "Buckets[?contains(Name, 'rapid-chess-online-$STAGE') || contains(Name, 'rapid-chess-websocket-$STAGE')].[Name]" --output text 2>/dev/null | while read bucket; do
    if [ ! -z "$bucket" ]; then
        echo "🗑️  Emptying and deleting bucket: $bucket"
        aws s3 rm s3://$bucket --recursive --region $REGION 2>/dev/null || true
        aws s3api delete-bucket --bucket $bucket --region $REGION 2>/dev/null || true
    fi
done

# Clean up local files
echo "🧹 Cleaning up local files..."
rm -f .env.production
rm -rf .serverless/

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "🧹 All AWS resources for stage '$STAGE' have been removed:"
echo "   - CloudFront Distributions"
echo "   - Lambda Functions"
echo "   - API Gateways"
echo "   - S3 Buckets"
echo "   - IAM Roles (automatically managed)"
echo ""
echo "💰 This should stop all billing for these resources."
echo ""
echo "🔄 To redeploy:"
echo "   ./deploy.sh $STAGE $REGION" 