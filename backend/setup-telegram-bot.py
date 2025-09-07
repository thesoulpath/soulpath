#!/usr/bin/env python3
"""
Telegram Bot Setup Script
Configures the Telegram bot webhook and tests the integration
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

class TelegramBotSetup:
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

    async def get_webhook_info(self) -> Optional[Dict[str, Any]]:
        """Get webhook information"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/getWebhookInfo") as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("ok"):
                            return data.get("result")
                        else:
                            print(f"❌ Error getting webhook info: {data.get('description')}")
                            return None
                    else:
                        print(f"❌ HTTP error: {response.status}")
                        return None
        except Exception as e:
            print(f"❌ Error getting webhook info: {e}")
            return None

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

    async def send_test_message(self, chat_id: str, message: str) -> bool:
        """Send a test message"""
        try:
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/sendMessage",
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("ok"):
                            print(f"✅ Test message sent successfully to {chat_id}")
                            return True
                        else:
                            print(f"❌ Error sending message: {data.get('description')}")
                            return False
                    else:
                        print(f"❌ HTTP error: {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            return False

async def main():
    print("🤖 Telegram Bot Setup Script")
    print("=" * 50)

    # Initialize bot setup
    bot_setup = TelegramBotSetup(BOT_TOKEN)

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

    # Get current webhook info
    print("\n🔗 Getting current webhook information...")
    webhook_info = await bot_setup.get_webhook_info()
    
    if webhook_info:
        print(f"✅ Current webhook URL: {webhook_info.get('url', 'Not set')}")
        print(f"✅ Pending updates: {webhook_info.get('pending_update_count', 0)}")
        if webhook_info.get('last_error_date'):
            print(f"⚠️ Last webhook error: {webhook_info.get('last_error_message')}")
    else:
        print("❌ Failed to get webhook information")

    # Ask for webhook URL
    print("\n🌐 Webhook Configuration")
    print("Please provide your webhook URL (e.g., https://your-domain.vercel.app/api/telegram/webhook)")
    
    webhook_url = input("Webhook URL: ").strip()
    
    if not webhook_url:
        print("❌ No webhook URL provided. Exiting.")
        return

    if not webhook_url.startswith('https://'):
        print("❌ Webhook URL must start with https://")
        print("💡 For local development, use ngrok:")
        print("   1. Install ngrok: https://ngrok.com/download")
        print("   2. Run: ngrok http 3000")
        print("   3. Use the https URL provided by ngrok")
        return

    # Set webhook
    print(f"\n🔧 Setting webhook to: {webhook_url}")
    webhook_set = await bot_setup.set_webhook(webhook_url)
    
    if webhook_set:
        print("✅ Webhook configured successfully!")
        
        # Verify webhook
        print("\n🔍 Verifying webhook...")
        updated_webhook_info = await bot_setup.get_webhook_info()
        
        if updated_webhook_info:
            print(f"✅ Verified webhook URL: {updated_webhook_info.get('url')}")
            print(f"✅ Pending updates: {updated_webhook_info.get('pending_update_count', 0)}")
        
        # Test message option
        print("\n📱 Test Message")
        test_chat = input("Enter a chat ID to send a test message (or press Enter to skip): ").strip()
        
        if test_chat:
            test_message = f"🤖 Hello! This is a test message from {bot_info.get('first_name')}. Your bot is now configured and ready to receive messages!"
            await bot_setup.send_test_message(test_chat, test_message)
    else:
        print("❌ Failed to set webhook")

    print("\n🎉 Setup complete!")
    print("\n📋 Next steps:")
    print("1. Make sure your webhook endpoint is accessible")
    print("2. Test the bot by sending a message to it")
    print("3. Check the webhook logs for any errors")
    print("4. Configure the bot in your admin dashboard")

if __name__ == "__main__":
    asyncio.run(main())
