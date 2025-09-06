#!/bin/bash

# 🧪 SoulPath Basic API Testing Script
# This script runs basic connectivity tests without authentication

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"

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
            echo "Response preview: $(echo "$response_body" | head -c 100)..."
        else
            log_error "$test_name - Expected: $expected_status, Got: $status_code"
            echo "Response: $response_body"
        fi
    else
        log_error "$test_name - Request failed"
    fi
    
    echo ""
}

echo "🧪 Starting SoulPath Basic API Tests"
echo "===================================="
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
echo "🔍 Testing Endpoint Availability"
echo "================================"

# Test basic endpoint availability (these should return 401 without auth, but confirm endpoints exist)
run_test "Test admin users endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users'" \
    "401"

run_test "Test admin purchases endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/purchases'" \
    "401"

run_test "Test admin bookings endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/bookings'" \
    "401"

run_test "Test admin package-definitions endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/package-definitions'" \
    "401"

run_test "Test admin package-prices endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/package-prices'" \
    "401"

run_test "Test admin schedule-templates endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/schedule-templates'" \
    "401"

run_test "Test admin schedule-slots endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/schedule-slots'" \
    "401"

run_test "Test admin user-packages endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/user-packages'" \
    "401"

run_test "Test client me endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/me'" \
    "401"

run_test "Test client bookings endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/bookings'" \
    "401"

run_test "Test client packages endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/packages'" \
    "401"

run_test "Test client my-packages endpoint exists" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/my-packages'" \
    "401"

echo ""
echo "🔍 Testing Public Endpoints"
echo "==========================="

# Test any public endpoints that might exist
run_test "Test root API endpoint" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL'" \
    "404"

# Test other potential public endpoints
run_test "Test auth endpoint" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/auth'" \
    "404"

run_test "Test content endpoint" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/content'" \
    "404"

echo ""
echo "🔍 Testing HTTP Methods"
echo "======================="

# Test that endpoints respond to different HTTP methods appropriately
run_test "Test admin users with POST (should be 401 or 405)" \
    "curl -s -w '%{http_code}' -X POST '$BASE_URL/admin/users'" \
    "401"

run_test "Test admin users with PUT (should be 401 or 405)" \
    "curl -s -w '%{http_code}' -X PUT '$BASE_URL/admin/users'" \
    "401"

run_test "Test admin users with DELETE (should be 401 or 405)" \
    "curl -s -w '%{http_code}' -X DELETE '$BASE_URL/admin/users'" \
    "401"

echo ""
echo "🔍 Testing Query Parameters"
echo "==========================="

# Test that endpoints handle query parameters correctly
run_test "Test admin users with pagination params" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users?page=1&limit=10'" \
    "401"

run_test "Test admin users with filter params" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users?status=active&email=test@example.com'" \
    "401"

run_test "Test admin users with enhanced mode" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users?enhanced=true'" \
    "401"

echo ""
echo "🔍 Testing Content-Type Headers"
echo "==============================="

# Test that endpoints handle content-type headers correctly
run_test "Test admin users with JSON content-type" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users' -H 'Content-Type: application/json'" \
    "401"

run_test "Test admin users with XML content-type" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/users' -H 'Content-Type: application/xml'" \
    "401"

echo ""
echo "📊 Performance Testing"
echo "====================="

log_info "Testing response time for admin users endpoint"
time curl -s -X GET "$BASE_URL/admin/users" > /dev/null

log_info "Testing concurrent requests"
for i in {1..5}; do
    curl -s -X GET "$BASE_URL/admin/users" > /dev/null &
done
wait
log_success "Concurrent requests completed"

echo ""
echo "🔍 Testing Error Handling"
echo "========================="

# Test invalid endpoints
run_test "Test non-existent endpoint" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/non-existent'" \
    "404"

run_test "Test invalid admin endpoint" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/admin/invalid'" \
    "404"

run_test "Test invalid client endpoint" \
    "curl -s -w '%{http_code}' -X GET '$BASE_URL/client/invalid'" \
    "404"

echo ""
echo "📋 Test Summary"
echo "==============="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "✅ All API endpoints are responding correctly"
    echo "🔐 Authentication is properly enforced (401 responses)"
    echo "🚀 Server is running and accessible"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
    echo ""
    echo "💡 Next steps:"
    echo "1. Check if the development server is running"
    echo "2. Verify API routes are properly configured"
    echo "3. Check for any middleware issues"
    exit 1
fi
