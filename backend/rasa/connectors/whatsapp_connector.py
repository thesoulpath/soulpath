"""
WhatsApp Business API Connector for Rasa
Direct integration with Meta's WhatsApp Business API
"""

import asyncio
import logging
import json
from typing import Dict, Any, Optional, Text, List
from rasa.core.channels.channel import UserMessage, OutputChannel
from rasa.core.channels.rest import RestInput
from rasa.core.channels.channel import CollectingOutputChannel
from sanic import Blueprint, response
from sanic.request import Request
import aiohttp

logger = logging.getLogger(__name__)


class WhatsAppOutput(OutputChannel):
    """Output channel for WhatsApp Business API"""

    @classmethod
    def name(cls) -> Text:
        return "whatsapp"

    def __init__(self, access_token: Text, phone_number_id: Text) -> None:
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.base_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"

    async def send_text_message(
        self, recipient_id: Text, text: Text, **kwargs: Any
    ) -> None:
        """Send a text message to WhatsApp"""
        await self._send_message(recipient_id, {"type": "text", "text": {"body": text}})

    async def send_image_url(
        self, recipient_id: Text, image: Text, **kwargs: Any
    ) -> None:
        """Send an image to WhatsApp"""
        await self._send_message(
            recipient_id, {"type": "image", "image": {"link": image}}
        )

    async def send_attachment(
        self, recipient_id: Text, attachment: Text, **kwargs: Any
    ) -> None:
        """Send an attachment to WhatsApp"""
        await self._send_message(
            recipient_id, {"type": "document", "document": {"link": attachment}}
        )

    async def _send_message(self, recipient_id: Text, message: Dict[Text, Any]) -> None:
        """Send a message to WhatsApp Business API"""
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_id,
            **message
        }

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url, 
                    json=payload, 
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        logger.info(f"Message sent successfully to {recipient_id}")
                    else:
                        error_text = await resp.text()
                        logger.error(f"Failed to send message: {resp.status} - {error_text}")
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")


class WhatsAppInput(RestInput):
    """Input channel for WhatsApp Business API"""

    @classmethod
    def name(cls) -> Text:
        return "whatsapp"

    @classmethod
    def from_credentials(cls, credentials: Dict[Text, Any]) -> "WhatsAppInput":
        return cls(
            credentials.get("access_token"),
            credentials.get("phone_number_id"),
            credentials.get("business_account_id"),
            credentials.get("webhook_url")
        )

    def __init__(
        self,
        access_token: Optional[Text] = None,
        phone_number_id: Optional[Text] = None,
        business_account_id: Optional[Text] = None,
        webhook_url: Optional[Text] = None,
    ) -> None:
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.business_account_id = business_account_id
        self.webhook_url = webhook_url

    def blueprint(
        self, on_new_message, on_session_started, on_session_ended
    ) -> Blueprint:
        whatsapp_webhook = Blueprint("whatsapp_webhook", __name__)

        @whatsapp_webhook.route("/webhook", methods=["GET"])
        async def health(request: Request):
            """Webhook verification for WhatsApp"""
            verify_token = request.args.get("hub.verify_token")
            challenge = request.args.get("hub.challenge")
            mode = request.args.get("hub.mode")

            if mode == "subscribe" and verify_token == self.access_token:
                logger.info("WhatsApp webhook verified successfully")
                return response.text(challenge)
            else:
                logger.error("WhatsApp webhook verification failed")
                return response.text("Forbidden", status=403)

        @whatsapp_webhook.route("/webhook", methods=["POST"])
        async def webhook(request: Request):
            """Handle incoming WhatsApp messages"""
            try:
                body = await request.json()
                logger.info(f"WhatsApp webhook received: {body}")

                # Process WhatsApp webhook
                if body.get("object") == "whatsapp_business_account":
                    entries = body.get("entry", [])
                    
                    for entry in entries:
                        changes = entry.get("changes", [])
                        
                        for change in changes:
                            if change.get("field") == "messages":
                                messages = change.get("value", {}).get("messages", [])
                                
                                for message in messages:
                                    if message.get("type") == "text":
                                        sender_id = message.get("from")
                                        text = message.get("text", {}).get("body", "")
                                        
                                        # Create user message
                                        user_message = UserMessage(
                                            text=text,
                                            sender_id=sender_id,
                                            input_channel=self.name(),
                                            metadata={"whatsapp_message": message}
                                        )
                                        
                                        # Process message
                                        await on_new_message(user_message)

                return response.json({"status": "ok"})

            except Exception as e:
                logger.error(f"Error processing WhatsApp webhook: {e}")
                return response.json({"error": "Internal server error"}, status=500)

        return whatsapp_webhook

    def get_output_channel(self) -> Optional[OutputChannel]:
        """Get the output channel for WhatsApp"""
        if self.access_token and self.phone_number_id:
            return WhatsAppOutput(self.access_token, self.phone_number_id)
        return None
