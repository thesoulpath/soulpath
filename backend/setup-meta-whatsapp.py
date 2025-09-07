#!/usr/bin/env python3
"""
Meta WhatsApp Business API Setup Script
This script helps configure WhatsApp Business API using Meta's Graph API
"""

import os
import sys
import json
import requests
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

class MetaWhatsAppSetup:
    def __init__(self):
        self.base_url = "https://graph.facebook.com/v18.0"
        self.access_token = None
        self.app_id = None
        self.app_secret = None
        self.phone_number_id = None
        self.business_account_id = None
        self.webhook_url = None
        self.verify_token = None

    def load_credentials(self, credentials_file: str = None) -> bool:
        """Load credentials from file or environment variables"""
        if credentials_file and Path(credentials_file).exists():
            with open(credentials_file) as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value

        self.access_token = os.getenv("META_ACCESS_TOKEN")
        self.app_id = os.getenv("META_APP_ID")
        self.app_secret = os.getenv("META_APP_SECRET")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
        self.webhook_url = os.getenv("WHATSAPP_WEBHOOK_URL")
        self.verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")

        if not self.access_token:
            print("❌ META_ACCESS_TOKEN not found")
            return False
        
        return True

    def test_connection(self) -> bool:
        """Test connection to Meta Graph API"""
        print("🔍 Testing Meta Graph API connection...")
        
        try:
            response = requests.get(
                f"{self.base_url}/me",
                params={"access_token": self.access_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Connected successfully! App: {data.get('name', 'Unknown')}")
                return True
            else:
                print(f"❌ Connection failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

    def get_app_info(self) -> Optional[Dict[str, Any]]:
        """Get app information"""
        try:
            response = requests.get(
                f"{self.base_url}/{self.app_id}",
                params={
                    "access_token": self.access_token,
                    "fields": "name,id,app_domains"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get app info: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting app info: {e}")
            return None

    def get_whatsapp_business_accounts(self) -> Optional[list]:
        """Get WhatsApp Business Accounts"""
        try:
            response = requests.get(
                f"{self.base_url}/{self.app_id}/whatsapp_business_accounts",
                params={"access_token": self.access_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            else:
                print(f"❌ Failed to get WhatsApp Business Accounts: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting WhatsApp Business Accounts: {e}")
            return None

    def get_phone_numbers(self, business_account_id: str) -> Optional[list]:
        """Get phone numbers for a business account"""
        try:
            response = requests.get(
                f"{self.base_url}/{business_account_id}/phone_numbers",
                params={"access_token": self.access_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            else:
                print(f"❌ Failed to get phone numbers: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting phone numbers: {e}")
            return None

    def setup_webhook(self, app_id: str, webhook_url: str, verify_token: str) -> bool:
        """Set up webhook for WhatsApp"""
        print(f"🔗 Setting up webhook: {webhook_url}")
        
        try:
            # Subscribe to WhatsApp webhook
            response = requests.post(
                f"{self.base_url}/{app_id}/subscriptions",
                data={
                    "access_token": self.access_token,
                    "object": "whatsapp_business_account",
                    "callback_url": webhook_url,
                    "verify_token": verify_token,
                    "fields": "messages"
                }
            )
            
            if response.status_code == 200:
                print("✅ Webhook subscribed successfully")
                return True
            else:
                print(f"❌ Failed to subscribe webhook: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error setting up webhook: {e}")
            return False

    def send_test_message(self, phone_number_id: str, to_number: str, message: str) -> bool:
        """Send a test message"""
        print(f"📱 Sending test message to {to_number}")
        
        try:
            response = requests.post(
                f"{self.base_url}/{phone_number_id}/messages",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": to_number,
                    "type": "text",
                    "text": {"body": message}
                }
            )
            
            if response.status_code == 200:
                print("✅ Test message sent successfully")
                return True
            else:
                print(f"❌ Failed to send test message: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending test message: {e}")
            return False

    def generate_credentials_file(self, output_file: str = "whatsapp-credentials.env"):
        """Generate credentials file"""
        credentials = f"""# WhatsApp Business API Credentials
# Generated by Meta WhatsApp Setup Script

# Meta App Credentials
META_ACCESS_TOKEN={self.access_token}
META_APP_ID={self.app_id or 'your_app_id_here'}
META_APP_SECRET={self.app_secret or 'your_app_secret_here'}

# WhatsApp Business API Credentials
WHATSAPP_ACCESS_TOKEN={self.access_token}
WHATSAPP_PHONE_NUMBER_ID={self.phone_number_id or 'your_phone_number_id_here'}
WHATSAPP_BUSINESS_ACCOUNT_ID={self.business_account_id or 'your_business_account_id_here'}
WHATSAPP_VERIFY_TOKEN={self.verify_token or 'your_verify_token_here'}
WHATSAPP_WEBHOOK_URL={self.webhook_url or 'https://your-domain.com/webhooks/whatsapp/webhook'}

# Rasa Configuration
RASA_URL=http://localhost:5005
RASA_MODEL=rasa
RASA_CONFIDENCE_THRESHOLD=0.7

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=1000

# Logging Configuration
LOGGING_ENABLED=true
LOGGING_LEVEL=info
LOGGING_STORAGE=console
"""
        
        with open(output_file, 'w') as f:
            f.write(credentials)
        
        print(f"✅ Credentials file generated: {output_file}")

    def interactive_setup(self):
        """Interactive setup wizard"""
        print("🚀 Meta WhatsApp Business API Setup Wizard")
        print("=" * 50)
        
        # Get access token
        if not self.access_token:
            self.access_token = input("Enter your Meta Access Token: ").strip()
        
        if not self.test_connection():
            print("❌ Invalid access token. Please check your credentials.")
            return False
        
        # Get app info
        app_info = self.get_app_info()
        if app_info:
            print(f"📱 App: {app_info.get('name', 'Unknown')} (ID: {app_info.get('id', 'Unknown')})")
        
        # Get WhatsApp Business Accounts
        print("\n🔍 Fetching WhatsApp Business Accounts...")
        business_accounts = self.get_whatsapp_business_accounts()
        
        if not business_accounts:
            print("❌ No WhatsApp Business Accounts found. Please create one in Meta Business Manager.")
            return False
        
        print(f"✅ Found {len(business_accounts)} WhatsApp Business Account(s):")
        for i, account in enumerate(business_accounts):
            print(f"  {i+1}. {account.get('name', 'Unknown')} (ID: {account.get('id', 'Unknown')})")
        
        # Select business account
        if len(business_accounts) == 1:
            selected_account = business_accounts[0]
            print(f"📋 Using: {selected_account.get('name')}")
        else:
            choice = input(f"Select business account (1-{len(business_accounts)}): ").strip()
            try:
                selected_account = business_accounts[int(choice) - 1]
            except (ValueError, IndexError):
                print("❌ Invalid selection")
                return False
        
        self.business_account_id = selected_account.get('id')
        
        # Get phone numbers
        print(f"\n📞 Fetching phone numbers for {selected_account.get('name')}...")
        phone_numbers = self.get_phone_numbers(self.business_account_id)
        
        if not phone_numbers:
            print("❌ No phone numbers found. Please add a phone number in Meta Business Manager.")
            return False
        
        print(f"✅ Found {len(phone_numbers)} phone number(s):")
        for i, number in enumerate(phone_numbers):
            print(f"  {i+1}. {number.get('display_phone_number', 'Unknown')} (ID: {number.get('id', 'Unknown')})")
        
        # Select phone number
        if len(phone_numbers) == 1:
            selected_number = phone_numbers[0]
            print(f"📱 Using: {selected_number.get('display_phone_number')}")
        else:
            choice = input(f"Select phone number (1-{len(phone_numbers)}): ").strip()
            try:
                selected_number = phone_numbers[int(choice) - 1]
            except (ValueError, IndexError):
                print("❌ Invalid selection")
                return False
        
        self.phone_number_id = selected_number.get('id')
        
        # Get webhook URL
        if not self.webhook_url:
            self.webhook_url = input("Enter your webhook URL (e.g., https://your-domain.com/webhooks/whatsapp/webhook): ").strip()
        
        # Get verify token
        if not self.verify_token:
            self.verify_token = input("Enter your verify token (custom string): ").strip()
        
        # Set up webhook
        print(f"\n🔗 Setting up webhook...")
        if self.setup_webhook(self.app_id or "your_app_id", self.webhook_url, self.verify_token):
            print("✅ Webhook configured successfully")
        else:
            print("⚠️  Webhook setup failed, but you can configure it manually in Meta Business Manager")
        
        # Generate credentials file
        print(f"\n📝 Generating credentials file...")
        self.generate_credentials_file()
        
        print(f"\n🎉 Setup complete!")
        print(f"📋 Summary:")
        print(f"  - Business Account: {selected_account.get('name')} ({self.business_account_id})")
        print(f"  - Phone Number: {selected_number.get('display_phone_number')} ({self.phone_number_id})")
        print(f"  - Webhook URL: {self.webhook_url}")
        print(f"  - Verify Token: {self.verify_token}")
        
        return True

def main():
    parser = argparse.ArgumentParser(description="Meta WhatsApp Business API Setup")
    parser.add_argument("--credentials", help="Path to credentials file")
    parser.add_argument("--test-message", help="Send test message to phone number")
    parser.add_argument("--interactive", action="store_true", help="Run interactive setup")
    
    args = parser.parse_args()
    
    setup = MetaWhatsAppSetup()
    
    if args.interactive:
        setup.interactive_setup()
    elif args.credentials:
        if setup.load_credentials(args.credentials):
            if args.test_message:
                setup.send_test_message(setup.phone_number_id, args.test_message, "Test message from Meta WhatsApp setup script!")
            else:
                setup.test_connection()
        else:
            print("❌ Failed to load credentials")
    else:
        print("Use --interactive for guided setup or --credentials <file> to load existing credentials")
        print("Example: python setup-meta-whatsapp.py --interactive")

if __name__ == "__main__":
    main()
