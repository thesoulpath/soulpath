# Rasa Monitoring & ML Model Tuning Guide

This guide covers how to monitor Rasa statistics, evaluate model performance, and tune ML models for optimal results.

## 📊 Table of Contents

1. [Real-time Monitoring](#real-time-monitoring)
2. [Model Performance Evaluation](#model-performance-evaluation)
3. [ML Model Tuning](#ml-model-tuning)
4. [Analytics Dashboard](#analytics-dashboard)
5. [Automated Monitoring Scripts](#automated-monitoring-scripts)
6. [Troubleshooting](#troubleshooting)

## 🔍 Real-time Monitoring

### 1. Rasa Server Health Check

```bash
# Check if Rasa server is running
curl http://localhost:5005/health

# Get server status and version
curl http://localhost:5005/status
```

### 2. Model Information

```bash
# Get current model info
curl http://localhost:5005/model

# List available models
curl http://localhost:5005/models
```

### 3. Live Conversation Monitoring

```bash
# Monitor logs in real-time
docker logs -f rasa_container_name

# Or with docker-compose
docker-compose logs -f rasa
```

## 📈 Model Performance Evaluation

### 1. NLU Model Testing

```bash
# Test NLU model with test data
rasa test nlu --data data/nlu.yml --model models/ --out results/

# Test with specific model
rasa test nlu --data data/nlu.yml --model models/nlu-20250906-160155-amicable-rasp.tar.gz

# Generate detailed evaluation report
rasa test nlu --data data/nlu.yml --model models/ --out results/ --errors errors.json
```

### 2. Core Model Testing

```bash
# Test conversation flows
rasa test core --stories data/stories.yml --model models/

# Test with domain
rasa test core --stories data/stories.yml --domain domain.yml --model models/
```

### 3. Cross-Validation

```bash
# 5-fold cross-validation for NLU
rasa test nlu --data data/nlu.yml --model models/ --cross-validation

# Cross-validation with specific folds
rasa test nlu --data data/nlu.yml --model models/ --cross-validation --folds 3
```

## 🎯 ML Model Tuning

### 1. Pipeline Optimization

#### High Precision Configuration (Slower)
```yaml
# config.yml
pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
    case_sensitive: false
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 5  # Increased from 3
  - name: DIETClassifier
    epochs: 200   # Increased from 50
    entity_recognition: true
    intent_classification: true
    use_masked_language_model: true
    constrain_similarities: true
    model_confidence: softmax
    random_seed: 42
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 200   # Increased from 50
    constrain_similarities: true
    retrieval_intent: chitchat/ask_name
    use_gpu: false
```

#### High Speed Configuration (Less Precise)
```yaml
# config.yml
pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
    case_sensitive: false
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 2  # Reduced from 3
  - name: DIETClassifier
    epochs: 20    # Reduced from 50
    entity_recognition: true
    intent_classification: true
    use_masked_language_model: false
    constrain_similarities: false
    model_confidence: softmax
    random_seed: 42
```

### 2. Policy Tuning

#### Conservative Policy (More Reliable)
```yaml
policies:
  - name: MemoizationPolicy
    max_history: 5  # Increased from 3
  - name: RulePolicy
  - name: UnexpecTEDIntentPolicy
    max_history: 5  # Increased from 3
    epochs: 100     # Increased from 50
    use_gpu: false
  - name: TEDPolicy
    max_history: 5  # Increased from 3
    epochs: 100     # Increased from 50
    constrain_similarities: true
    use_gpu: false
    model_confidence: softmax
    random_seed: 42
```

#### Aggressive Policy (Faster Learning)
```yaml
policies:
  - name: MemoizationPolicy
    max_history: 2  # Reduced from 3
  - name: RulePolicy
  - name: UnexpecTEDIntentPolicy
    max_history: 2  # Reduced from 3
    epochs: 20      # Reduced from 50
    use_gpu: false
  - name: TEDPolicy
    max_history: 2  # Reduced from 3
    epochs: 20      # Reduced from 50
    constrain_similarities: false
    use_gpu: false
    model_confidence: softmax
    random_seed: 42
```

## 📊 Analytics Dashboard

### 1. Conversation Statistics

```bash
# Get conversation stats from database
psql -d your_database -c "
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_conversations,
  AVG(processing_time) as avg_processing_time,
  COUNT(CASE WHEN intent = 'agendar_cita' THEN 1 END) as booking_attempts
FROM conversation_logs 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
"
```

### 2. Intent Performance Analysis

```bash
# Analyze intent accuracy
psql -d your_database -c "
SELECT 
  intent,
  COUNT(*) as total_occurrences,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_predictions,
  ROUND(
    COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*), 2
  ) as accuracy_percentage,
  AVG(processing_time) as avg_processing_time
FROM conversation_logs 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY intent
ORDER BY total_occurrences DESC;
"
```

### 3. Error Analysis

```bash
# Find most common errors
psql -d your_database -c "
SELECT 
  error_type,
  error_message,
  COUNT(*) as error_count,
  MAX(timestamp) as last_occurrence
FROM conversation_logs 
WHERE success = false 
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY error_type, error_message
ORDER BY error_count DESC
LIMIT 10;
"
```

## 🤖 Automated Monitoring Scripts

### 1. Model Performance Monitor

Create `scripts/monitor-rasa-performance.sh`:

```bash
#!/bin/bash

# Rasa Performance Monitoring Script
# Monitors model performance and generates reports

echo "🔍 Starting Rasa performance monitoring..."

# Set variables
RASA_URL="http://localhost:5005"
MODEL_PATH="models/"
RESULTS_DIR="monitoring_results"
DATE=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p $RESULTS_DIR

# 1. Health Check
echo "📊 Checking Rasa server health..."
curl -s $RASA_URL/health > $RESULTS_DIR/health_check_$DATE.json

# 2. Model Information
echo "🤖 Getting model information..."
curl -s $RASA_URL/model > $RESULTS_DIR/model_info_$DATE.json

# 3. Test NLU Performance
echo "🧪 Testing NLU performance..."
rasa test nlu --data data/nlu.yml --model $MODEL_PATH --out $RESULTS_DIR/nlu_test_$DATE/

# 4. Test Core Performance
echo "🎯 Testing Core performance..."
rasa test core --stories data/stories.yml --model $MODEL_PATH --out $RESULTS_DIR/core_test_$DATE/

# 5. Generate Performance Report
echo "📈 Generating performance report..."
python3 scripts/generate_performance_report.py $RESULTS_DIR $DATE

echo "✅ Performance monitoring completed!"
echo "📁 Results saved in: $RESULTS_DIR/"
```

### 2. Model Comparison Tool

Create `scripts/compare-models.sh`:

```bash
#!/bin/bash

# Model Comparison Script
# Compares different model configurations

echo "🔄 Starting model comparison..."

# Models to compare
MODELS=("models/nlu-20250906-160155-amicable-rasp.tar.gz" "models/latest")

for model in "${MODELS[@]}"; do
    echo "Testing model: $model"
    
    # Test NLU
    rasa test nlu --data data/nlu.yml --model $model --out comparison_results/$(basename $model .tar.gz)/
    
    # Test Core
    rasa test core --stories data/stories.yml --model $model --out comparison_results/$(basename $model .tar.gz)/
done

echo "✅ Model comparison completed!"
```

## 🔧 Interactive Model Tuning

### 1. Interactive Learning

```bash
# Start interactive learning session
rasa interactive

# With specific model
rasa interactive --model models/your_model.tar.gz

# With debug mode
rasa interactive --debug
```

### 2. Model Shell Testing

```bash
# Test model interactively
rasa shell --model models/your_model.tar.gz

# Test NLU only
rasa shell nlu --model models/your_model.tar.gz
```

### 3. Data Validation

```bash
# Validate training data
rasa data validate

# Validate domain
rasa domain validate

# Validate with specific files
rasa data validate --data data/nlu.yml --domain domain.yml
```

## 📊 Performance Metrics to Monitor

### 1. NLU Metrics
- **Intent Accuracy**: Percentage of correctly predicted intents
- **Entity F1-Score**: Entity recognition performance
- **Confidence Distribution**: Distribution of prediction confidence scores
- **Processing Time**: Time taken for NLU processing

### 2. Core Metrics
- **Story Accuracy**: Percentage of correctly predicted conversation flows
- **Action Accuracy**: Percentage of correctly predicted actions
- **Fallback Rate**: Percentage of conversations that hit fallback
- **Average Turn Length**: Average number of turns per conversation

### 3. System Metrics
- **Response Time**: End-to-end response time
- **Memory Usage**: RAM consumption during processing
- **CPU Usage**: CPU utilization during processing
- **Error Rate**: Percentage of failed requests

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Low Intent Accuracy**
   - Increase training data diversity
   - Adjust confidence threshold
   - Tune DIETClassifier parameters

2. **High Processing Time**
   - Reduce n-gram range
   - Decrease epochs
   - Use simpler pipeline

3. **Memory Issues**
   - Reduce max_history
   - Use smaller batch sizes
   - Enable model compression

4. **Poor Entity Recognition**
   - Add more entity examples
   - Tune RegexFeaturizer
   - Adjust DIETClassifier entity parameters

## 📈 Continuous Improvement

### 1. A/B Testing
- Deploy multiple model versions
- Compare performance metrics
- Gradually roll out best performing model

### 2. Data Collection
- Log all conversations
- Collect user feedback
- Identify failure patterns

### 3. Regular Retraining
- Schedule weekly model retraining
- Monitor performance degradation
- Update training data based on real usage

## 🎯 Best Practices

1. **Start Simple**: Begin with basic pipeline, then optimize
2. **Monitor Continuously**: Set up automated monitoring
3. **Test Thoroughly**: Use cross-validation and test sets
4. **Document Changes**: Keep track of configuration changes
5. **Backup Models**: Always backup working models before changes
6. **User Feedback**: Incorporate user feedback into training data

---

For more detailed information, refer to the [Rasa Documentation](https://rasa.com/docs/rasa/) and your project's specific configuration files.
