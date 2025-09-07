# SoulPath Wellness Platform - Homepage Booking Flow

## Overview
The SoulPath Wellness Platform features an intelligent chatbot on the homepage that guides users through a flexible booking process for astrology readings with Jose Garfias. The system supports both natural language input and structured data collection.

## Architecture

### Components
- **Frontend**: Next.js application with React components
- **Chatbot API**: `/api/chat/simple/route.ts` - Main booking logic
- **Rasa Integration**: Optional AI-powered intent detection (bypassed for booking messages)
- **Database**: Prisma ORM with PostgreSQL
- **Package Management**: Dynamic package fetching and selection
- **Time Slot Management**: Integration with scheduling system

## Booking Flow States

### 1. Initial State
- **Trigger**: User visits homepage or clicks "Book Reading"
- **Detection**: Messages containing keywords: `book`, `reading`, `name`, `email`, `birth`, `phone`, `question`, `appointment`, `schedule`
- **Response**: System bypasses Rasa webhook and handles booking directly

### 2. Flexible Booking Collection
The system supports two approaches:

#### A. All Details at Once
**User Input Example:**
```
"I want to book a reading. My name is John Smith, email john@example.com, phone 555-1234, birth date January 15 1990, birth time 2:30 PM, birth place New York, my question is about my career and future prospects, language English"
```

**System Response:**
- Extracts all details using regex patterns
- Validates completeness
- Proceeds to package selection if all required details present
- Asks for missing details if incomplete

#### B. Step-by-Step Collection
**User Input Example:**
```
"I want to book a reading"
```

**System Response:**
- Prompts for required details one by one
- Maintains state between steps
- Validates each input before proceeding

### 3. Required Information

#### Personal Details
- **Name**: Full name of the client
- **Email**: Valid email address for communication
- **Phone**: Optional phone number with country code support
- **Birth Date**: Date of birth (multiple formats supported)
- **Birth Time**: Time of birth (HH:MM format)
- **Birth Place**: City and country of birth
- **Question**: Specific question or area of focus for the reading
- **Language**: Preferred language (English/Spanish)

#### Validation Rules
- **Email**: Standard email regex validation
- **Phone**: Country-specific format validation
- **Birth Date**: Multiple format support (YYYY-MM-DD, Month DD YYYY, etc.)
- **Birth Time**: 12-hour or 24-hour format support

### 4. Package Selection

#### Available Packages
- Fetched dynamically from `/api/packages?active=true`
- Each package includes:
  - Name and description
  - Duration (in minutes)
  - Price with currency
  - Session count
  - Active status

#### Selection Process
1. System displays available packages as buttons
2. User selects preferred package
3. System stores package selection
4. Proceeds to time slot selection

### 5. Time Slot Selection

#### Available Slots
- Fetched from scheduling system
- Filtered by:
  - Available dates
  - Package duration
  - User preferences

#### Selection Process
1. System displays available time slots
2. User selects preferred slot
3. System validates availability
4. Proceeds to booking confirmation

### 6. Booking Confirmation

#### Final Review
- Displays all collected information
- Shows selected package details
- Shows selected time slot
- Calculates total cost

#### Confirmation Process
1. User reviews all details
2. User confirms booking
3. System creates booking record
4. Sends confirmation email
5. Provides booking reference

## Technical Implementation

### API Endpoints

#### `/api/chat/simple`
**Method**: POST
**Purpose**: Main chatbot interface for booking flow
**Request Body**:
```json
{
  "message": "User message",
  "userId": "unique_user_id",
  "bookingData": {
    "step": "current_step",
    "collectedDetails": {},
    "missingDetails": []
  }
}
```

**Response**:
```json
{
  "success": true,
  "response": "Bot response text",
  "intent": "detected_intent",
  "confidence": 0.95,
  "entities": [],
  "buttons": [
    {
      "title": "Button Text",
      "payload": "button_action"
    }
  ],
  "bookingData": {
    "step": "next_step",
    "collectedDetails": {},
    "missingDetails": []
  }
}
```

#### `/api/packages`
**Method**: GET
**Purpose**: Fetch available packages
**Query Parameters**:
- `active=true`: Only active packages

#### `/api/schedule-slots`
**Method**: GET
**Purpose**: Fetch available time slots
**Query Parameters**:
- `date`: Specific date filter
- `duration`: Package duration filter

### Data Flow

1. **Message Processing**
   - Detect booking-related messages
   - Bypass Rasa webhook for booking messages
   - Extract details using regex patterns

2. **State Management**
   - Maintain booking state across messages
   - Track collected and missing details
   - Progress through booking steps

3. **Validation**
   - Validate each input field
   - Provide helpful error messages
   - Maintain data integrity

4. **Integration**
   - Fetch packages from database
   - Check time slot availability
   - Create booking records

### Error Handling

#### Common Error Scenarios
- **Invalid Email**: Prompt for valid email format
- **Invalid Phone**: Show country-specific format examples
- **Invalid Birth Date**: Provide format examples
- **Missing Details**: List specific missing information
- **Package Unavailable**: Show alternative packages
- **Time Slot Taken**: Refresh available slots

#### Error Recovery
- Maintain booking state during errors
- Provide clear error messages
- Offer alternative options
- Allow cancellation at any step

## User Experience Features

### Natural Language Support
- Accepts various input formats
- Handles typos and variations
- Supports multiple languages
- Context-aware responses

### Flexible Input
- All details at once or step-by-step
- Natural conversation flow
- Button-based navigation
- Easy cancellation

### Progress Indication
- Clear step indicators
- Summary of collected information
- Missing details highlighting
- Next step guidance

### Mobile Optimization
- Responsive button layout
- Touch-friendly interface
- Optimized for mobile keyboards
- Fast loading times

## Security Considerations

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

### Privacy
- Secure data transmission
- Minimal data collection
- User consent management
- Data retention policies

## Future Enhancements

### Planned Features
- Calendar integration
- Payment processing
- Email notifications
- SMS reminders
- Multi-language support
- Voice input support

### Scalability
- Microservices architecture
- Database optimization
- Caching strategies
- Load balancing
- Monitoring and analytics

## Troubleshooting

### Common Issues
1. **Booking Flow Resets**: Check state management and session handling
2. **Details Not Extracted**: Verify regex patterns and input validation
3. **Package Loading Fails**: Check database connection and API endpoints
4. **Time Slot Conflicts**: Implement real-time availability checking

### Debug Information
- Enable detailed logging
- Monitor API response times
- Track user interaction patterns
- Analyze error rates

## Conclusion

The SoulPath Wellness Platform's homepage booking flow provides a seamless, user-friendly experience for booking astrology readings. The flexible design accommodates various user preferences while maintaining data integrity and providing excellent user experience across all devices.
