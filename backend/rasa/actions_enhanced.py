from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, AllSlotsReset
from datetime import datetime, timedelta
import re
import logging

logger = logging.getLogger(__name__)

class ActionBookingConfirmation(Action):
    """Action to confirm booking details and send confirmation"""
    
    def name(self) -> Text:
        return "action_booking_confirmation"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Get slots
        name = tracker.get_slot("name")
        birth_date = tracker.get_slot("birth_date")
        preferred_time = tracker.get_slot("preferred_time")
        session_type = tracker.get_slot("session_type")
        
        # Validate required information
        if not name:
            dispatcher.utter_message("Necesito tu nombre para completar la reserva. ¿Podrías proporcionármelo?")
            return []
        
        if not birth_date:
            dispatcher.utter_message("Para una lectura precisa, necesito tu fecha de nacimiento. ¿Cuándo naciste?")
            return []
        
        # Generate confirmation message
        confirmation_message = f"""
¡Perfecto! Resumiendo tu reserva:

👤 **Nombre**: {name}
📅 **Fecha de Nacimiento**: {birth_date}
⏰ **Horario Preferido**: {preferred_time or 'Por confirmar'}
🔮 **Tipo de Sesión**: {session_type or 'Carta Natal'}
💰 **Precio**: $80 USD

¿Confirmas esta reserva?
        """
        
        dispatcher.utter_message(confirmation_message)
        
        return []

class ActionSendBookingEmail(Action):
    """Action to send booking confirmation email"""
    
    def name(self) -> Text:
        return "action_send_booking_email"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Get slots
        name = tracker.get_slot("name")
        birth_date = tracker.get_slot("birth_date")
        preferred_time = tracker.get_slot("preferred_time")
        session_type = tracker.get_slot("session_type")
        
        # In a real implementation, you would send an email here
        # For now, we'll just log the booking details
        logger.info(f"Booking confirmed for {name} - {birth_date} - {preferred_time} - {session_type}")
        
        success_message = """
¡Excelente! Tu sesión ha sido confirmada. 

José se pondrá en contacto contigo en las próximas 24 horas para coordinar los detalles finales y confirmar el horario exacto.

📧 Recibirás un email de confirmación en breve.
📞 José te llamará para coordinar la sesión.

¡Gracias por elegir SoulPath Wellness! 🌟
        """
        
        dispatcher.utter_message(success_message)
        
        # Reset slots after successful booking
        return [AllSlotsReset()]

class ActionValidateBirthDate(Action):
    """Action to validate birth date format and calculate age"""
    
    def name(self) -> Text:
        return "action_validate_birth_date"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        birth_date = tracker.get_slot("birth_date")
        
        if not birth_date:
            return []
        
        # Try to parse different date formats
        date_formats = [
            "%d/%m/%Y",
            "%m/%d/%Y", 
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%m-%d-%Y"
        ]
        
        parsed_date = None
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(birth_date, fmt)
                break
            except ValueError:
                continue
        
        if not parsed_date:
            dispatcher.utter_message("No pude entender la fecha. ¿Podrías escribirla en formato DD/MM/AAAA? Por ejemplo: 15/03/1990")
            return [SlotSet("birth_date", None)]
        
        # Check if date is reasonable (not in future, not too old)
        today = datetime.now()
        age = today.year - parsed_date.year - ((today.month, today.day) < (parsed_date.month, parsed_date.day))
        
        if parsed_date > today:
            dispatcher.utter_message("La fecha de nacimiento no puede ser en el futuro. ¿Podrías verificar la fecha?")
            return [SlotSet("birth_date", None)]
        
        if age > 120:
            dispatcher.utter_message("La fecha parece ser incorrecta. ¿Podrías verificar tu fecha de nacimiento?")
            return [SlotSet("birth_date", None)]
        
        # Store the validated date
        validated_date = parsed_date.strftime("%d/%m/%Y")
        return [SlotSet("birth_date", validated_date)]

class ActionCalculatePricing(Action):
    """Action to calculate pricing based on session type"""
    
    def name(self) -> Text:
        return "action_calculate_pricing"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        session_type = tracker.get_slot("session_type")
        
        # Pricing based on session type
        pricing = {
            "carta natal": 80,
            "natal chart": 80,
            "consulta de relaciones": 60,
            "relationship consultation": 60,
            "crecimiento personal": 120,
            "personal growth": 120,
            "tarot": 40,
            "numerología": 60,
            "numerology": 60
        }
        
        price = pricing.get(session_type.lower() if session_type else "", 80)
        
        # Store the calculated price
        return [SlotSet("session_price", price)]

class ActionAskForMissingInfo(Action):
    """Action to ask for missing information in the booking process"""
    
    def name(self) -> Text:
        return "action_ask_for_missing_info"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        name = tracker.get_slot("name")
        birth_date = tracker.get_slot("birth_date")
        preferred_time = tracker.get_slot("preferred_time")
        
        missing_info = []
        
        if not name:
            missing_info.append("nombre")
        if not birth_date:
            missing_info.append("fecha de nacimiento")
        if not preferred_time:
            missing_info.append("horario preferido")
        
        if missing_info:
            if len(missing_info) == 1:
                message = f"Para completar tu reserva, necesito tu {missing_info[0]}. ¿Podrías proporcionármelo?"
            else:
                message = f"Para completar tu reserva, necesito: {', '.join(missing_info)}. ¿Podrías proporcionarme esta información?"
            
            dispatcher.utter_message(message)
        
        return []

class ActionGenerateBookingSummary(Action):
    """Action to generate a booking summary"""
    
    def name(self) -> Text:
        return "action_generate_booking_summary"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        name = tracker.get_slot("name")
        birth_date = tracker.get_slot("birth_date")
        preferred_time = tracker.get_slot("preferred_time")
        session_type = tracker.get_slot("session_type")
        session_price = tracker.get_slot("session_price")
        
        summary = f"""
📋 **RESUMEN DE RESERVA**

👤 **Cliente**: {name or 'Por confirmar'}
📅 **Fecha de Nacimiento**: {birth_date or 'Por confirmar'}
⏰ **Horario Preferido**: {preferred_time or 'Por confirmar'}
🔮 **Tipo de Sesión**: {session_type or 'Carta Natal'}
💰 **Precio**: ${session_price or 80} USD

¿Todo está correcto?
        """
        
        dispatcher.utter_message(summary)
        return []

class ActionCheckAvailability(Action):
    """Action to check available time slots"""
    
    def name(self) -> Text:
        return "action_check_availability"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # In a real implementation, you would check actual availability
        # For now, we'll return mock availability
        
        availability_message = """
📅 **HORARIOS DISPONIBLES ESTA SEMANA**

**Lunes**: 10:00 AM, 2:00 PM, 4:00 PM
**Martes**: 9:00 AM, 11:00 AM, 3:00 PM  
**Miércoles**: 10:00 AM, 1:00 PM, 5:00 PM
**Jueves**: 9:00 AM, 2:00 PM, 4:00 PM
**Viernes**: 11:00 AM, 3:00 PM, 5:00 PM

¿Cuál te conviene más?
        """
        
        dispatcher.utter_message(availability_message)
        return []
