#!/bin/bash

# Kill processes using ports 3000 and 3001
echo "🔍 Checking for processes using ports 3000 and 3001..."

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "🎯 Found processes on port $port: $pids"
        echo "💥 Killing processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "✅ Processes on port $port terminated"
    else
        echo "✨ Port $port is already free"
    fi
}

# Kill processes on both ports
kill_port 3000
kill_port 3001

echo ""
echo "🎮 Port cleanup complete! You can now run:"
echo "   npm run dev"

# Optional: Show what's still running on these ports
echo ""
echo "🔍 Current port usage:"
lsof -i:3000 2>/dev/null || echo "   Port 3000: Free"
lsof -i:3001 2>/dev/null || echo "   Port 3001: Free" 