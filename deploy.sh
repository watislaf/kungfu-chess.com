#!/bin/bash

# Chess Application Deployment Script
set -e

echo "🚀 Starting Chess Application Deployment"

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }

# Function to deploy code to remote server
deploy_code_to_server() {
    echo "📡 Deploying updated code to remote server..."
    
    # Get the server IP from Terraform output
    cd terraform
    SERVER_IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
    cd ..
    
    if [ -z "$SERVER_IP" ]; then
        echo "❌ Could not get server IP from Terraform. Skipping code deployment."
        return 1
    fi
    
    echo "🎯 Deploying to server: $SERVER_IP"
    
    # Create update package
    echo "📦 Creating update package..."
    tar -czf update.tar.gz out/ dist/
    
    # Upload and deploy
    echo "⬆️  Uploading files..."
    scp -o StrictHostKeyChecking=no update.tar.gz ubuntu@$SERVER_IP:/tmp/
    
    echo "🔄 Extracting and restarting service..."
    ssh -o StrictHostKeyChecking=no ubuntu@$SERVER_IP '
        cd /opt/chess-app &&
        sudo tar -xzf /tmp/update.tar.gz &&
        sudo chown -R ubuntu:ubuntu . &&
        pm2 restart chess-app &&
        echo "✅ Code deployment completed successfully!"
    '
    
    # Cleanup
    rm -f update.tar.gz
    echo "🧹 Cleanup completed"
}

# Build the application
echo "📦 Building application..."
npm run build

# Navigate to terraform directory
cd terraform

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "❌ terraform.tfvars file not found. Please create it from terraform.tfvars.example"
    exit 1
fi

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# Plan the deployment
echo "📋 Planning deployment..."
terraform plan

# Apply the deployment automatically (no user confirmation required)
echo "🚀 Deploying to AWS..."
terraform apply -auto-approve

# Get outputs
echo "📊 Deployment completed! Here are the details:"
terraform output

echo "✅ Chess application infrastructure deployed successfully!"

# Go back to project root
cd ..

# Deploy code to the server
deploy_code_to_server

echo ""
echo "🌐 You can access your application at the URL shown above."
echo "🔧 Application code has been automatically deployed to the server." 