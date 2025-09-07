#!/bin/bash

# Quick fix and retrain script for the slot interpolation error
echo "🔧 Fixing slot interpolation error and retraining model..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Validate the fixed configuration
print_status "Validating fixed configuration..."
rasa data validate --domain domain.yml --data data/ --config config.yml

if [ $? -eq 0 ]; then
    print_success "Configuration validation passed!"
else
    echo "❌ Configuration validation failed!"
    exit 1
fi

# Train the model with fixes
print_status "Retraining model with fixes..."
rasa train \
    --config config.yml \
    --domain domain.yml \
    --data data/ \
    --out models/ \
    --force

if [ $? -eq 0 ]; then
    print_success "Model retrained successfully!"
    print_status "The slot interpolation error has been fixed."
    print_status "You can now run the model with: rasa run --model models/ --enable-api --cors '*'"
else
    echo "❌ Model training failed!"
    exit 1
fi
