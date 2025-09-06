#!/bin/bash

echo "🚀 Starting Rasa with Docker..."

# Clean up any existing containers
docker stop rasa-server 2>/dev/null || true
docker rm rasa-server 2>/dev/null || true

# Start Rasa with Docker
echo "Starting Rasa server on port 5005..."
docker run -d \
  --name rasa-server \
  -p 5005:5005 \
  -v "/Users/albertosaco/Downloads/wellness-monorepo/backend/rasa:/app" \
  rasa/rasa:3.6.20-full \
  run --enable-api --cors "*" --debug

echo "⏳ Waiting for Rasa to start..."
sleep 15

echo "🔍 Checking if Rasa is running..."
if curl -s http://localhost:5005/ > /dev/null; then
    echo "✅ Rasa is running successfully at http://localhost:5005"
    echo "📊 API Status:"
    curl -s http://localhost:5005/ | head -5
else
    echo "❌ Rasa failed to start. Checking logs..."
    docker logs rasa-server | tail -10
fi

echo ""
echo "🎯 To test Rasa:"
echo "curl -X POST http://localhost:5005/webhooks/rest/webhook \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"sender\": \"test\", \"message\": \"Hola\"}'"
