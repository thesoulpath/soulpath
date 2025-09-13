#!/bin/bash

# Optimized Rasa server startup script for Docker deployment
set -e

echo "🚀 Starting Rasa server - Docker optimized version $(date)..."

# Get port from environment variable (Render requirement)
PORT=${PORT:-5005}
echo "📡 Using port: $PORT"

# Find Rasa executable
RASA_CMD=$(which rasa)
if [ -z "$RASA_CMD" ]; then
    RASA_CMD="/usr/local/bin/rasa"
fi

echo "🔧 Using Rasa command: $RASA_CMD"

# Check if Rasa is executable
if [ ! -x "$RASA_CMD" ]; then
    echo "❌ Rasa not found or not executable at $RASA_CMD"
    echo "📦 Available Python packages:"
    pip list | grep rasa || echo "No rasa packages found"
    echo "🐍 Python path: $(which python)"
    echo "📦 Pip path: $(which pip)"
    exit 1
fi

# Set memory optimization environment variables
export TF_CPP_MIN_LOG_LEVEL=2
export TF_FORCE_GPU_ALLOW_GROWTH=true
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1

# Create necessary directories
mkdir -p models logs

# Check if models exist
if [ ! -d "models" ] || [ -z "$(ls -A models/*.tar.gz 2>/dev/null)" ]; then
    echo "🤖 No trained models found, training Rasa model..."
    echo "⚠️ Warning: Training may take several minutes..."
    
    # Train with timeout to prevent hanging
    timeout 1800 $RASA_CMD train --force || {
        echo "⚠️ Training timed out or failed. Starting server without training..."
        echo "📝 Note: You may need to train the model locally and include it in the deployment."
    }
else
    echo "✅ Found existing models, cleaning up old ones to save memory..."
    # Keep only the latest 2 models
    ls -t models/*.tar.gz 2>/dev/null | tail -n +3 | xargs rm -f 2>/dev/null || true
fi

# Verify port is set
if [ -z "$PORT" ]; then
    echo "❌ ERROR: PORT environment variable not set"
    exit 1
fi

echo "🌐 Starting Rasa server on port $PORT with memory optimizations..."
echo "🔧 RASA_CMD: $RASA_CMD"
echo "🔧 PORT: $PORT"
echo "🔧 Environment: ${ENVIRONMENT:-production}"

# Start Rasa server with proper error handling
echo "🚀 Starting Rasa server..."
exec "$RASA_CMD" run \
    --enable-api \
    --cors "*" \
    --port "$PORT" \
    --host 0.0.0.0 \
    --credentials credentials.yml \
    --endpoints endpoints.yml \
    --domain domain.yml \
    --debug
