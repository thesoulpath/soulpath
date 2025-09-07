#!/usr/bin/env python3
"""
Test script for WhatsApp Business API integration
"""

import os
import sys
import asyncio
import aiohttp
import json
from pathlib import Path

# Add the connectors directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "rasa" / "connectors"))

from connectors.whatsapp_connector import WhatsAppOutput

async def test_whatsapp_connection():
    """Test WhatsApp Business API connection"""
    
    # Load environment variables
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    
    if not access_token or not phone_number_id:
        print("❌ Missing WhatsApp credentials")
        print("Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID")
        return False
    
    print(f"🔍 Testing WhatsApp connection...")
    print(f"Phone Number ID: {phone_number_id}")
    
    # Create WhatsApp output channel
    whatsapp_output = WhatsAppOutput(access_token, phone_number_id)
    
    # Test sending a message (replace with a test number)
    test_number = input("Enter a test WhatsApp number (with country code, e.g., +1234567890): ")
    
    if not test_number:
        print("❌ No test number provided")
        return False
    
    try:
        # Send test message
        await whatsapp_output.send_text_message(
            test_number, 
            "🤖 Test message from Rasa WhatsApp integration! This is a test of the WhatsApp Business API connection."
        )
        print("✅ Test message sent successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test message: {e}")
        return False

async def test_webhook_verification():
    """Test webhook verification"""
    
    webhook_url = os.getenv("WHATSAPP_WEBHOOK_URL")
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    
    if not webhook_url or not verify_token:
        print("❌ Missing webhook configuration")
        print("Please set WHATSAPP_WEBHOOK_URL and WHATSAPP_VERIFY_TOKEN")
        return False
    
    print(f"🔍 Testing webhook verification...")
    print(f"Webhook URL: {webhook_url}")
    
    # Test webhook verification
    test_url = f"{webhook_url}?hub.mode=subscribe&hub.verify_token={verify_token}&hub.challenge=test_challenge_123"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(test_url) as resp:
                if resp.status == 200:
                    response_text = await resp.text()
                    if response_text == "test_challenge_123":
                        print("✅ Webhook verification successful!")
                        return True
                    else:
                        print(f"❌ Webhook verification failed: unexpected response: {response_text}")
                        return False
                else:
                    print(f"❌ Webhook verification failed: HTTP {resp.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ Webhook verification error: {e}")
        return False

async def main():
    """Main test function"""
    
    print("🧪 WhatsApp Business API Integration Test")
    print("=" * 50)
    
    # Load environment variables from .env file
    env_file = Path(__file__).parent / "rasa" / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print("✅ Environment variables loaded from .env file")
    else:
        print("⚠️  No .env file found. Using system environment variables.")
    
    print()
    
    # Test webhook verification
    webhook_ok = await test_webhook_verification()
    print()
    
    # Test message sending
    message_ok = await test_whatsapp_connection()
    print()
    
    # Summary
    print("📊 Test Results:")
    print(f"Webhook Verification: {'✅ PASS' if webhook_ok else '❌ FAIL'}")
    print(f"Message Sending: {'✅ PASS' if message_ok else '❌ FAIL'}")
    
    if webhook_ok and message_ok:
        print("\n🎉 All tests passed! WhatsApp integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check your configuration.")
        print("\nTroubleshooting tips:")
        if not webhook_ok:
            print("- Check that your webhook URL is publicly accessible")
            print("- Verify WHATSAPP_VERIFY_TOKEN matches Meta configuration")
        if not message_ok:
            print("- Check that WHATSAPP_ACCESS_TOKEN is valid")
            print("- Verify WHATSAPP_PHONE_NUMBER_ID is correct")
            print("- Ensure your WhatsApp Business account is approved")

if __name__ == "__main__":
    asyncio.run(main())
