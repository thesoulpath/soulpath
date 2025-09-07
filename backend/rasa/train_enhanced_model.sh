#!/bin/bash

echo "🚀 Training Enhanced Rasa Model with Natural Booking Funnel"
echo "=========================================================="

# Navigate to rasa directory
cd /Users/albertosaco/Downloads/wellness-monorepo/backend/rasa

# Activate virtual environment
source rasa_env/bin/activate

# Backup current data files
echo "📁 Backing up current data files..."
cp data/nlu.yml data/nlu_backup.yml
cp data/stories.yml data/stories_backup.yml
cp domain.yml domain_backup.yml
cp actions.py actions_backup.py

# Replace with enhanced versions
echo "🔄 Replacing with enhanced training data..."
cp data/nlu_enhanced.yml data/nlu.yml
cp data/stories_enhanced.yml data/stories.yml
cp domain_enhanced.yml domain.yml
cp actions_enhanced.py actions.py

# Train the model
echo "🧠 Training enhanced model..."
rasa train --fixed-model-name enhanced-booking-funnel

# Check if training was successful
if [ $? -eq 0 ]; then
    echo "✅ Training completed successfully!"
    echo "📦 Model saved as: models/enhanced-booking-funnel.tar.gz"
    
    # Test the model
    echo "🧪 Testing the enhanced model..."
    rasa test nlu --model models/enhanced-booking-funnel.tar.gz
    
    echo ""
    echo "🎉 Enhanced model is ready!"
    echo "📋 Features added:"
    echo "   - Natural booking funnel in English and Spanish"
    echo "   - Comprehensive intent recognition"
    echo "   - Custom actions for booking flow"
    echo "   - Multi-language support"
    echo "   - Payment and availability handling"
    echo ""
    echo "🚀 To use the new model, restart Rasa with:"
    echo "   rasa run --model models/enhanced-booking-funnel.tar.gz --enable-api --cors * --port 5005 --endpoints endpoints.yml"
    
else
    echo "❌ Training failed!"
    echo "🔄 Restoring backup files..."
    cp data/nlu_backup.yml data/nlu.yml
    cp data/stories_backup.yml data/stories.yml
    cp domain_backup.yml domain.yml
    cp actions_backup.py actions.py
    exit 1
fi