"""
Custom connectors for Rasa
"""

from .whatsapp_connector import WhatsAppInput, WhatsAppOutput
from .telegram_connector import TelegramInput, TelegramOutput

__all__ = ["WhatsAppInput", "WhatsAppOutput", "TelegramInput", "TelegramOutput"]
