#!/bin/bash

# Redis Setup Script for Full-Page Scroll Website
# This script helps set up Redis for both localhost and Vercel

echo "🔴 Redis Setup for Full-Page Scroll Website"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Redis Cloud URL
REDIS_URL="redis://default:ZJWP2BAecQigeygptCB4onqGyPYJovlH@redis-12183.c16.us-east-1-3.ec2.redns.redis-cloud.com:12183"

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

# Check if .env.local exists
setup_local_env() {
    print_status "Setting up local environment..."

    if [ ! -f ".env.local" ]; then
        touch .env.local
        print_success "Created .env.local file"
    else
        print_warning ".env.local already exists"
    fi

    # Check if Redis URL is already in .env.local
    if grep -q "REDIS_URL" .env.local; then
        print_warning "Redis URL already configured in .env.local"
    else
        echo "REDIS_URL=\"$REDIS_URL\"" >> .env.local
        print_success "Added Redis URL to .env.local"
    fi

    # Add other common local environment variables
    if ! grep -q "DATABASE_URL" .env.local; then
        echo 'DATABASE_URL="postgresql://localhost:5432/full_page_scroll_website"' >> .env.local
        echo 'JWT_SECRET="local-development-secret"' >> .env.local
        echo 'NEXTAUTH_SECRET="local-nextauth-secret"' >> .env.local
        echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env.local
        print_success "Added additional local environment variables"
    fi
}

# Test Redis connection
test_redis_connection() {
    print_status "Testing Redis connection..."

    if command -v node &> /dev/null; then
        if npm run redis:check &> /dev/null; then
            print_success "Redis connection test passed!"
        else
            print_error "Redis connection test failed"
            print_status "Make sure Redis is running or check your Redis URL"
        fi
    else
        print_warning "Node.js not found, skipping Redis test"
    fi
}

# Vercel CLI setup
setup_vercel_cli() {
    print_status "Setting up Vercel CLI..."

    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI already installed"
    fi

    # Check if project is linked
    if [ ! -d ".vercel" ]; then
        print_status "Linking project to Vercel..."
        vercel link
    else
        print_success "Project already linked to Vercel"
    fi
}

# Add Vercel environment variables
setup_vercel_env() {
    print_status "Setting up Vercel environment variables..."

    print_status "Adding Redis URL to Vercel..."
    echo "$REDIS_URL" | vercel env add REDIS_URL production

    print_status "You can add additional environment variables:"
    print_status "- DATABASE_URL: Your PostgreSQL connection string"
    print_status "- JWT_SECRET: Generate a secure random string"
    print_status "- NEXTAUTH_SECRET: Generate a secure random string"
    print_status "- NEXTAUTH_URL: https://your-domain.vercel.app"
}

# Manual setup instructions
show_manual_instructions() {
    print_status "Manual setup instructions:"
    echo ""
    echo "For Vercel Dashboard:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > Environment Variables"
    echo "4. Add: REDIS_URL = $REDIS_URL"
    echo ""
    echo "For Local Development:"
    echo "1. Create .env.local file"
    echo "2. Add: REDIS_URL=\"$REDIS_URL\""
    echo ""
}

# Main menu
show_menu() {
    echo ""
    echo "Choose your setup method:"
    echo "1) 🚀 Automated setup (Local + Vercel CLI)"
    echo "2) 🏠 Local development only"
    echo "3) 🌐 Vercel production only"
    echo "4) 📋 Show manual instructions"
    echo "5) 🧪 Test Redis connection"
    echo "6) ❌ Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
}

# Main script logic
main() {
    echo "Welcome to Redis Setup for Full-Page Scroll Website!"
    echo ""

    while true; do
        show_menu

        case $choice in
            1)
                print_status "Starting automated setup..."
                setup_local_env
                test_redis_connection
                setup_vercel_cli
                setup_vercel_env
                print_success "Automated setup completed!"
                break
                ;;
            2)
                print_status "Setting up local development..."
                setup_local_env
                test_redis_connection
                print_success "Local setup completed!"
                break
                ;;
            3)
                print_status "Setting up Vercel production..."
                setup_vercel_cli
                setup_vercel_env
                print_success "Vercel setup completed!"
                break
                ;;
            4)
                show_manual_instructions
                break
                ;;
            5)
                test_redis_connection
                ;;
            6)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please select 1-6."
                ;;
        esac
    done

    echo ""
    print_success "Redis setup process completed!"
    echo ""
    print_status "Next steps:"
    echo "- For local development: npm run dev"
    echo "- For production deployment: npm run vercel:setup"
    echo "- Test Redis: npm run redis:check"
    echo "- Monitor performance: npm run perf:monitor"
}

# Run main function
main "$@"
