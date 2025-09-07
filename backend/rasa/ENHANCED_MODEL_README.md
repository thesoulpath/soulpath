# Enhanced Rasa Model for Wellness Astrology Chatbot

## 🚀 Model Improvements Overview

This enhanced Rasa model includes significant improvements over the basic version:

### ✨ Key Enhancements

1. **Advanced NLP Pipeline with spaCy Integration**
   - SpacyTokenizer for better text tokenization
   - SpacyFeaturizer for enhanced text features
   - SpacyEntityExtractor for improved entity recognition
   - Enhanced DIET classifier with better parameters

2. **Comprehensive Training Data**
   - 200+ training examples (vs. 20+ in basic version)
   - Bilingual support (Spanish/English)
   - Rich entity annotations
   - Diverse conversation patterns

3. **Advanced Conversation Management**
   - 15+ conversation stories
   - Complex multi-turn dialogues
   - Better context handling
   - Enhanced fallback mechanisms

4. **Custom Actions & Advanced Features**
   - Sentiment analysis
   - Booking validation
   - Availability checking
   - Pricing information
   - User information management

5. **Improved Domain Configuration**
   - 8 new intents
   - 8 new entities
   - 15+ response variations
   - Slot management
   - Rules-based flows

## 📊 Model Performance Improvements

| Metric | Basic Model | Enhanced Model | Improvement |
|--------|-------------|----------------|-------------|
| Training Examples | ~20 | 200+ | 10x |
| Intents | 8 | 13 | 62% |
| Entities | 2 | 8 | 300% |
| Stories | 7 | 15+ | 114% |
| Response Variations | 7 | 15+ | 114% |
| Language Support | English | Bilingual | 100% |

## 🛠️ Installation & Setup

### Prerequisites
```bash
# Install spaCy Spanish model
python -m spacy download es_core_news_sm

# Install additional dependencies
pip install -r actions_requirements.txt
```

### Training the Enhanced Model
```bash
# Make training script executable
chmod +x train_enhanced_model.sh

# Run enhanced training
./train_enhanced_model.sh
```

### Running the Model
```bash
# Start Rasa server
rasa run --model models/ --enable-api --cors "*" --port 5005

# Start actions server (in separate terminal)
rasa run actions --port 5055
```

## 🎯 New Features

### 1. Enhanced Intent Recognition
- **ask_session_types**: Inquiries about available services
- **ask_pricing**: Price and cost information
- **ask_availability**: Schedule and availability
- **ask_contact**: Contact information requests
- **ask_help**: General help requests

### 2. Advanced Entity Extraction
- **date**: Date expressions (mañana, el viernes, 15 de marzo)
- **time**: Time expressions (3pm, las 3pm, 15:30)
- **session_type**: Service types (astrología, tarot, numerología)
- **price**: Price mentions
- **location**: Location references
- **phone**: Phone numbers
- **email**: Email addresses

### 3. Custom Actions
- **ActionDefaultFallback**: Intelligent fallback handling
- **ActionExtractAstrologyInfo**: Astrology-specific processing
- **ActionBookSessionForm**: Structured booking form
- **ActionCheckAvailability**: Real-time availability checking
- **ActionGetPricing**: Dynamic pricing information
- **ActionSentimentAnalysis**: User sentiment detection
- **ActionValidateBooking**: Booking validation
- **ActionSaveUserInfo**: User information management

### 4. Bilingual Support
- Spanish and English training examples
- Context-aware language detection
- Culturally appropriate responses

## 📈 Performance Monitoring

### Model Validation
```bash
# Validate training data
rasa data validate --domain domain.yml --data data/ --config config.yml

# Test model performance
rasa test --model models/ --stories data/test_stories.yml --nlu data/test_nlu.yml
```

### Key Metrics to Monitor
- Intent classification accuracy
- Entity extraction precision
- Response time
- User satisfaction
- Conversation completion rate

## 🔧 Configuration Details

### Enhanced Pipeline Components
```yaml
pipeline:
- name: SpacyTokenizer
  model: "es_core_news_sm"
- name: SpacyFeaturizer
  model: "es_core_news_sm"
- name: DIETClassifier
  epochs: 150
  learning_rate: 0.001
  hidden_layers_sizes:
    text: [256, 128]
    label: [256, 128]
  dropout: 0.2
```

### Advanced Policies
```yaml
policies:
- name: TEDPolicy
  max_history: 8
  epochs: 150
  learning_rate: 0.001
- name: AugmentedMemoizationPolicy
  max_history: 8
  lookup_table: ["greet", "goodbye", "book_session"]
```

## 🚀 Deployment Recommendations

### Production Settings
1. **Model Optimization**: Use `--optimize` flag for production
2. **Caching**: Enable response caching for better performance
3. **Monitoring**: Set up logging and metrics collection
4. **Scaling**: Use multiple workers for high traffic

### Docker Deployment
```dockerfile
# Enhanced Dockerfile with spaCy
FROM python:3.10-slim
RUN pip install spacy==3.6.1 rasa==3.6.21
RUN python -m spacy download es_core_news_sm
```

## 📝 Usage Examples

### Basic Conversation
```
User: Hola, quiero agendar una cita
Bot: ¡Hola! Soy tu asistente de astrología y bienestar. ¿En qué puedo ayudarte hoy?
Bot: ¡Me encantaría ayudarte a agendar una sesión con José Garfias! ¿Qué tipo de lectura te interesa?
```

### Complex Booking Flow
```
User: Qué servicios ofrecen?
Bot: Ofrecemos varios tipos de sesiones: 📿 Astrología y carta natal, 🔮 Lectura de tarot, 🔢 Numerología, 🧘 Meditación guiada, 💆 Terapia holística, y 🎯 Coaching espiritual. ¿Cuál te interesa más?

User: Cuánto cuesta la astrología?
Bot: Nuestras tarifas varían según el tipo de sesión: Consultas astrológicas desde $50, lecturas de tarot desde $40, numerología desde $45, y sesiones de meditación desde $35. ¿Te interesa algún servicio específico?

User: Me interesa agendar una consulta de astrología
Bot: ¡Perfecto! ¿Te gustaría agendar una sesión de astrología, tarot, numerología o meditación?
```

## 🔍 Troubleshooting

### Common Issues
1. **spaCy Model Not Found**: Run `python -m spacy download es_core_news_sm`
2. **Low Intent Confidence**: Increase training examples or adjust thresholds
3. **Entity Extraction Issues**: Check entity annotations in training data
4. **Action Server Errors**: Verify endpoints.yml configuration

### Performance Optimization
1. **Reduce Model Size**: Use `--optimize` during training
2. **Improve Response Time**: Enable caching and use faster hardware
3. **Better Accuracy**: Add more training examples and fine-tune parameters

## 📚 Next Steps

1. **Continuous Learning**: Collect user interactions for model improvement
2. **A/B Testing**: Test different response variations
3. **Integration**: Connect with booking systems and databases
4. **Analytics**: Implement conversation analytics and insights
5. **Multimodal**: Add support for images, voice, and other media types

## 🤝 Contributing

To improve the model further:
1. Add more training examples
2. Enhance entity recognition
3. Improve conversation flows
4. Add new custom actions
5. Optimize performance

---

**Model Version**: Enhanced v2.0  
**Last Updated**: $(date)  
**Rasa Version**: 3.6.21  
**spaCy Version**: 3.6.1
