from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, EventType
import re
from datetime import datetime

class ActionExtractBookingDetails(Action):
    """Extract booking details from user input and store in slots"""
    
    def name(self) -> Text:
        return "action_extract_booking_details"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Get the latest user message
        latest_message = tracker.latest_message.get('text', '')
        entities = tracker.latest_message.get('entities', [])
        
        # Initialize slots if they don't exist
        slots_to_set = {}
        
        # Extract entities
        for entity in entities:
            entity_type = entity.get('entity')
            entity_value = entity.get('value')
            
            if entity_type == 'person_name':
                slots_to_set['name'] = entity_value
            elif entity_type == 'email_address':
                slots_to_set['email'] = entity_value
            elif entity_type == 'phone_number':
                slots_to_set['phone'] = entity_value
            elif entity_type == 'birth_date':
                slots_to_set['birth_date'] = entity_value
            elif entity_type == 'birth_place':
                slots_to_set['birth_place'] = entity_value
            elif entity_type == 'country_name':
                slots_to_set['country'] = entity_value
            elif entity_type == 'question_text':
                slots_to_set['question'] = entity_value
            elif entity_type == 'language_preference':
                slots_to_set['language'] = entity_value
        
        # Also try to extract from text using regex patterns
        if not slots_to_set.get('name'):
            name_match = re.search(r'(?:my name is|i\'m|i am|call me|i\'m called|i go by|i\'m known as)\s+([A-Za-z\s]+)', latest_message, re.IGNORECASE)
            if name_match:
                slots_to_set['name'] = name_match.group(1).strip()
        
        if not slots_to_set.get('email'):
            email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', latest_message)
            if email_match:
                slots_to_set['email'] = email_match.group(1)
        
        if not slots_to_set.get('phone'):
            phone_match = re.search(r'(\+\d{1,3}\s?\d{3,4}\s?\d{3,4}\s?\d{3,4})', latest_message)
            if phone_match:
                slots_to_set['phone'] = phone_match.group(1)
        
        if not slots_to_set.get('birth_date'):
            # Try different date formats
            date_patterns = [
                r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
                r'(\d{1,2}/\d{1,2}/\d{4})',  # MM/DD/YYYY
                r'(\d{1,2}-\d{1,2}-\d{4})',  # MM-DD-YYYY
                r'(born\s+on\s+)?(\d{1,2}\s+\w+\s+\d{4})',  # DD Month YYYY
            ]
            for pattern in date_patterns:
                date_match = re.search(pattern, latest_message, re.IGNORECASE)
                if date_match:
                    slots_to_set['birth_date'] = date_match.group(1) or date_match.group(2)
                    break
        
        if not slots_to_set.get('birth_place'):
            place_match = re.search(r'(?:born\s+in|in)\s+([A-Za-z\s,]+)', latest_message, re.IGNORECASE)
            if place_match:
                slots_to_set['birth_place'] = place_match.group(1).strip()
        
        if not slots_to_set.get('question'):
            question_match = re.search(r'(?:i want to know about|my question is about|i\'d like to explore|i want to understand|my focus is on|i\'m curious about|i want to learn about|my question is|i\'d like to know|i want to explore)\s+([^.!?]+)', latest_message, re.IGNORECASE)
            if question_match:
                slots_to_set['question'] = question_match.group(1).strip()
        
        # Set default language if not provided
        if not slots_to_set.get('language'):
            slots_to_set['language'] = 'en'
        
        return [SlotSet(key, value) for key, value in slots_to_set.items()]

class ActionValidateBookingDetails(Action):
    """Validate that all required booking details are present"""
    
    def name(self) -> Text:
        return "action_validate_booking_details"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Get current slot values
        name = tracker.get_slot('name')
        email = tracker.get_slot('email')
        birth_date = tracker.get_slot('birth_date')
        birth_place = tracker.get_slot('birth_place')
        question = tracker.get_slot('question')
        phone = tracker.get_slot('phone')
        language = tracker.get_slot('language')
        
        # Check what's missing
        missing_details = []
        if not name:
            missing_details.append("name")
        if not email:
            missing_details.append("email")
        if not birth_date:
            missing_details.append("birth date")
        if not birth_place:
            missing_details.append("birth place")
        if not question:
            missing_details.append("question or focus area")
        if not phone:
            missing_details.append("phone number")
        
        # Store missing details in slot
        return [SlotSet('missing_details', missing_details)]

class ActionAskForMissingDetails(Action):
    """Ask for missing booking details"""
    
    def name(self) -> Text:
        return "action_ask_for_missing_details"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        missing_details = tracker.get_slot('missing_details') or []
        
        if not missing_details:
            # All details are present, confirm booking
            dispatcher.utter_message(response="utter_confirm_booking_details")
        else:
            # Ask for missing details
            if len(missing_details) == 1:
                missing_field = missing_details[0]
                dispatcher.utter_message(response="utter_booking_almost_complete", missing_field=missing_field)
            else:
                missing_list = ", ".join(missing_details[:-1]) + f" and {missing_details[-1]}"
                dispatcher.utter_message(response="utter_ask_for_missing_details", missing_details=missing_list)
        
        return []
