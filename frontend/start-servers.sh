#!/bin/bash

# Exit on any error
set -e

# Function to check if port is available
check_port() {
    local port=$1
    local timeout=30
    local count=0
    
    while [ $count -lt $timeout ]; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "Port $port is available"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    echo "Port $port is not available after $timeout seconds"
    return 1
}

# Start Rasa server in the background
echo "Starting Rasa server..."
cd rasa

# Find the latest model
LATEST_MODEL=$(ls -t models/*.tar.gz | head -1)
echo "Using Rasa model: $LATEST_MODEL"

# Start Rasa server
rasa run --enable-api --cors "*" --port 5005 --model "$LATEST_MODEL" &
RASA_PID=$!

# Wait for Rasa to start
echo "Waiting for Rasa server to start..."
sleep 10

# Check if Rasa is running
if ! kill -0 $RASA_PID 2>/dev/null; then
    echo "Rasa server failed to start"
    exit 1
fi

echo "Rasa server started with PID: $RASA_PID"

# Start Next.js server
echo "Starting Next.js server..."
cd ..

# Build Next.js app
echo "Building Next.js application..."
npm run build

# Start Next.js server
npm start &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 5

# Check if Next.js is running
if ! kill -0 $NEXTJS_PID 2>/dev/null; then
    echo "Next.js server failed to start"
    kill $RASA_PID 2>/dev/null || true
    exit 1
fi

echo "Next.js server started with PID: $NEXTJS_PID"

# Function to handle shutdown
cleanup() {
    echo "Shutting down servers..."
    kill $RASA_PID $NEXTJS_PID 2>/dev/null || true
    wait $RASA_PID $NEXTJS_PID 2>/dev/null || true
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

echo "Both servers are running. Press Ctrl+C to stop."

# Wait for both processes
wait $RASA_PID $NEXTJS_PID
