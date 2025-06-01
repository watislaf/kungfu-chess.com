#!/bin/bash

# Chess Application Destroy Script
set -e

echo "🗑️ Starting Chess Application Cleanup"

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }

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

# Plan the destruction
echo "📋 Planning resource destruction..."
terraform plan -destroy

# Ask for confirmation
echo "⚠️  WARNING: This will destroy ALL AWS resources created by Terraform!"
echo "This includes:"
echo "  - EC2 Instance"
echo "  - DynamoDB Tables (and all data)"
echo "  - VPC and networking components"
echo "  - Security Groups"
echo "  - Elastic IP"
echo ""
read -p "🤔 Are you ABSOLUTELY SURE you want to destroy everything? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Destruction cancelled."
    exit 1
fi

# Destroy the resources
echo "💥 Destroying AWS resources..."
terraform destroy -auto-approve

echo "✅ All resources have been destroyed!"
echo "💰 Your AWS bill should now be reduced."
echo "🔄 To redeploy, run ./deploy.sh" 