#!/bin/bash

# 🧪 SoulPath API Testing Script
# This script runs all tests from the API_TESTING_GUIDE.md

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN_HERE"  # Replace with actual admin token
USER_TOKEN="YOUR_USER_TOKEN_HERE"    # Replace with actual user token

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_status="$3"
    
    ((TOTAL_TESTS++))
    log_info "Running test: $test_name"
    
    # Run the curl command and capture output
    local response
    local status_code
    
    if response=$(eval "$curl_command" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" = "$expected_status" ]; then
            log_success "$test_name - Status: $status_code"
            echo "Response: $response_body" | head -c 200
            echo "..."
        else
            log_error "$test_name - Expected: $expected_status, Got: $status_code"
            echo "Response: $response_body"
        fi
    else
        log_error "$test_name - Request failed"
    fi
    
    echo ""
}

# Test data storage
USER_ID=""
PURCHASE_ID=""
PACKAGE_DEFINITION_ID=""
PACKAGE_PRICE_ID=""
SCHEDULE_TEMPLATE_ID=""
SCHEDULE_SLOT_ID=""
USER_PACKAGE_ID=""
BOOKING_ID=""

echo "🧪 Starting SoulPath API Tests"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Check if server is running
log_info "Checking if server is running..."
if ! curl -s "$BASE_URL" > /dev/null; then
    log_error "Server is not running at $BASE_URL"
    log_info "Please start the development server with: npm run dev"
    exit 1
fi
log_success "Server is running"

echo ""
echo "🔐 Testing Authentication"
echo "========================"

# Test authentication endpoints
run_test "Test admin authentication" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

run_test "Test user authentication" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/me' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

echo ""
echo "👥 Admin API Tests - Users Management"
echo "====================================="

# GET /api/admin/users
run_test "List all users" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

run_test "List users with filters" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users?status=active&page=1&limit=5' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

run_test "List users in enhanced mode" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users?enhanced=true' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/users
run_test "Create new user" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/users' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"email\":\"testuser@example.com\",\"fullName\":\"Test User\",\"phone\":\"+1234567890\",\"role\":\"user\",\"status\":\"active\",\"language\":\"en\"}'" \
    "201"

# Store user ID for later tests (you'll need to extract this from the response)
USER_ID="test_user_id"  # This should be extracted from the create response

echo ""
echo "🛒 Admin API Tests - Purchases Management"
echo "========================================="

# GET /api/admin/purchases
run_test "List all purchases" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/purchases' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

run_test "List purchases with filters" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/purchases?paymentStatus=completed&page=1&limit=5' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/purchases
run_test "Create new purchase" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/purchases' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"userId\":\"$USER_ID\",\"packages\":[{\"packagePriceId\":1,\"quantity\":2}],\"paymentMethod\":\"credit_card\",\"currencyCode\":\"USD\",\"transactionId\":\"txn_test_123\",\"notes\":\"Test purchase\"}'" \
    "201"

echo ""
echo "📅 Admin API Tests - Bookings Management"
echo "========================================"

# GET /api/admin/bookings
run_test "List all bookings" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/bookings' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

run_test "List bookings with filters" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/bookings?status=confirmed&dateFrom=2024-01-01&dateTo=2024-12-31' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/bookings
run_test "Create new booking" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/bookings' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"userId\":\"$USER_ID\",\"userPackageId\":1,\"scheduleSlotId\":1,\"sessionType\":\"Individual Session\",\"notes\":\"Test booking\"}'" \
    "201"

echo ""
echo "📦 Admin API Tests - Package Definitions"
echo "========================================"

# GET /api/admin/package-definitions
run_test "List all package definitions" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/package-definitions' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/package-definitions
run_test "Create new package definition" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/package-definitions' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"name\":\"Premium Package\",\"description\":\"Premium session package\",\"sessionsCount\":10,\"sessionDurationId\":1,\"packageType\":\"premium\",\"maxGroupSize\":3,\"isActive\":true}'" \
    "201"

echo ""
echo "💰 Admin API Tests - Package Prices"
echo "==================================="

# GET /api/admin/package-prices
run_test "List all package prices" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/package-prices' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/package-prices
run_test "Create new package price" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/package-prices' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"packageDefinitionId\":1,\"currencyId\":1,\"price\":299.99,\"pricingMode\":\"fixed\",\"isActive\":true}'" \
    "201"

echo ""
echo "📋 Admin API Tests - Schedule Templates"
echo "======================================="

# GET /api/admin/schedule-templates
run_test "List all schedule templates" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/schedule-templates' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/schedule-templates
run_test "Create new schedule template" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/schedule-templates' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"dayOfWeek\":\"Monday\",\"startTime\":\"09:00\",\"endTime\":\"17:00\",\"capacity\":3,\"isAvailable\":true,\"sessionDurationId\":1,\"autoAvailable\":true}'" \
    "201"

echo ""
echo "⏰ Admin API Tests - Schedule Slots"
echo "==================================="

# GET /api/admin/schedule-slots
run_test "List all schedule slots" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/schedule-slots' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/schedule-slots
run_test "Create new schedule slot" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/schedule-slots' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"scheduleTemplateId\":1,\"startTime\":\"2024-01-15T09:00:00Z\",\"endTime\":\"2024-01-15T10:00:00Z\",\"capacity\":3,\"bookedCount\":0,\"isAvailable\":true}'" \
    "201"

echo ""
echo "🎁 Admin API Tests - User Packages"
echo "=================================="

# GET /api/admin/user-packages
run_test "List all user packages" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/user-packages' -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# POST /api/admin/user-packages
run_test "Create new user package" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/user-packages' -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"userId\":\"$USER_ID\",\"purchaseId\":1,\"packagePriceId\":1,\"quantity\":1,\"sessionsUsed\":0,\"isActive\":true}'" \
    "201"

echo ""
echo "👤 Client API Tests - User Profile"
echo "=================================="

# GET /api/client/me
run_test "Get user profile" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/me' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

# PUT /api/client/me
run_test "Update user profile" \
    "curl -s -w '%{http_code}' -X PUT '$BASE_URL/client/me' -H 'Content-Type: application/json' -H 'Authorization: Bearer $USER_TOKEN' -d '{\"fullName\":\"Updated Name\",\"phone\":\"+1234567890\",\"birthDate\":\"1990-01-01\",\"language\":\"en\"}'" \
    "200"

echo ""
echo "📅 Client API Tests - Client Bookings"
echo "====================================="

# GET /api/client/bookings
run_test "Get user bookings" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/bookings' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

run_test "Get user bookings with filters" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/bookings?status=upcoming&page=1&limit=5' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

# POST /api/client/bookings
run_test "Create new booking" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/client/bookings' -H 'Content-Type: application/json' -H 'Authorization: Bearer $USER_TOKEN' -d '{\"scheduleSlotId\":1,\"userPackageId\":1,\"sessionType\":\"Individual Session\",\"notes\":\"Test booking\"}'" \
    "201"

echo ""
echo "📦 Client API Tests - Available Packages"
echo "========================================"

# GET /api/client/packages
run_test "Get available packages" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/packages' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

run_test "Get packages with filters" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/packages?currency=USD&packageType=premium' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

echo ""
echo "🎁 Client API Tests - User Packages"
echo "==================================="

# GET /api/client/my-packages
run_test "Get user packages" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/my-packages' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

run_test "Get user packages with filters" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/my-packages?isActive=true&hasRemainingSessions=true' -H 'Authorization: Bearer $USER_TOKEN'" \
    "200"

echo ""
echo "🧪 Testing Scenarios"
echo "==================="

log_info "Testing Scenario 1: Complete Purchase Flow"
# This would require setting up the full flow with proper IDs
log_warning "Scenario tests require proper setup with actual IDs from previous responses"

log_info "Testing Scenario 2: Booking Management"
log_warning "Scenario tests require proper setup with actual IDs from previous responses"

log_info "Testing Scenario 3: Package Management"
log_warning "Scenario tests require proper setup with actual IDs from previous responses"

log_info "Testing Scenario 4: Schedule Management"
log_warning "Scenario tests require proper setup with actual IDs from previous responses"

echo ""
echo "📊 Performance Testing"
echo "====================="

log_info "Testing response time for users endpoint"
time curl -s -X GET "$BASE_URL/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

log_info "Testing concurrent requests"
for i in {1..5}; do
    curl -s -X GET "$BASE_URL/admin/users" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null &
done
wait
log_success "Concurrent requests completed"

echo ""
echo "📋 Test Summary"
echo "==============="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi
