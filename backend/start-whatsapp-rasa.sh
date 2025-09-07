#!/bin/bash

# WhatsApp Business API + Rasa Startup Script
# This script starts Rasa with WhatsApp Business API integration

echo "🚀 Starting Rasa with WhatsApp Business API integration..."

# Check if virtual environment exists
if [ ! -d "rasa/rasa_env" ]; then
    echo "❌ Rasa virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
echo "📦 Activating Rasa virtual environment..."
source rasa/rasa_env/bin/activate

# Check if .env file exists
if [ ! -f "rasa/.env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp rasa/whatsapp.env.example rasa/.env
    echo "📝 Please edit rasa/.env with your WhatsApp Business API credentials"
    echo "   Required variables:"
    echo "   - WHATSAPP_ACCESS_TOKEN"
    echo "   - WHATSAPP_PHONE_NUMBER_ID"
    echo "   - WHATSAPP_BUSINESS_ACCOUNT_ID"
    echo "   - WHATSAPP_VERIFY_TOKEN"
    echo "   - OPENROUTER_API_KEY"
    exit 1
fi

# Load environment variables
export $(cat rasa/.env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$WHATSAPP_ACCESS_TOKEN" ] || [ -z "$WHATSAPP_PHONE_NUMBER_ID" ] || [ -z "$WHATSAPP_BUSINESS_ACCOUNT_ID" ]; then
    echo "❌ Missing required WhatsApp environment variables"
    echo "   Please set the following in rasa/.env:"
    echo "   - WHATSAPP_ACCESS_TOKEN"
    echo "   - WHATSAPP_PHONE_NUMBER_ID"
    echo "   - WHATSAPP_BUSINESS_ACCOUNT_ID"
    exit 1
fi

# Install additional dependencies if needed
echo "📦 Installing additional dependencies..."
pip install aiohttp

# Start Rasa server with WhatsApp connector
echo "🤖 Starting Rasa server with WhatsApp Business API..."
cd rasa

# Run the custom WhatsApp startup script
python run_whatsapp.py --enable-api --cors "*" --debug
