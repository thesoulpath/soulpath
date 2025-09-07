#!/bin/bash

# Rasa Monitoring and Analytics Script
# This script provides comprehensive monitoring and analytics for Rasa models

set -e

# Configuration
RASA_URL="${RASA_URL:-http://localhost:5005}"
RASA_DIR="${RASA_DIR:-./rasa}"
RESULTS_DIR="${RESULTS_DIR:-./monitoring_results}"
LOG_FILE="${LOG_FILE:-rasa_monitoring.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to check Rasa server health
check_rasa_health() {
    log "Checking Rasa server health..."
    
    if curl -s --max-time 10 "$RASA_URL/health" > /dev/null 2>&1; then
        success "Rasa server is healthy"
        
        # Get detailed health information
        local health_data=$(curl -s --max-time 10 "$RASA_URL/health")
        echo "$health_data" > "$RESULTS_DIR/health_check_$(date +%Y%m%d_%H%M%S).json"
        
        return 0
    else
        error "Rasa server is not responding"
        return 1
    fi
}

# Function to get model information
get_model_info() {
    log "Getting model information..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Get current model
    if curl -s --max-time 10 "$RASA_URL/model" > "$RESULTS_DIR/model_info_$timestamp.json"; then
        success "Model information saved"
    else
        error "Failed to get model information"
    fi
    
    # Get available models
    if curl -s --max-time 10 "$RASA_URL/models" > "$RESULTS_DIR/available_models_$timestamp.json"; then
        success "Available models information saved"
    else
        warning "Failed to get available models"
    fi
}

# Function to test NLU performance
test_nlu_performance() {
    log "Testing NLU performance..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local test_dir="$RESULTS_DIR/nlu_test_$timestamp"
    
    mkdir -p "$test_dir"
    
    if [ -f "$RASA_DIR/data/nlu.yml" ]; then
        if command -v rasa > /dev/null 2>&1; then
            cd "$RASA_DIR"
            if rasa test nlu --data data/nlu.yml --model models/ --out "$test_dir" --errors "$test_dir/errors.json" 2>&1 | tee -a "$LOG_FILE"; then
                success "NLU performance test completed"
            else
                error "NLU performance test failed"
            fi
            cd - > /dev/null
        else
            warning "Rasa command not found, skipping NLU test"
        fi
    else
        warning "NLU data file not found at $RASA_DIR/data/nlu.yml"
    fi
}

# Function to test Core performance
test_core_performance() {
    log "Testing Core performance..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local test_dir="$RESULTS_DIR/core_test_$timestamp"
    
    mkdir -p "$test_dir"
    
    if [ -f "$RASA_DIR/data/stories.yml" ]; then
        if command -v rasa > /dev/null 2>&1; then
            cd "$RASA_DIR"
            if rasa test core --stories data/stories.yml --model models/ --out "$test_dir" 2>&1 | tee -a "$LOG_FILE"; then
                success "Core performance test completed"
            else
                error "Core performance test failed"
            fi
            cd - > /dev/null
        else
            warning "Rasa command not found, skipping Core test"
        fi
    else
        warning "Stories data file not found at $RASA_DIR/data/stories.yml"
    fi
}

# Function to run cross-validation
run_cross_validation() {
    log "Running cross-validation..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local cv_dir="$RESULTS_DIR/cross_validation_$timestamp"
    
    mkdir -p "$cv_dir"
    
    if [ -f "$RASA_DIR/data/nlu.yml" ]; then
        if command -v rasa > /dev/null 2>&1; then
            cd "$RASA_DIR"
            if rasa test nlu --data data/nlu.yml --model models/ --cross-validation --out "$cv_dir" 2>&1 | tee -a "$LOG_FILE"; then
                success "Cross-validation completed"
            else
                error "Cross-validation failed"
            fi
            cd - > /dev/null
        else
            warning "Rasa command not found, skipping cross-validation"
        fi
    else
        warning "NLU data file not found at $RASA_DIR/data/nlu.yml"
    fi
}

# Function to generate performance report
generate_performance_report() {
    log "Generating performance report..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="$RESULTS_DIR/performance_report_$timestamp.md"
    
    cat > "$report_file" << EOF
# Rasa Performance Report
Generated: $(date)

## Server Health
EOF

    if check_rasa_health; then
        echo "- ✅ Rasa server is healthy" >> "$report_file"
    else
        echo "- ❌ Rasa server is not responding" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## Model Information
- Model directory: $RASA_DIR/models/
- Results directory: $RESULTS_DIR/

## Test Results
EOF

    # Add NLU test results if available
    local latest_nlu_test=$(ls -t "$RESULTS_DIR"/nlu_test_* 2>/dev/null | head -1)
    if [ -n "$latest_nlu_test" ]; then
        echo "- NLU Test: $latest_nlu_test" >> "$report_file"
        if [ -f "$latest_nlu_test/intent_report.json" ]; then
            echo "  - Intent classification results available" >> "$report_file"
        fi
        if [ -f "$latest_nlu_test/response_selection_report.json" ]; then
            echo "  - Response selection results available" >> "$report_file"
        fi
    fi

    # Add Core test results if available
    local latest_core_test=$(ls -t "$RESULTS_DIR"/core_test_* 2>/dev/null | head -1)
    if [ -n "$latest_core_test" ]; then
        echo "- Core Test: $latest_core_test" >> "$report_file"
        if [ -f "$latest_core_test/story_report.json" ]; then
            echo "  - Story prediction results available" >> "$report_file"
        fi
    fi

    # Add cross-validation results if available
    local latest_cv=$(ls -t "$RESULTS_DIR"/cross_validation_* 2>/dev/null | head -1)
    if [ -n "$latest_cv" ]; then
        echo "- Cross-Validation: $latest_cv" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## Recommendations
1. Monitor model performance regularly
2. Retrain models when accuracy drops below 90%
3. Update training data based on real user interactions
4. Test new configurations before deploying to production

## Files Generated
EOF

    ls -la "$RESULTS_DIR" >> "$report_file"

    success "Performance report generated: $report_file"
}

# Function to monitor real-time performance
monitor_realtime() {
    log "Starting real-time monitoring..."
    
    local duration=${1:-60} # Default 60 seconds
    local interval=${2:-5}  # Default 5 seconds
    
    log "Monitoring for $duration seconds with $interval second intervals..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    
    while [ $(date +%s) -lt $end_time ]; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        local remaining=$((duration - elapsed))
        
        echo -e "${PURPLE}[$elapsed/$duration]${NC} Monitoring... ($remaining seconds remaining)"
        
        # Check health
        if curl -s --max-time 5 "$RASA_URL/health" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Server healthy"
        else
            echo -e "  ${RED}✗${NC} Server unhealthy"
        fi
        
        # Test a simple message
        local test_response=$(curl -s --max-time 5 -X POST "$RASA_URL/webhooks/rest/webhook" \
            -H "Content-Type: application/json" \
            -d '{"sender": "monitor", "message": "test"}' 2>/dev/null)
        
        if [ -n "$test_response" ]; then
            echo -e "  ${GREEN}✓${NC} Message processing working"
        else
            echo -e "  ${RED}✗${NC} Message processing failed"
        fi
        
        sleep "$interval"
    done
    
    success "Real-time monitoring completed"
}

# Function to clean old results
cleanup_old_results() {
    local days=${1:-7} # Default 7 days
    
    log "Cleaning up results older than $days days..."
    
    find "$RESULTS_DIR" -type f -name "*.json" -mtime +$days -delete 2>/dev/null || true
    find "$RESULTS_DIR" -type d -name "nlu_test_*" -mtime +$days -exec rm -rf {} + 2>/dev/null || true
    find "$RESULTS_DIR" -type d -name "core_test_*" -mtime +$days -exec rm -rf {} + 2>/dev/null || true
    find "$RESULTS_DIR" -type d -name "cross_validation_*" -mtime +$days -exec rm -rf {} + 2>/dev/null || true
    
    success "Cleanup completed"
}

# Function to show help
show_help() {
    cat << EOF
Rasa Monitoring and Analytics Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  health              Check Rasa server health
  model-info          Get model information
  test-nlu            Test NLU performance
  test-core           Test Core performance
  cross-validation    Run cross-validation
  report              Generate performance report
  monitor [duration] [interval]  Real-time monitoring
  cleanup [days]      Clean up old results
  all                 Run all tests and generate report
  help                Show this help message

Options:
  duration            Duration for real-time monitoring (seconds, default: 60)
  interval            Interval for real-time monitoring (seconds, default: 5)
  days                Days to keep results (default: 7)

Environment Variables:
  RASA_URL            Rasa server URL (default: http://localhost:5005)
  RASA_DIR            Rasa directory (default: ./rasa)
  RESULTS_DIR         Results directory (default: ./monitoring_results)
  LOG_FILE            Log file (default: rasa_monitoring.log)

Examples:
  $0 health
  $0 all
  $0 monitor 120 10
  $0 cleanup 14
  RASA_URL=http://rasa.example.com:5005 $0 all

EOF
}

# Main script logic
main() {
    local command=${1:-help}
    
    case "$command" in
        health)
            check_rasa_health
            ;;
        model-info)
            get_model_info
            ;;
        test-nlu)
            test_nlu_performance
            ;;
        test-core)
            test_core_performance
            ;;
        cross-validation)
            run_cross_validation
            ;;
        report)
            generate_performance_report
            ;;
        monitor)
            local duration=${2:-60}
            local interval=${3:-5}
            monitor_realtime "$duration" "$interval"
            ;;
        cleanup)
            local days=${2:-7}
            cleanup_old_results "$days"
            ;;
        all)
            log "Running comprehensive Rasa monitoring..."
            check_rasa_health
            get_model_info
            test_nlu_performance
            test_core_performance
            run_cross_validation
            generate_performance_report
            success "Comprehensive monitoring completed"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
