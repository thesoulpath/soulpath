#!/usr/bin/env python3
"""
Get ngrok URL and set up Telegram webhook
"""

import requests
import time
import sys

def get_ngrok_url():
    """Get the ngrok HTTPS URL"""
    try:
        response = requests.get('http://localhost:4040/api/tunnels', timeout=5)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get('tunnels', [])
            
            for tunnel in tunnels:
                if tunnel.get('proto') == 'https':
                    return tunnel.get('public_url')
            
            # If no HTTPS tunnel found, look for HTTP
            for tunnel in tunnels:
                if tunnel.get('proto') == 'http':
                    return tunnel.get('public_url')
                    
        return None
    except Exception as e:
        print(f"Error getting ngrok URL: {e}")
        return None

def main():
    print("🔍 Looking for ngrok tunnel...")
    
    # Wait for ngrok to start
    for i in range(10):
        url = get_ngrok_url()
        if url:
            print(f"✅ Found ngrok URL: {url}")
            webhook_url = f"{url}/api/telegram/webhook"
            print(f"🔗 Webhook URL: {webhook_url}")
            print(f"\n📋 Next steps:")
            print(f"1. Copy this webhook URL: {webhook_url}")
            print(f"2. Run: python backend/setup-telegram-local.py")
            print(f"3. Paste the webhook URL when prompted")
            print(f"4. Test by sending a message to @SoulPathAi_bot")
            return webhook_url
        else:
            print(f"⏳ Waiting for ngrok... ({i+1}/10)")
            time.sleep(2)
    
    print("❌ Could not find ngrok tunnel. Make sure ngrok is running:")
    print("   ngrok http 3000")
    return None

if __name__ == "__main__":
    main()
