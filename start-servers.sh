#!/bin/bash

# Sustainable Server Management Script
# This script ensures proper server startup without port conflicts

echo "🚀 Starting HostTrack Servers (Sustainable Mode)"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to kill processes on specific port
kill_port() {
    local port=$1
    echo "🔄 Clearing port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Clear ports if needed
echo "🧹 Checking and clearing ports..."
kill_port 3000
kill_port 3001

# Wait for ports to be fully cleared
sleep 3

# Check port availability
echo "🔍 Checking port availability..."
if ! check_port 3001; then
    echo "❌ Cannot start backend server - port 3001 is busy"
    exit 1
fi

if ! check_port 3000; then
    echo "❌ Cannot start frontend server - port 3000 is busy"
    exit 1
fi

echo "✅ All ports are available"

# Start backend server
echo "🔧 Starting backend server (port 3001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Backend server is running on port 3001"
else
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server (port 3000)..."
cd web
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Frontend server is running on port 3000"
else
    echo "❌ Frontend server failed to start"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 All servers started successfully!"
echo "📊 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "💡 To stop all servers, run: pkill -f 'node server.js'"
echo ""

# Keep script running and handle cleanup on exit
trap 'echo "🛑 Shutting down servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' INT TERM

# Wait for background processes
wait 