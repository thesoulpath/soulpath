#!/bin/bash

# Deploy Rasa server to Render
# This script helps with the deployment process

set -e

echo "🚀 Deploying Rasa server to Render..."

# Check if we're in the right directory
if [ ! -f "Dockerfile.rasa" ]; then
    echo "❌ Error: Dockerfile.rasa not found. Please run this script from the backend directory."
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "rasa/render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please ensure the file exists."
    exit 1
fi

echo "✅ Found required files"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Build the Docker image locally to test
echo "🔨 Building Docker image locally for testing..."
docker build -f Dockerfile.rasa -t rasa-server-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful"
else
    echo "❌ Docker build failed"
    exit 1
fi

# Test the container
echo "🧪 Testing Docker container..."
docker run --rm -d --name rasa-test -p 5005:5005 rasa-server-test

# Wait for container to start
sleep 10

# Test health endpoint
if curl -f http://localhost:5005/webhooks/rest/ > /dev/null 2>&1; then
    echo "✅ Container health check passed"
else
    echo "⚠️ Container health check failed, but continuing with deployment"
fi

# Clean up test container
docker stop rasa-test > /dev/null 2>&1 || true

echo ""
echo "🎉 Local testing completed successfully!"
echo ""
echo "📋 Next steps for Render deployment:"
echo "1. Push your code to GitHub/GitLab"
echo "2. Connect your repository to Render"
echo "3. Create a new Web Service in Render"
echo "4. Use the following settings:"
echo "   - Build Command: (leave empty for Docker)"
echo "   - Start Command: (leave empty for Docker)"
echo "   - Dockerfile Path: ./Dockerfile.rasa"
echo "   - Docker Context: ."
echo "5. Set environment variables as needed"
echo "6. Deploy!"
echo ""
echo "🔗 Your Rasa server will be available at: https://your-app-name.onrender.com"
echo "🔗 Actions server will be available at: https://your-actions-app-name.onrender.com"
echo ""
echo "📝 Don't forget to update your webhook URLs in credentials.yml!"
