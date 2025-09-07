# SoulPath Wellness - Advanced Chatbot Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the advanced, self-improving chatbot system as specified in the comprehensive specification document.

## Architecture Summary
- **Frontend**: Next.js with React components
- **Backend API**: Enhanced chat API with ML orchestration
- **Rasa NLU**: Intent recognition and entity extraction
- **OpenRouter**: Advanced language understanding and response generation
- **PostgreSQL**: Database with ML pipeline tables
- **ML Pipeline**: Continuous learning and model improvement

## Phase 1: Database Setup

### 1.1 Update Database Schema
```bash
cd frontend
npx prisma generate
npx prisma db push
```

### 1.2 Verify New Tables
The following ML-related tables should be created:
- `conversation_logs` - Stores all chat interactions
- `user_feedback` - User ratings and feedback
- `ml_model_performance` - Model evaluation metrics
- `ab_test_experiments` - A/B testing configuration
- `ab_test_assignments` - User assignments to test groups

## Phase 2: Rasa NLU Setup

### 2.1 Install Rasa Dependencies
```bash
cd frontend/rasa
pip install rasa[spacy]
python -m spacy download en_core_web_sm
```

### 2.2 Train Comprehensive Model
```bash
cd frontend/rasa
./train_comprehensive.sh
```

### 2.3 Start Rasa Server
```bash
# Start Rasa NLU server
rasa run --enable-api --cors "*" --port 5007 --model models/latest

# Start Rasa Actions server (in another terminal)
rasa run actions --port 5055
```

## Phase 3: Environment Configuration

### 3.1 Required Environment Variables
Add to `.env.local`:
```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Rasa Configuration
RASA_URL=http://localhost:5007

# Database Configuration (already exists)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
```

### 3.2 Get OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Create an account and get an API key
3. Add the key to your environment variables

## Phase 4: API Integration

### 4.1 Test New Advanced API
```bash
# Test the new advanced chat API
curl -X POST "http://localhost:3000/api/chat/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to book a reading with Jose",
    "userId": "test_user",
    "sessionId": "test_session"
  }'
```

### 4.2 Expected Response Format
```json
{
  "success": true,
  "response": "I'd love to help you book a reading with Jose Garfias! To get started, could you please tell me your name?",
  "buttons": [
    { "title": "Book a Reading", "payload": "book_reading" },
    { "title": "Learn More", "payload": "ask_package_info" }
  ],
  "bookingData": {
    "step": "collecting_details",
    "collectedDetails": {},
    "missingDetails": ["name", "email", "birthDate", "birthTime", "birthPlace", "question"]
  },
  "mlInsights": {
    "intent": "book_reading",
    "confidence": 0.95,
    "entities": [],
    "responseGenerator": "openrouter"
  }
}
```

## Phase 5: Frontend Integration

### 5.1 Update Chat Component
Update your existing chat component to use the new advanced API:

```typescript
// Example integration
const handleSendMessage = async (message: string) => {
  const response = await fetch('/api/chat/advanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      userId: currentUser?.id,
      sessionId: sessionId,
      bookingData: currentBookingData
    })
  });

  const data = await response.json();
  
  if (data.success) {
    // Update UI with response
    setMessages(prev => [...prev, {
      text: data.response,
      isBot: true,
      buttons: data.buttons,
      mlInsights: data.mlInsights
    }]);
    
    // Update booking state
    setBookingData(data.bookingData);
  }
};
```

### 5.2 Add Feedback Buttons
Add thumbs up/down buttons to each bot response:

```typescript
const FeedbackButtons = ({ conversationLogId }: { conversationLogId: number }) => {
  const handleFeedback = async (rating: 1 | 2) => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationLogId,
        sessionId: sessionId,
        rating
      })
    });
  };

  return (
    <div className="feedback-buttons">
      <button onClick={() => handleFeedback(2)}>👍</button>
      <button onClick={() => handleFeedback(1)}>👎</button>
    </div>
  );
};
```

## Phase 6: ML Pipeline Setup

### 6.1 Test ML Pipeline
```bash
# Trigger manual retraining
curl -X POST "http://localhost:3000/api/ml/retrain" \
  -H "Content-Type: application/json" \
  -d '{"triggerSource": "manual", "minNewDataPoints": 5}'
```

### 6.2 View Analytics
```bash
# Get performance analytics
curl "http://localhost:3000/api/analytics/performance?date_range=7"
```

### 6.3 Set Up Automated Retraining
Create a cron job or scheduled task to run retraining weekly:

```bash
# Add to crontab (runs every Sunday at 2 AM)
0 2 * * 0 curl -X POST "http://localhost:3000/api/ml/retrain" \
  -H "Content-Type: application/json" \
  -d '{"triggerSource": "scheduled", "minNewDataPoints": 20}'
```

## Phase 7: Testing and Validation

### 7.1 Test Scenarios
1. **Basic Booking Flow**:
   - "I want to book a reading"
   - Provide all details at once
   - Verify package selection works

2. **Natural Language Variations**:
   - "Can I schedule an astrology session?"
   - "I need help with my natal chart"
   - "I'd like to book with Jose"

3. **Chitchat Handling**:
   - "What is astrology?"
   - "Who is Jose Garfias?"
   - "How does this work?"

4. **Error Recovery**:
   - Provide invalid email
   - Give incomplete information
   - Test with gibberish input

### 7.2 Performance Monitoring
Monitor these key metrics:
- **NLU Accuracy**: Should be > 80%
- **Booking Success Rate**: Should be > 70%
- **User Satisfaction**: Should be > 85%
- **Response Time**: Should be < 2 seconds

## Phase 8: Production Deployment

### 8.1 Environment Setup
1. Set up production database
2. Configure production Rasa server
3. Set up OpenRouter API key
4. Configure monitoring and logging

### 8.2 Gradual Rollout
1. Start with 10% of traffic using A/B testing
2. Monitor performance metrics
3. Gradually increase traffic to new system
4. Keep old system as fallback

### 8.3 Monitoring Dashboard
Create a simple dashboard to monitor:
- Conversation volume
- Model performance
- User feedback
- A/B test results

## Troubleshooting

### Common Issues

1. **Rasa Server Not Starting**:
   ```bash
   # Check if port is available
   lsof -i :5007
   
   # Kill existing processes
   pkill -f "rasa run"
   
   # Restart server
   rasa run --enable-api --cors "*" --port 5007
   ```

2. **OpenRouter API Errors**:
   - Verify API key is correct
   - Check rate limits
   - Ensure proper headers

3. **Database Connection Issues**:
   - Verify DATABASE_URL
   - Check Prisma connection
   - Run `npx prisma db push`

4. **Model Training Failures**:
   - Check training data format
   - Verify Rasa installation
   - Check disk space

### Performance Optimization

1. **Caching**:
   - Cache Rasa responses
   - Cache package data
   - Use Redis for session storage

2. **Database Optimization**:
   - Add proper indexes
   - Optimize queries
   - Use connection pooling

3. **Response Time**:
   - Parallel API calls
   - Async processing
   - Response streaming

## Success Metrics

### Technical Metrics
- **Uptime**: > 99.9%
- **Response Time**: < 2 seconds
- **Error Rate**: < 1%
- **Model Accuracy**: > 85%

### Business Metrics
- **Booking Completion Rate**: > 75%
- **User Satisfaction**: > 90%
- **Conversation Length**: < 10 turns
- **Support Tickets**: < 5% of conversations

## Next Steps

1. **Week 1**: Complete Phase 1-3 (Database and Rasa setup)
2. **Week 2**: Complete Phase 4-5 (API and Frontend integration)
3. **Week 3**: Complete Phase 6-7 (ML Pipeline and Testing)
4. **Week 4**: Complete Phase 8 (Production deployment)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in the database
3. Monitor the analytics dashboard
4. Contact the development team

This implementation provides a robust, scalable, and continuously improving chatbot system that will significantly enhance the user experience for SoulPath Wellness bookings.
