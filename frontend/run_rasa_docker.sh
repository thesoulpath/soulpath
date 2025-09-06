#!/bin/bash
export RASA_PROJECT_PATH="/Users/albertosaco/Downloads/wellness-monorepo/backend/rasa"
echo "Starting Rasa with Docker..."
echo "Project path: $RASA_PROJECT_PATH"
docker run -d --name rasa-app -p 5005:5005 -v "$RASA_PROJECT_PATH:/app" rasa/rasa:3.6.20-full run --cors "*" --debug
echo "Rasa should be running at http://localhost:5005"
echo "To check status: docker ps"
echo "To view logs: docker logs rasa-app"
echo "To stop: docker stop rasa-app && docker rm rasa-app"
