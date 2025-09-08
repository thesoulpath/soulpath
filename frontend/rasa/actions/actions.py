from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, EventType
import requests
import json
import re
from datetime import datetime

class ActionFetchPackages(Action):
    """Fetch available packages from the API and display them in chat"""
    
    def name(self) -> Text:
        return "action_fetch_packages"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        try:
            # Get the base URL from environment or use localhost
            base_url = "http://localhost:3000"  # Adjust based on your setup
            
            # Fetch packages from the API
            response = requests.get(f"{base_url}/api/packages?active=true", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                packages = data.get('packages', [])
                
                if packages:
                    # Create a formatted message with packages
                    message = self.format_packages_message(packages)
                    dispatcher.utter_message(text=message)
                    
                    # Store packages in slot for potential follow-up actions
                    return [SlotSet('available_packages', json.dumps(packages))]
                else:
                    dispatcher.utter_message(text="I'm sorry, I couldn't find any available packages at the moment. Please try again later or contact us directly.")
            else:
                dispatcher.utter_message(text="I'm having trouble accessing our package information right now. Please try again in a moment or contact us directly.")
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching packages: {e}")
            dispatcher.utter_message(text="I'm experiencing technical difficulties accessing our packages. Please contact us directly for assistance.")
        except Exception as e:
            print(f"Unexpected error in action_fetch_packages: {e}")
            dispatcher.utter_message(text="Something went wrong while fetching packages. Please try again or contact us directly.")
        
        return []
    
    def format_packages_message(self, packages: List[Dict]) -> str:
        """Format packages into a readable message"""
        if not packages:
            return "No packages are currently available."
        
        message = "🌟 **Available Astrology Packages:**\n\n"
        
        for i, package in enumerate(packages, 1):
            name = package.get('name', 'Unknown Package')
            description = package.get('description', 'No description available')
            price = package.get('price', 0)
            currency = package.get('currency', '$')
            sessions = package.get('sessionsCount', 1)
            duration = package.get('duration', 60)
            is_popular = package.get('isPopular', False)
            
            # Format price
            price_text = f"{currency}{price:.0f}" if price > 0 else "Contact for pricing"
            
            # Add popular badge
            popular_badge = " ⭐ POPULAR" if is_popular else ""
            
            message += f"**{i}. {name}**{popular_badge}\n"
            message += f"   💰 Price: {price_text}\n"
            message += f"   📅 Sessions: {sessions}\n"
            message += f"   ⏱️ Duration: {duration} minutes each\n"
            message += f"   📝 {description}\n\n"
        
        message += "💫 **Ready to book?** Just let me know which package interests you, and I'll help you get started!"
        
        return message

class ActionFetchPackageDetails(Action):
    """Fetch detailed information about a specific package"""
    
    def name(self) -> Text:
        return "action_fetch_package_details"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        # Get package name or ID from entities or slots
        package_name = None
        package_id = None
        
        # Try to get from entities first
        entities = tracker.latest_message.get('entities', [])
        for entity in entities:
            if entity.get('entity') == 'package_name':
                package_name = entity.get('value')
                break
            elif entity.get('entity') == 'package_id':
                package_id = entity.get('value')
                break
        
        # Try to get from slots
        if not package_name and not package_id:
            package_name = tracker.get_slot('package_name')
            package_id = tracker.get_slot('package_id')
        
        if not package_name and not package_id:
            dispatcher.utter_message(text="I'd be happy to provide details about a specific package. Which package are you interested in?")
            return []
        
        try:
            # Fetch all packages and find the specific one
            base_url = "http://localhost:3000"
            response = requests.get(f"{base_url}/api/packages?active=true", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                packages = data.get('packages', [])
                
                # Find the specific package
                target_package = None
                if package_id:
                    target_package = next((p for p in packages if str(p.get('id')) == str(package_id)), None)
                elif package_name:
                    target_package = next((p for p in packages if package_name.lower() in p.get('name', '').lower()), None)
                
                if target_package:
                    message = self.format_package_details(target_package)
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(text=f"I couldn't find a package matching '{package_name or package_id}'. Let me show you all available packages instead.")
                    # Fall back to showing all packages
                    if packages:
                        message = self.format_packages_message(packages)
                        dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message(text="I'm having trouble accessing package details right now. Please try again later.")
                
        except Exception as e:
            print(f"Error fetching package details: {e}")
            dispatcher.utter_message(text="I'm experiencing technical difficulties. Please try again or contact us directly.")
        
        return []
    
    def format_package_details(self, package: Dict) -> str:
        """Format detailed package information"""
        name = package.get('name', 'Unknown Package')
        description = package.get('description', 'No description available')
        price = package.get('price', 0)
        currency = package.get('currency', '$')
        sessions = package.get('sessionsCount', 1)
        duration = package.get('duration', 60)
        package_type = package.get('packageType', 'Standard')
        max_group = package.get('maxGroupSize', 1)
        is_popular = package.get('isPopular', False)
        
        price_text = f"{currency}{price:.0f}" if price > 0 else "Contact for pricing"
        popular_badge = " ⭐ POPULAR" if is_popular else ""
        
        message = f"🌟 **{name}**{popular_badge}\n\n"
        message += f"📝 **Description:**\n{description}\n\n"
        message += f"💰 **Price:** {price_text}\n"
        message += f"📅 **Sessions:** {sessions}\n"
        message += f"⏱️ **Duration:** {duration} minutes per session\n"
        message += f"👥 **Type:** {package_type}\n"
        message += f"👥 **Max Group Size:** {max_group}\n\n"
        
        if is_popular:
            message += "⭐ This is one of our most popular packages!\n\n"
        
        message += "💫 **Ready to book this package?** Just let me know and I'll help you get started!"
        
        return message

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
            elif entity_type == 'package_name':
                slots_to_set['package_name'] = entity_value
            elif entity_type == 'package_id':
                slots_to_set['package_id'] = entity_value
        
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
