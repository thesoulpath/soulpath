#!/bin/bash

echo "🧪 SoulPath API Testing"
echo "======================"
echo "Base URL: http://localhost:3000/api"
echo ""

# Test counters
total=0
passed=0
failed=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    ((total++))
    echo "Testing: $name"
    
    # Make the request and capture status code
    response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS - Expected: $expected_status, Got: $status_code"
        ((passed++))
    else
        echo "❌ FAIL - Expected: $expected_status, Got: $status_code"
        echo "Response: $response_body"
        ((failed++))
    fi
    echo ""
}

echo "🔍 Testing Admin Endpoints"
echo "=========================="

test_endpoint "Admin Users" "http://localhost:3000/api/admin/users" "401"
test_endpoint "Admin Purchases" "http://localhost:3000/api/admin/purchases" "401"
test_endpoint "Admin Bookings" "http://localhost:3000/api/admin/bookings" "401"
test_endpoint "Admin Package Definitions" "http://localhost:3000/api/admin/package-definitions" "401"
test_endpoint "Admin Package Prices" "http://localhost:3000/api/admin/package-prices" "401"
test_endpoint "Admin Schedule Templates" "http://localhost:3000/api/admin/schedule-templates" "401"
test_endpoint "Admin Schedule Slots" "http://localhost:3000/api/admin/schedule-slots" "401"
test_endpoint "Admin User Packages" "http://localhost:3000/api/admin/user-packages" "401"

echo "🔍 Testing Client Endpoints"
echo "==========================="

test_endpoint "Client Me" "http://localhost:3000/api/client/me" "401"
test_endpoint "Client Bookings" "http://localhost:3000/api/client/bookings" "401"
test_endpoint "Client Packages" "http://localhost:3000/api/client/packages" "401"
test_endpoint "Client My Packages" "http://localhost:3000/api/client/my-packages" "401"

echo "🔍 Testing Public Endpoints"
echo "==========================="

test_endpoint "Health Check" "http://localhost:3000/api/health" "200"
test_endpoint "Content" "http://localhost:3000/api/content" "404"
test_endpoint "Schedules" "http://localhost:3000/api/schedules" "404"

echo "🔍 Testing Query Parameters"
echo "==========================="

test_endpoint "Admin Users with Pagination" "http://localhost:3000/api/admin/users?page=1&limit=10" "401"
test_endpoint "Admin Users with Filters" "http://localhost:3000/api/admin/users?status=active" "401"
test_endpoint "Admin Users Enhanced Mode" "http://localhost:3000/api/admin/users?enhanced=true" "401"

echo "🔍 Testing HTTP Methods"
echo "======================="

# Test POST method
response=$(curl -s -w "%{http_code}" -X POST "http://localhost:3000/api/admin/users" 2>/dev/null)
status_code="${response: -3}"
if [ "$status_code" = "401" ] || [ "$status_code" = "405" ]; then
    echo "✅ PASS - POST admin/users: $status_code"
    ((passed++))
else
    echo "❌ FAIL - POST admin/users: Expected 401/405, Got: $status_code"
    ((failed++))
fi
((total++))

# Test PUT method
response=$(curl -s -w "%{http_code}" -X PUT "http://localhost:3000/api/admin/users" 2>/dev/null)
status_code="${response: -3}"
if [ "$status_code" = "401" ] || [ "$status_code" = "405" ]; then
    echo "✅ PASS - PUT admin/users: $status_code"
    ((passed++))
else
    echo "❌ FAIL - PUT admin/users: Expected 401/405, Got: $status_code"
    ((failed++))
fi
((total++))

# Test DELETE method
response=$(curl -s -w "%{http_code}" -X DELETE "http://localhost:3000/api/admin/users" 2>/dev/null)
status_code="${response: -3}"
if [ "$status_code" = "401" ] || [ "$status_code" = "405" ]; then
    echo "✅ PASS - DELETE admin/users: $status_code"
    ((passed++))
else
    echo "❌ FAIL - DELETE admin/users: Expected 401/405, Got: $status_code"
    ((failed++))
fi
((total++))

echo ""
echo "🔍 Testing Error Handling"
echo "========================="

test_endpoint "Non-existent Endpoint" "http://localhost:3000/api/non-existent" "404"
test_endpoint "Invalid Admin Endpoint" "http://localhost:3000/api/admin/invalid" "404"
test_endpoint "Invalid Client Endpoint" "http://localhost:3000/api/client/invalid" "404"

echo ""
echo "📊 Performance Testing"
echo "====================="

echo "Testing response time..."
time curl -s "http://localhost:3000/api/health" > /dev/null

echo "Testing concurrent requests..."
for i in {1..5}; do
    curl -s "http://localhost:3000/api/health" > /dev/null &
done
wait
echo "✅ Concurrent requests completed"

echo ""
echo "📋 Test Summary"
echo "==============="
echo "Total Tests: $total"
echo "Passed: $passed"
echo "Failed: $failed"

if [ $failed -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed!"
    echo "✅ All API endpoints are responding correctly"
    echo "🔐 Authentication is properly enforced"
    echo "🚀 Server is running and accessible"
    exit 0
else
    echo ""
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi
