#!/bin/bash

# Force cache invalidation - this file has been updated
echo "Starting Rasa server - CACHE BUSTING VERSION $(date)..."

# Get port from environment variable (Render requirement)
PORT=${PORT:-5005}
echo "Using port: $PORT"

# Find Rasa executable
RASA_CMD=$(which rasa)
if [ -z "$RASA_CMD" ]; then
    RASA_CMD="/usr/local/bin/rasa"
fi

echo "Using Rasa command: $RASA_CMD"

# Check if Rasa is executable
if [ ! -x "$RASA_CMD" ]; then
    echo "Rasa not found or not executable at $RASA_CMD"
    echo "Available Python packages:"
    pip list | grep rasa
    echo "Python path:"
    which python
    echo "Pip path:"
    which pip
    exit 1
fi

# Check if models exist
if [ ! -d "models" ] || [ -z "$(ls -A models/*.tar.gz 2>/dev/null)" ]; then
    echo "No trained models found, training Rasa model..."
    echo "Warning: Training may take several minutes..."
    # Add timeout to prevent hanging
    timeout 1800 $RASA_CMD train || {
        echo "Training timed out or failed. Starting server without training..."
        echo "Note: You may need to train the model locally and include it in the deployment."
    }
else
    echo "Found existing models, cleaning up old ones to save memory..."
    # Keep only the latest 2 models
    ls -t models/*.tar.gz 2>/dev/null | tail -n +3 | xargs rm -f 2>/dev/null || true
fi

echo "Starting Rasa server on port $PORT with memory optimizations..."

# Set memory optimization environment variables
export TF_CPP_MIN_LOG_LEVEL=2
export TF_FORCE_GPU_ALLOW_GROWTH=true
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1

# Start Rasa with memory optimizations
# Note: --log-level flag removed as it causes argument parsing issues in Rasa 3.6.21
echo "Binding to port $PORT on interface 0.0.0.0"

# Verify port is set
if [ -z "$PORT" ]; then
    echo "ERROR: PORT environment variable not set"
    exit 1
fi

echo "Starting Rasa server..."
# Debug: Show exact command being executed and environment
echo "RASA_CMD: $RASA_CMD"
echo "PORT: $PORT"
echo "Executing: $RASA_CMD run actions --enable-api --cors \"*\" --port $PORT -i 0.0.0.0 --quiet"
echo "Environment WARNING: ${WARNING:-NOT_SET}"
echo "Note: Using Rasa 3.6.21 command structure"

# Ensure clean environment and explicit command execution
echo "Starting Rasa server with actions..."
# Try alternative command structure for Rasa 3.6.21
# Some versions might need different syntax
echo "Trying alternative command structure..."
"$RASA_CMD" run --enable-api --cors "*" --port "$PORT" -i 0.0.0.0 --quiet 2>/dev/null || {
    echo "Primary command failed, trying with explicit actions..."
    "$RASA_CMD" run actions --enable-api --cors "*" --port "$PORT" -i 0.0.0.0 --quiet
}
