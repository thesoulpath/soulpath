"""
Telegram Bot API Connector for Rasa
Direct integration with Telegram Bot API
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


class TelegramOutput(OutputChannel):
    """Output channel for Telegram Bot API"""

    @classmethod
    def name(cls) -> Text:
        return "telegram"

    def __init__(self, bot_token: Text) -> None:
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_text_message(
        self, recipient_id: Text, text: Text, **kwargs: Any
    ) -> None:
        """Send a text message to Telegram"""
        await self._send_message(recipient_id, {"text": text})

    async def send_image_url(
        self, recipient_id: Text, image: Text, **kwargs: Any
    ) -> None:
        """Send an image to Telegram"""
        await self._send_message(recipient_id, {"photo": image})

    async def send_attachment(
        self, recipient_id: Text, attachment: Text, **kwargs: Any
    ) -> None:
        """Send a document to Telegram"""
        await self._send_message(recipient_id, {"document": attachment})

    async def send_buttons(
        self, recipient_id: Text, text: Text, buttons: List[Dict], **kwargs: Any
    ) -> None:
        """Send inline keyboard buttons to Telegram"""
        keyboard = []
        for button in buttons:
            keyboard.append([{"text": button.get("title", ""), "callback_data": button.get("payload", "")}])
        
        reply_markup = {"inline_keyboard": keyboard}
        await self._send_message(recipient_id, {"text": text, "reply_markup": reply_markup})

    async def _send_message(self, recipient_id: Text, message: Dict[Text, Any]) -> None:
        """Send a message to Telegram Bot API"""
        payload = {
            "chat_id": recipient_id,
            **message
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/sendMessage", 
                    json=payload
                ) as resp:
                    if resp.status == 200:
                        logger.info(f"Message sent successfully to {recipient_id}")
                    else:
                        error_text = await resp.text()
                        logger.error(f"Failed to send message: {resp.status} - {error_text}")
        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")


class TelegramInput(RestInput):
    """Input channel for Telegram Bot API"""

    @classmethod
    def name(cls) -> Text:
        return "telegram"

    @classmethod
    def from_credentials(cls, credentials: Dict[Text, Any]) -> "TelegramInput":
        return cls(
            credentials.get("bot_token"),
            credentials.get("webhook_url")
        )

    def __init__(
        self,
        bot_token: Optional[Text] = None,
        webhook_url: Optional[Text] = None,
    ) -> None:
        self.bot_token = bot_token
        self.webhook_url = webhook_url

    def blueprint(
        self, on_new_message, on_session_started, on_session_ended
    ) -> Blueprint:
        telegram_webhook = Blueprint("telegram_webhook", __name__)

        @telegram_webhook.route("/webhook", methods=["GET"])
        async def health(request: Request):
            """Health check for Telegram webhook"""
            return response.json({"status": "ok", "channel": "telegram"})

        @telegram_webhook.route("/webhook", methods=["POST"])
        async def webhook(request: Request):
            """Handle incoming Telegram messages"""
            try:
                body = await request.json()
                logger.info(f"Telegram webhook received: {body}")

                # Process Telegram webhook
                if body.get("update_id"):
                    message = body.get("message")
                    callback_query = body.get("callback_query")
                    
                    if message:
                        # Handle regular messages
                        chat_id = str(message.get("chat", {}).get("id"))
                        text = message.get("text", "")
                        user_info = message.get("from", {})
                        
                        if text:
                            # Create user message
                            user_message = UserMessage(
                                text=text,
                                sender_id=chat_id,
                                input_channel=self.name(),
                                metadata={
                                    "telegram_message": message,
                                    "user_info": user_info
                                }
                            )
                            
                            # Process message
                            await on_new_message(user_message)
                    
                    elif callback_query:
                        # Handle callback queries (button clicks)
                        chat_id = str(callback_query.get("message", {}).get("chat", {}).get("id"))
                        data = callback_query.get("data", "")
                        user_info = callback_query.get("from", {})
                        
                        if data:
                            # Create user message for callback data
                            user_message = UserMessage(
                                text=data,
                                sender_id=chat_id,
                                input_channel=self.name(),
                                metadata={
                                    "telegram_callback": callback_query,
                                    "user_info": user_info,
                                    "is_callback": True
                                }
                            )
                            
                            # Process callback
                            await on_new_message(user_message)

                return response.json({"status": "ok"})

            except Exception as e:
                logger.error(f"Error processing Telegram webhook: {e}")
                return response.json({"error": "Internal server error"}, status=500)

        return telegram_webhook

    def get_output_channel(self) -> Optional[OutputChannel]:
        """Get the output channel for Telegram"""
        if self.bot_token:
            return TelegramOutput(self.bot_token)
        return None

    async def set_webhook(self) -> bool:
        """Set webhook for Telegram bot"""
        if not self.bot_token or not self.webhook_url:
            logger.error("Bot token and webhook URL are required to set webhook")
            return False

        payload = {
            "url": self.webhook_url,
            "allowed_updates": ["message", "callback_query"]
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"https://api.telegram.org/bot{self.bot_token}/setWebhook",
                    json=payload
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        if result.get("ok"):
                            logger.info("Telegram webhook set successfully")
                            return True
                        else:
                            logger.error(f"Failed to set webhook: {result.get('description')}")
                            return False
                    else:
                        error_text = await resp.text()
                        logger.error(f"Failed to set webhook: {resp.status} - {error_text}")
                        return False
        except Exception as e:
            logger.error(f"Error setting Telegram webhook: {e}")
            return False

    async def get_bot_info(self) -> Optional[Dict]:
        """Get bot information from Telegram"""
        if not self.bot_token:
            return None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.telegram.org/bot{self.bot_token}/getMe"
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        if result.get("ok"):
                            return result.get("result")
                        else:
                            logger.error(f"Failed to get bot info: {result.get('description')}")
                            return None
                    else:
                        error_text = await resp.text()
                        logger.error(f"Failed to get bot info: {resp.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Error getting Telegram bot info: {e}")
            return None
