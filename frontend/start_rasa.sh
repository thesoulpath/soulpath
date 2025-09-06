#!/bin/bash
cd "/Users/albertosaco/Downloads/wellness-monorepo"
docker-compose up -d
echo "Waiting for Rasa to start..."
sleep 10
echo "Rasa should be running at http://localhost:5005"
echo "Test it with: curl http://localhost:5005/"
