"""
Custom actions for the wellness astrology chatbot
"""
import logging
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, SessionStarted, ActionExecuted
# from rasa_sdk.forms import FormAction
import requests
import json
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)

class ActionDefaultFallback(Action):
    """Executes the fallback action and goes back to the previous state
    of the conversation"""

    def name(self) -> Text:
        return "action_default_fallback"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get the last user message
        last_message = tracker.latest_message.get('text', '')

        # Try to understand the intent better
        if any(word in last_message.lower() for word in ['precio', 'costo', 'tarifa', 'price', 'cost']):
            dispatcher.utter_message(response="utter_pricing")
        elif any(word in last_message.lower() for word in ['horario', 'disponibilidad', 'schedule', 'available']):
            dispatcher.utter_message(response="utter_availability")
        elif any(word in last_message.lower() for word in ['contacto', 'teléfono', 'email', 'contact', 'phone']):
            dispatcher.utter_message(response="utter_contact")
        elif any(word in last_message.lower() for word in ['servicio', 'sesión', 'service', 'session']):
            dispatcher.utter_message(response="utter_session_types")
        elif any(word in last_message.lower() for word in ['agendar', 'cita', 'book', 'appointment']):
            dispatcher.utter_message(response="utter_book_session")
        else:
            dispatcher.utter_message(response="utter_default")

        return []

class ActionExtractAstrologyInfo(Action):
    """Extract astrology information from user input"""

    def name(self) -> Text:
        return "action_extract_astrology_info"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get entities from the message
        entities = tracker.latest_message.get('entities', [])
        sign_entity = next((e for e in entities if e['entity'] == 'sign'), None)

        if sign_entity:
            sign = sign_entity['value']
            dispatcher.utter_message(
                text=f"¡Excelente! Veo que eres {sign}. Los {sign.lower()}s son conocidos por su personalidad única. ¿Te gustaría saber más sobre tu signo o agendar una consulta personalizada?"
            )
        else:
            dispatcher.utter_message(
                text="Me encantaría ayudarte con información astrológica. ¿Cuál es tu signo zodiacal o te gustaría agendar una consulta para analizar tu carta natal?"
            )

        return []

class ActionBookSessionForm(Action):
    """Form for booking a session"""

    def name(self) -> Text:
        return "action_book_session_form"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        session_type = tracker.get_slot("session_type")
        preferred_date = tracker.get_slot("preferred_date")
        preferred_time = tracker.get_slot("preferred_time")

        # Here you would typically save to a database or send to a booking system
        dispatcher.utter_message(
            text=f"¡Perfecto! He registrado tu solicitud para una sesión de {session_type} el {preferred_date} a las {preferred_time}. Te contactaremos pronto para confirmar todos los detalles."
        )

        return []

class ActionCheckAvailability(Action):
    """Check availability for booking"""

    def name(self) -> Text:
        return "action_check_availability"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get current date and time
        now = datetime.now()

        # Simulate availability check
        available_times = [
            f"{now + timedelta(days=1)}: 10:00 AM, 2:00 PM, 4:00 PM",
            f"{now + timedelta(days=2)}: 9:00 AM, 11:00 AM, 3:00 PM, 5:00 PM",
            f"{now + timedelta(days=3)}: 10:00 AM, 1:00 PM, 4:00 PM"
        ]

        dispatcher.utter_message(
            text=f"Estos son nuestros próximos horarios disponibles:\n\n" +
                 "\n".join(available_times) +
                 "\n\n¿Te gustaría agendar para alguno de estos horarios?"
        )

        return []

class ActionGetPricing(Action):
    """Get detailed pricing information"""

    def name(self) -> Text:
        return "action_get_pricing"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        pricing_info = {
            "astrología": "$50 - $80",
            "tarot": "$40 - $60",
            "numerología": "$45 - $65",
            "meditación": "$35 - $50",
            "terapia": "$60 - $100",
            "coaching": "$70 - $120"
        }

        message = "Aquí tienes nuestros precios detallados:\n\n"
        for service, price in pricing_info.items():
            message += f"• {service.title()}: {price}\n"

        message += "\nTambién ofrecemos paquetes especiales con descuentos. ¿Te interesa algún servicio específico?"

        dispatcher.utter_message(text=message)

        return []

class ActionSentimentAnalysis(Action):
    """Analyze sentiment of user messages"""

    def name(self) -> Text:
        return "action_sentiment_analysis"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        last_message = tracker.latest_message.get('text', '').lower()

        # Simple sentiment analysis
        positive_words = ['bueno', 'excelente', 'genial', 'perfecto', 'gracias', 'sí', 'yes', 'great', 'good', 'excellent']
        negative_words = ['malo', 'terrible', 'horrible', 'no', 'no quiero', 'no me gusta', 'bad', 'terrible', 'awful']

        positive_count = sum(1 for word in positive_words if word in last_message)
        negative_count = sum(1 for word in negative_words if word in last_message)

        if positive_count > negative_count:
            sentiment = "positive"
            dispatcher.utter_message(text="Me alegra saber que estás teniendo una experiencia positiva. ¿Hay algo más en lo que pueda ayudarte?")
        elif negative_count > positive_count:
            sentiment = "negative"
            dispatcher.utter_message(text="Entiendo que puede haber alguna preocupación. ¿Te gustaría que te ayude de alguna manera específica?")
        else:
            sentiment = "neutral"

        return [SlotSet("sentiment", sentiment)]

class ActionValidateBooking(Action):
    """Validate booking information"""

    def name(self) -> Text:
        return "action_validate_booking"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get slots
        session_type = tracker.get_slot("session_type")
        date = tracker.get_slot("date")
        time = tracker.get_slot("time")

        # Validate session type
        valid_types = ["astrología", "tarot", "numerología", "meditación", "terapia", "coaching"]
        if session_type and session_type.lower() not in valid_types:
            dispatcher.utter_message(
                text=f"Disculpa, no reconozco el tipo de sesión '{session_type}'. Nuestros servicios disponibles son: {', '.join(valid_types)}. ¿Cuál te interesa?"
            )
            return [SlotSet("session_type", None)]

        # Validate date format (basic check)
        if date and not re.match(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', date):
            dispatcher.utter_message(
                text="Por favor, proporciona la fecha en formato DD/MM/YYYY o DD-MM-YYYY. Por ejemplo: 15/03/2024"
            )
            return [SlotSet("date", None)]

        # Validate time format
        if time and not re.match(r'\d{1,2}:\d{2}\s*(AM|PM|am|pm)?', time):
            dispatcher.utter_message(
                text="Por favor, proporciona la hora en formato HH:MM AM/PM. Por ejemplo: 2:30 PM o 14:30"
            )
            return [SlotSet("time", None)]

        return []

class ActionSaveUserInfo(Action):
    """Save user information for future reference"""

    def name(self) -> Text:
        return "action_save_user_info"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get user information
        name = tracker.get_slot("name")
        sign = tracker.get_slot("sign")
        user_id = tracker.sender_id

        # Here you would typically save to a database
        logger.info(f"Saving user info: {user_id}, {name}, {sign}")

        if name:
            dispatcher.utter_message(
                text=f"¡Perfecto, {name}! He guardado tu información. ¿Hay algo más en lo que pueda ayudarte?"
            )

        return []

class ActionHandleNameProvision(Action):
    """Handle name provision with proper slot setting and personalized response"""

    def name(self) -> Text:
        return "action_handle_name_provision"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get entities from the message
        entities = tracker.latest_message.get('entities', [])
        name_entity = next((e for e in entities if e['entity'] == 'name'), None)

        if name_entity:
            name = name_entity['value']
            dispatcher.utter_message(
                text=f"¡Mucho gusto, {name}! Soy tu asistente de astrología. ¿En qué puedo ayudarte?"
            )
            return [SlotSet("name", name)]
        else:
            # If no name entity found, try to extract from text
            text = tracker.latest_message.get('text', '')
            # Simple name extraction patterns
            import re
            patterns = [
                r'mi nombre es (\w+)',
                r'me llamo (\w+)',
                r'soy (\w+)',
                r'call me (\w+)',
                r"I'm (\w+)",
                r"my name is (\w+)",
                r"I am (\w+)"
            ]

            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    name = match.group(1)
                    dispatcher.utter_message(
                        text=f"¡Mucho gusto, {name}! Soy tu asistente de astrología. ¿En qué puedo ayudarte?"
                    )
                    return [SlotSet("name", name)]

            # If no name found, provide generic response
            dispatcher.utter_message(
                text="¡Mucho gusto! Soy tu asistente de astrología. ¿En qué puedo ayudarte?"
            )

        return []
