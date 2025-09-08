#!/bin/bash

# Render deployment script for Rasa
echo "🚀 Starting Rasa deployment on Render..."

# Set default port if not provided
export PORT=${PORT:-5005}
export ACTIONS_PORT=${ACTIONS_PORT:-5055}

# Set action endpoint URL for cross-service communication
if [ -n "$ACTIONS_SERVICE_URL" ]; then
    export ACTION_ENDPOINT_URL="$ACTIONS_SERVICE_URL/webhook"
else
    export ACTION_ENDPOINT_URL="http://localhost:$ACTIONS_PORT/webhook"
fi

echo "📡 Starting Rasa server on port $PORT"
echo "🔗 Action endpoint: $ACTION_ENDPOINT_URL"

# Ensure the actions.py file exists and has proper imports
if [ -f "actions/actions.py" ]; then
    echo "✅ Actions file found"
else
    echo "⚠️  Actions file not found in actions/ directory"
fi

# Start Rasa server
exec python -m rasa run \
    --enable-api \
    --cors "*" \
    --port $PORT \
    --credentials credentials.yml \
    --endpoints endpoints.yml \
    --debug
