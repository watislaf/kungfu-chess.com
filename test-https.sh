#!/bin/bash

echo "🔍 Testing HTTPS setup for kungfu-chess.com"
echo "============================================"

echo ""
echo "1. 📍 DNS Resolution:"
echo "Current IP for kungfu-chess.com:"
nslookup kungfu-chess.com | grep "Address:" | tail -1

echo ""
echo "2. 🌐 HTTP Test (should redirect to HTTPS):"
curl -I http://kungfu-chess.com 2>/dev/null | head -3

echo ""
echo "3. 🔒 HTTPS Test:"
curl -I https://kungfu-chess.com 2>/dev/null | head -3

echo ""
echo "4. 🎯 Application Test:"
echo "Testing if the application loads..."
response=$(curl -s https://kungfu-chess.com | grep "Kung Fu Chess" | wc -l)
if [ "$response" -gt 0 ]; then
    echo "✅ Application is loading correctly!"
else
    echo "❌ Application not loading yet (DNS may still be propagating)"
fi

echo ""
echo "📋 If you see issues:"
echo "- Wait 5-10 minutes and run this script again"
echo "- DNS changes can take time to propagate globally" 