#!/usr/bin/env python3
"""
Telegram Bot Local Development Setup
Helps set up Telegram bot for local development using ngrok
"""

import os
import sys
import asyncio
import aiohttp
import json
from typing import Dict, Any, Optional

# Telegram Bot Configuration
BOT_TOKEN = "8381849581:AAG7bQxK23l5m2MeKJDnMIpGEzy0SeEYSig"
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

class TelegramLocalSetup:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def get_bot_info(self) -> Optional[Dict[str, Any]]:
        """Get bot information from Telegram"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/getMe") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("ok"):
                            return data.get("result")
                        else:
                            print(f"❌ Error getting bot info: {data.get('description')}")
                            return None
                    else:
                        print(f"❌ HTTP error: {response.status}")
                        return None
        except Exception as e:
            print(f"❌ Error getting bot info: {e}")
            return None

    async def set_webhook(self, webhook_url: str) -> bool:
        """Set webhook for the bot"""
        try:
            payload = {
                "url": webhook_url,
                "allowed_updates": ["message", "callback_query"]
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/setWebhook",
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("ok"):
                            print(f"✅ Webhook set successfully: {webhook_url}")
                            return True
                        else:
                            print(f"❌ Error setting webhook: {data.get('description')}")
                            return False
                    else:
                        print(f"❌ HTTP error: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Error setting webhook: {e}")
            return False

    async def delete_webhook(self) -> bool:
        """Delete webhook"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/deleteWebhook") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("ok"):
                            print("✅ Webhook deleted successfully")
                            return True
                        else:
                            print(f"❌ Error deleting webhook: {data.get('description')}")
                            return False
                    else:
                        print(f"❌ HTTP error: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Error deleting webhook: {e}")
            return False

async def main():
    print("🤖 Telegram Bot Local Development Setup")
    print("=" * 50)

    # Initialize bot setup
    bot_setup = TelegramLocalSetup(BOT_TOKEN)

    # Get bot information
    print("\n📋 Getting bot information...")
    bot_info = await bot_setup.get_bot_info()
    
    if bot_info:
        print(f"✅ Bot Name: {bot_info.get('first_name')}")
        print(f"✅ Bot Username: @{bot_info.get('username', 'No username')}")
        print(f"✅ Bot ID: {bot_info.get('id')}")
        print(f"✅ Can Join Groups: {bot_info.get('can_join_groups')}")
    else:
        print("❌ Failed to get bot information. Please check your bot token.")
        return

    print("\n🌐 Local Development Setup")
    print("For local development, you need to use ngrok to create an HTTPS tunnel.")
    print("\n📋 Steps:")
    print("1. Install ngrok: https://ngrok.com/download")
    print("2. Start your Next.js app: npm run dev (in frontend directory)")
    print("3. In another terminal, run: ngrok http 3000")
    print("4. Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)")
    print("5. Use that URL + /api/telegram/webhook as your webhook URL")
    
    print("\n🔧 Webhook Configuration")
    webhook_url = input("Enter your ngrok HTTPS URL + /api/telegram/webhook: ").strip()
    
    if not webhook_url:
        print("❌ No webhook URL provided. Exiting.")
        return

    if not webhook_url.startswith('https://'):
        print("❌ Webhook URL must start with https://")
        print("💡 Make sure you're using the ngrok HTTPS URL, not HTTP")
        return

    if not webhook_url.endswith('/api/telegram/webhook'):
        print("⚠️ Warning: Webhook URL should end with /api/telegram/webhook")
        print(f"   Current URL: {webhook_url}")
        confirm = input("Continue anyway? (y/N): ").strip().lower()
        if confirm != 'y':
            return

    # Set webhook
    print(f"\n🔧 Setting webhook to: {webhook_url}")
    webhook_set = await bot_setup.set_webhook(webhook_url)
    
    if webhook_set:
        print("✅ Webhook configured successfully!")
        print("\n🎉 Setup complete!")
        print("\n📋 Next steps:")
        print("1. Make sure your Next.js app is running on port 3000")
        print("2. Make sure ngrok is running and pointing to port 3000")
        print("3. Test the bot by sending a message to @SoulPathAi_bot")
        print("4. Check your Next.js console for webhook logs")
        print("\n💡 To stop the webhook later, run this script again and choose 'Delete webhook'")
    else:
        print("❌ Failed to set webhook")

    # Ask if user wants to delete webhook
    print("\n🗑️ Webhook Management")
    action = input("Do you want to delete the webhook now? (y/N): ").strip().lower()
    
    if action == 'y':
        await bot_setup.delete_webhook()
        print("✅ Webhook deleted. Bot will not receive messages until webhook is set again.")

if __name__ == "__main__":
    asyncio.run(main())
