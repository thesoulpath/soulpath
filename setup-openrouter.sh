#!/bin/bash

echo "🔑 OpenRouter API Key Setup for Telegram Bot"
echo "============================================="
echo ""
echo "To get your OpenRouter API key:"
echo "1. Visit: https://openrouter.ai/"
echo "2. Sign up for a free account"
echo "3. Go to: https://openrouter.ai/settings/keys"
echo "4. Click 'Create Key' and copy the key"
echo ""
echo "Once you have your API key, run:"
echo "export OPENROUTER_API_KEY='your_actual_api_key_here'"
echo ""
echo "Then restart the Next.js server:"
echo "pkill -f 'next dev'"
echo "npm run dev"
echo ""
echo "Your bot will then use AI-powered responses instead of fallback messages!"
echo ""
echo "Current status:"
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ OpenRouter API key not set"
else
    echo "✅ OpenRouter API key is set: ${OPENROUTER_API_KEY:0:10}..."
fi
