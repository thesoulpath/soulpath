#!/bin/bash

# Render Deployment Script for Rasa
echo "🚀 Preparing Rasa deployment to Render..."

# Check if required files exist
REQUIRED_FILES=("requirements.txt" "domain.yml" "config.yml" "credentials.yml" "endpoints.yml")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Check if model exists
if [ ! -d "models" ] || [ -z "$(ls -A models/*.tar.gz 2>/dev/null)" ]; then
    echo "⚠️  Warning: No trained model found in models/ directory"
    echo "   Make sure to train your model first:"
    echo "   rasa train"
else
    MODEL_FILE=$(ls models/*.tar.gz | head -1)
    echo "✅ Found model: $MODEL_FILE"
fi

# Check if actions file exists
if [ -f "actions.py" ]; then
    echo "✅ Actions file found: actions.py"
elif [ -f "actions/actions.py" ]; then
    echo "✅ Actions file found: actions/actions.py"
else
    echo "⚠️  No actions file found"
fi

echo ""
echo "🎯 Render Deployment Ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Push these changes to your GitHub repository"
echo "2. Go to https://render.com"
echo "3. Create a new Web Service"
echo "4. Connect your GitHub repository"
echo "5. Configure the service:"
echo "   - Runtime: Python 3"
echo "   - Build Command: pip install -r backend/rasa/requirements.txt"
echo "   - Start Command: cd backend/rasa && python -m rasa run --enable-api --cors \"*\" --port \$PORT --credentials credentials.yml --endpoints endpoints.yml"
echo "6. Add environment variables from env.example"
echo "7. Deploy!"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"
