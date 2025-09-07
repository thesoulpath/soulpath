#!/bin/bash

# Meta WhatsApp Business API CLI Setup Script
# This script automates the setup of WhatsApp Business API integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Python is available
check_python() {
    if command_exists python3; then
        PYTHON_CMD="python3"
    elif command_exists python; then
        PYTHON_CMD="python"
    else
        print_error "Python is not installed. Please install Python 3.7+ and try again."
        exit 1
    fi
    print_success "Python found: $PYTHON_CMD"
}

# Function to install Python dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    
    if command_exists pip3; then
        PIP_CMD="pip3"
    elif command_exists pip; then
        PIP_CMD="pip"
    else
        print_error "pip is not installed. Please install pip and try again."
        exit 1
    fi
    
    $PIP_CMD install requests aiohttp sanic
    print_success "Dependencies installed successfully"
}

# Function to create Meta app
create_meta_app() {
    print_status "Creating Meta App configuration..."
    
    echo "To create a Meta App:"
    echo "1. Go to https://developers.facebook.com/"
    echo "2. Click 'My Apps' → 'Create App'"
    echo "3. Choose 'Business' as app type"
    echo "4. Fill in app details and create"
    echo "5. Add 'WhatsApp' product to your app"
    echo ""
    
    read -p "Enter your Meta App ID: " META_APP_ID
    read -p "Enter your Meta App Secret: " META_APP_SECRET
    read -p "Enter your Meta Access Token: " META_ACCESS_TOKEN
    
    if [ -z "$META_APP_ID" ] || [ -z "$META_APP_SECRET" ] || [ -z "$META_ACCESS_TOKEN" ]; then
        print_error "All Meta credentials are required"
        exit 1
    fi
    
    # Save credentials to environment file
    cat > rasa/.env << EOF
# Meta App Credentials
META_ACCESS_TOKEN=$META_ACCESS_TOKEN
META_APP_ID=$META_APP_ID
META_APP_SECRET=$META_APP_SECRET

# WhatsApp Business API Credentials (will be filled by setup script)
WHATSAPP_ACCESS_TOKEN=$META_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_WEBHOOK_URL=https://your-domain.com/webhooks/whatsapp/webhook

# Rasa Configuration
RASA_URL=http://localhost:5005
RASA_MODEL=rasa
RASA_CONFIDENCE_THRESHOLD=0.7

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=1000

# Logging Configuration
LOGGING_ENABLED=true
LOGGING_LEVEL=info
LOGGING_STORAGE=console
EOF
    
    print_success "Meta App credentials saved"
}

# Function to run the Python setup script
run_python_setup() {
    print_status "Running Meta WhatsApp setup script..."
    
    cd rasa
    $PYTHON_CMD ../setup-meta-whatsapp.py --interactive
    cd ..
    
    print_success "Meta WhatsApp setup completed"
}

# Function to test the integration
test_integration() {
    print_status "Testing WhatsApp integration..."
    
    if [ -f "rasa/.env" ]; then
        cd rasa
        $PYTHON_CMD ../test-whatsapp-integration.py
        cd ..
    else
        print_error "No .env file found. Please run setup first."
        exit 1
    fi
}

# Function to start Rasa with WhatsApp
start_rasa() {
    print_status "Starting Rasa with WhatsApp integration..."
    
    if [ -f "rasa/.env" ]; then
        ./start-whatsapp-rasa.sh
    else
        print_error "No .env file found. Please run setup first."
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Meta WhatsApp Business API CLI Setup"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Run complete setup wizard"
    echo "  test      - Test the WhatsApp integration"
    echo "  start     - Start Rasa with WhatsApp integration"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # Run interactive setup"
    echo "  $0 test     # Test the integration"
    echo "  $0 start    # Start Rasa server"
}

# Main script logic
main() {
    echo "🚀 Meta WhatsApp Business API CLI Setup"
    echo "======================================"
    echo ""
    
    case "${1:-setup}" in
        "setup")
            print_status "Starting Meta WhatsApp setup wizard..."
            check_python
            install_dependencies
            create_meta_app
            run_python_setup
            print_success "Setup completed successfully!"
            echo ""
            echo "Next steps:"
            echo "1. Configure your webhook URL in Meta Business Manager"
            echo "2. Test the integration: $0 test"
            echo "3. Start Rasa: $0 start"
            ;;
        "test")
            check_python
            test_integration
            ;;
        "start")
            start_rasa
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
