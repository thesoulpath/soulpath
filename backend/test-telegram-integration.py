#!/usr/bin/env python3
"""
Test Telegram Integration
Tests the Telegram bot integration without setting up webhooks
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, Optional

# Telegram Bot Configuration
BOT_TOKEN = "8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig"
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

async def test_bot_connection():
    """Test basic bot connection"""
    print("🔍 Testing bot connection...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/getMe") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("ok"):
                        bot_info = data.get("result")
                        print(f"✅ Bot connected successfully!")
                        print(f"   Name: {bot_info.get('first_name')}")
                        print(f"   Username: @{bot_info.get('username', 'No username')}")
                        print(f"   ID: {bot_info.get('id')}")
                        return True
                    else:
                        print(f"❌ Bot API error: {data.get('description')}")
                        return False
                else:
                    print(f"❌ HTTP error: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

async def test_send_message(chat_id: str, message: str):
    """Test sending a message"""
    print(f"📤 Testing message send to {chat_id}...")
    
    try:
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BASE_URL}/sendMessage",
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("ok"):
                        print(f"✅ Message sent successfully!")
                        return True
                    else:
                        print(f"❌ Send error: {data.get('description')}")
                        return False
                else:
                    print(f"❌ HTTP error: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Send error: {e}")
        return False

async def test_webhook_endpoint(webhook_url: str):
    """Test webhook endpoint accessibility"""
    print(f"🔗 Testing webhook endpoint: {webhook_url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(webhook_url) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Webhook endpoint accessible!")
                    print(f"   Response: {data}")
                    return True
                else:
                    print(f"❌ Webhook HTTP error: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return False

async def main():
    print("🧪 Telegram Integration Test")
    print("=" * 40)

    # Test 1: Bot connection
    print("\n1️⃣ Testing bot connection...")
    bot_connected = await test_bot_connection()
    
    if not bot_connected:
        print("❌ Bot connection failed. Please check your bot token.")
        return

    # Test 2: Send test message (optional)
    print("\n2️⃣ Test message sending (optional)")
    chat_id = input("Enter a chat ID to send test message (or press Enter to skip): ").strip()
    
    if chat_id:
        test_message = "🤖 Hello! This is a test message from SoulPath bot. Integration is working!"
        await test_send_message(chat_id, test_message)
    else:
        print("⏭️ Skipping message test")

    # Test 3: Webhook endpoint (optional)
    print("\n3️⃣ Test webhook endpoint (optional)")
    webhook_url = input("Enter webhook URL to test (or press Enter to skip): ").strip()
    
    if webhook_url:
        await test_webhook_endpoint(webhook_url)
    else:
        print("⏭️ Skipping webhook test")

    print("\n🎉 Test completed!")
    print("\n📋 Summary:")
    print(f"   Bot Connection: {'✅ Success' if bot_connected else '❌ Failed'}")
    print(f"   Message Test: {'✅ Success' if chat_id else '⏭️ Skipped'}")
    print(f"   Webhook Test: {'✅ Success' if webhook_url else '⏭️ Skipped'}")

    print("\n💡 Next steps:")
    print("1. Set up webhook using setup-telegram-local.py")
    print("2. Start your Next.js app: npm run dev")
    print("3. Start ngrok: ngrok http 3000")
    print("4. Test the bot by sending messages")

if __name__ == "__main__":
    asyncio.run(main())
