#!/bin/bash
cd "/Users/albertosaco/Downloads/wellness-monorepo/backend/rasa"
echo "Starting Rasa locally..."
/opt/anaconda3/envs/rasa-env/bin/python -m rasa run --enable-api --cors "*" --port 5005
