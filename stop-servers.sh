#!/bin/bash

echo "🛑 Stopping HostTrack Servers..."

# Kill all Node.js processes
echo "🔄 Stopping Node.js processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Kill processes on specific ports
echo "🔄 Clearing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 2

echo "✅ All servers stopped successfully!"
echo "💡 To restart servers, run: ./start-servers.sh" 