#!/usr/bin/env python3
"""
Rasa server startup script with WhatsApp Business API integration
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the connectors directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "connectors"))

from rasa.core.run import serve_application
from rasa.core.channels import channel
from connectors.whatsapp_connector import WhatsAppInput

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Main function to start Rasa with WhatsApp integration"""
    
    # Load environment variables
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
    webhook_url = os.getenv("WHATSAPP_WEBHOOK_URL")
    
    if not all([access_token, phone_number_id, business_account_id]):
        logger.error("Missing required WhatsApp environment variables:")
        logger.error("- WHATSAPP_ACCESS_TOKEN")
        logger.error("- WHATSAPP_PHONE_NUMBER_ID") 
        logger.error("- WHATSAPP_BUSINESS_ACCOUNT_ID")
        sys.exit(1)
    
    # Register WhatsApp input channel
    whatsapp_input = WhatsAppInput(
        access_token=access_token,
        phone_number_id=phone_number_id,
        business_account_id=business_account_id,
        webhook_url=webhook_url
    )
    
    # Register the channel
    channel.register([whatsapp_input])
    
    logger.info("WhatsApp Business API connector registered successfully")
    logger.info(f"Phone Number ID: {phone_number_id}")
    logger.info(f"Business Account ID: {business_account_id}")
    
    # Start Rasa server
    serve_application()

if __name__ == "__main__":
    main()
