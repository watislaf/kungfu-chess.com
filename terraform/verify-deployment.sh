#!/bin/bash

# Deployment Verification Script for Rapid Chess Online
set -e

echo "🔍 Starting deployment verification..."

# Get the deployment outputs
INSTANCE_IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
INSTANCE_DNS=$(terraform output -raw instance_public_dns 2>/dev/null || echo "")

if [ -z "$INSTANCE_IP" ] || [ -z "$INSTANCE_DNS" ]; then
    echo "❌ Could not get instance details from Terraform outputs"
    echo "Make sure you're in the terraform directory and the deployment is complete"
    exit 1
fi

echo "🌐 Instance IP: $INSTANCE_IP"
echo "🌐 Instance DNS: $INSTANCE_DNS"

# Wait for application to fully start up
echo "⏳ Waiting 3 minutes for application to fully start up..."
echo "🔄 This ensures all services (Node.js, PM2, DynamoDB connections) are ready"
sleep 180

echo "🎯 Starting connectivity tests..."

# Test 1: HTTP connectivity with retries
echo "🧪 Test 1: HTTP connectivity..."
MAX_RETRIES=5
RETRY_COUNT=0
HTTP_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$HTTP_SUCCESS" = false ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 http://$INSTANCE_IP:3001 || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ HTTP server responding correctly (Code: $HTTP_CODE)"
        HTTP_SUCCESS=true
    else
        echo "⚠️  HTTP server not responding (Code: $HTTP_CODE)"
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "   Waiting 30 seconds before retry..."
            sleep 30
        fi
    fi
done

if [ "$HTTP_SUCCESS" = false ]; then
    echo "❌ HTTP server failed to respond after $MAX_RETRIES attempts"
fi

# Test 2: Socket.IO connectivity with retries
echo "🧪 Test 2: Socket.IO connectivity..."
SOCKETIO_SUCCESS=false
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SOCKETIO_SUCCESS" = false ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
    
    SOCKETIO_RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 "http://$INSTANCE_IP:3001/socket.io/?EIO=4&transport=polling" | head -c 10 || echo "")
    
    if [[ "$SOCKETIO_RESPONSE" == *"0{"* ]]; then
        echo "✅ Socket.IO server responding correctly"
        SOCKETIO_SUCCESS=true
    else
        echo "⚠️  Socket.IO server not responding properly"
        echo "   Response: $SOCKETIO_RESPONSE"
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "   Waiting 30 seconds before retry..."
            sleep 30
        fi
    fi
done

if [ "$SOCKETIO_SUCCESS" = false ]; then
    echo "❌ Socket.IO server failed to respond after $MAX_RETRIES attempts"
fi

# Test 3: WebSocket upgrade capability
echo "🧪 Test 3: WebSocket upgrade capability..."
WEBSOCKET_HEADERS=$(curl -s -I "http://$INSTANCE_IP:3001/socket.io/?EIO=4&transport=websocket" | grep -i "upgrade\|connection" || echo "")
if [[ "$WEBSOCKET_HEADERS" == *"upgrade"* ]] || [[ "$WEBSOCKET_HEADERS" == *"websocket"* ]]; then
    echo "✅ WebSocket upgrades supported"
else
    echo "⚠️  WebSocket upgrade headers not found (may still work)"
fi

# Test 4: DynamoDB tables accessibility (if we can SSH)
echo "🧪 Test 4: Application logs check..."
echo "📝 To check application logs manually, SSH to the server and run:"
echo "   ssh -i ~/.ssh/your-key.pem ubuntu@$INSTANCE_IP"
echo "   pm2 logs chess-server"
echo "   sudo tail -f /var/log/chess-app/combined.log"

# Test 5: Security groups check
echo "🧪 Test 5: Port accessibility..."
nc -z -w5 $INSTANCE_IP 22 && echo "✅ SSH port (22) accessible" || echo "❌ SSH port (22) not accessible"
nc -z -w5 $INSTANCE_IP 80 && echo "✅ HTTP port (80) accessible" || echo "❌ HTTP port (80) not accessible" 
nc -z -w5 $INSTANCE_IP 3001 && echo "✅ Application port (3001) accessible" || echo "❌ Application port (3001) not accessible"

# Test 6: Nginx proxy check (if domain is configured)
DOMAIN_NAME=$(terraform output -raw domain_name 2>/dev/null || echo "")
if [ ! -z "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "null" ]; then
    echo "🧪 Test 6: Nginx proxy check..."
    NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$INSTANCE_IP:80 || echo "000")
    if [ "$NGINX_CODE" = "200" ]; then
        echo "✅ Nginx proxy working correctly"
    else
        echo "❌ Nginx proxy not working (Code: $NGINX_CODE)"
    fi
else
    echo "ℹ️  No domain configured - skipping Nginx test"
fi

echo ""
echo "🎯 Deployment URLs:"
echo "   Direct: http://$INSTANCE_IP:3001"
echo "   Public: http://$INSTANCE_DNS:3001"
if [ ! -z "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "null" ]; then
    echo "   Domain: http://$DOMAIN_NAME"
fi

echo ""
echo "📋 Next steps:"
echo "1. Open the application URL in your browser"
echo "2. Test user registration and login"
echo "3. Test game creation and WebSocket connectivity"
echo "4. Check persistent login by refreshing the page"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Check logs: ssh -i ~/.ssh/your-key.pem ubuntu@$INSTANCE_IP 'pm2 logs chess-server'"
echo "   - Restart app: ssh -i ~/.ssh/your-key.pem ubuntu@$INSTANCE_IP 'pm2 restart chess-server'"
echo "   - Check DynamoDB: aws dynamodb list-tables --region $(terraform output -raw aws_region)"
echo ""
echo "✅ Verification complete!" 