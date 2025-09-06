#!/bin/bash

echo "Starting Rasa server..."

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
    $RASA_CMD train
else
    echo "Cleaning up old models to save memory..."
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
$RASA_CMD run --enable-api --cors "*" --port $PORT --host 0.0.0.0
