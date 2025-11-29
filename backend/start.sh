#!/bin/bash

# HealSync Backend Startup Script
# Automatically handles port conflicts

PORT=4000

echo "🚀 Starting HealSync Backend..."

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $PORT is already in use"
    echo "🔧 Killing existing process..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ Port $PORT is now free"
fi

# Start the server
echo "🎯 Starting server on port $PORT..."
node server.js

