#!/bin/bash

# Comprehensive Rasa Training Script
# This script trains a new Rasa model with comprehensive NLU data

echo "🚀 Starting comprehensive Rasa training..."

# Set environment variables
export RASA_ENV=production
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Navigate to Rasa directory
cd "$(dirname "$0")"

# Backup existing model
if [ -d "models" ] && [ "$(ls -A models)" ]; then
    echo "📦 Backing up existing models..."
    mkdir -p backups
    cp -r models/* backups/ 2>/dev/null || true
fi

# Clean previous training artifacts
echo "🧹 Cleaning previous training artifacts..."
rm -rf .rasa
rm -rf models/*.tar.gz

# Validate training data
echo "✅ Validating training data..."
rasa data validate --domain domain_comprehensive.yml --data data/nlu_comprehensive.yml

if [ $? -ne 0 ]; then
    echo "❌ Training data validation failed!"
    exit 1
fi

# Train NLU model
echo "🤖 Training NLU model..."
rasa train nlu --data data/nlu_comprehensive.yml --config config.yml --out models/

if [ $? -ne 0 ]; then
    echo "❌ NLU training failed!"
    exit 1
fi

# Train full model (NLU + Core)
echo "🎯 Training full model..."
rasa train --domain domain_comprehensive.yml --data data/nlu_comprehensive.yml --config config.yml --out models/

if [ $? -ne 0 ]; then
    echo "❌ Full model training failed!"
    exit 1
fi

# Test the model
echo "🧪 Testing the trained model..."
rasa test nlu --data data/nlu_comprehensive.yml --model models/

if [ $? -ne 0 ]; then
    echo "⚠️  Model testing failed, but training completed"
fi

# Get model version
MODEL_VERSION=$(ls models/*.tar.gz | head -1 | sed 's/.*models\///' | sed 's/\.tar\.gz$//')
echo "✅ Training completed successfully!"
echo "📊 Model version: $MODEL_VERSION"

# Generate training report
echo "📈 Generating training report..."
rasa test nlu --data data/nlu_comprehensive.yml --model models/ --out results/ --errors errors.json

# Display model information
echo "📋 Model Information:"
echo "   - Model file: models/$MODEL_VERSION.tar.gz"
echo "   - Training data: data/nlu_comprehensive.yml"
echo "   - Domain: domain_comprehensive.yml"
echo "   - Config: config.yml"

# Test model with sample inputs
echo "🔍 Testing model with sample inputs..."
echo "Testing: 'I want to book a reading'"
echo "I want to book a reading" | rasa shell nlu --model models/$MODEL_VERSION.tar.gz

echo "🎉 Comprehensive training completed!"
echo "💡 To use this model, update your API to point to: models/$MODEL_VERSION.tar.gz"
