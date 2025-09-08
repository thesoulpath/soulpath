#!/bin/bash

# Rasa Actions Server Startup Script
# This script starts the Rasa actions server for package fetching

echo "🚀 Starting Rasa Actions Server..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed or not in PATH"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed or not in PATH"
    exit 1
fi

# Navigate to the actions directory
cd "$(dirname "$0")"

# Install requirements if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

# Set environment variables
export RASA_ACTIONS_PORT=5055
export RASA_ACTIONS_HOST=0.0.0.0

# Start the actions server
echo "🎯 Starting Rasa Actions Server on port $RASA_ACTIONS_PORT..."
python -m rasa_sdk --actions actions --port $RASA_ACTIONS_PORT --host $RASA_ACTIONS_HOST
