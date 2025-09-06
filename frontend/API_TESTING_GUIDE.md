# 🧪 SoulPath API Testing Guide

## 📋 **Overview**

This guide provides comprehensive testing scenarios and examples for all refactored API endpoints. Use this guide to verify that all endpoints are working correctly with the new unified data model.

## 🔧 **Testing Setup**

### **Prerequisites**
- Development server running (`npm run dev`)
- Database connection configured
- Authentication tokens available (if testing protected endpoints)

### **Base URL**
```
http://localhost:3000/api
```

## 🧪 **Admin API Endpoints Testing**

### **1. Users Management** (`/api/admin/users/`)

#### **GET /api/admin/users**
```bash
# List all users
curl -X GET "http://localhost:3000/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/admin/users?email=user@example.com&status=active&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enhanced mode
curl -X GET "http://localhost:3000/api/admin/users?enhanced=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/users**
```bash
# Create new user
curl -X POST "http://localhost:3000/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "fullName": "New User",
    "phone": "+1234567890",
    "role": "user",
    "status": "active",
    "language": "en"
  }'
```

#### **PUT /api/admin/users**
```bash
# Update user
curl -X PUT "http://localhost:3000/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "user_id_here",
    "fullName": "Updated Name",
    "phone": "+1234567890",
    "status": "active"
  }'
```

#### **DELETE /api/admin/users**
```bash
# Delete user
curl -X DELETE "http://localhost:3000/api/admin/users?id=user_id_here" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **2. Purchases Management** (`/api/admin/purchases/`)

#### **GET /api/admin/purchases**
```bash
# List all purchases
curl -X GET "http://localhost:3000/api/admin/purchases" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/admin/purchases?userId=user_id&paymentStatus=completed&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/purchases**
```bash
# Create new purchase
curl -X POST "http://localhost:3000/api/admin/purchases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user_id_here",
    "packages": [
      {
        "packagePriceId": 1,
        "quantity": 2
      }
    ],
    "paymentMethod": "credit_card",
    "currencyCode": "USD",
    "transactionId": "txn_123456",
    "notes": "Test purchase"
  }'
```

### **3. Bookings Management** (`/api/admin/bookings/`)

#### **GET /api/admin/bookings**
```bash
# List all bookings
curl -X GET "http://localhost:3000/api/admin/bookings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/admin/bookings?userId=user_id&status=confirmed&dateFrom=2024-01-01&dateTo=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/bookings**
```bash
# Create new booking
curl -X POST "http://localhost:3000/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user_id_here",
    "userPackageId": 1,
    "scheduleSlotId": 1,
    "sessionType": "Individual Session",
    "notes": "Test booking"
  }'
```

### **4. Package Definitions** (`/api/admin/package-definitions/`)

#### **GET /api/admin/package-definitions**
```bash
# List all package definitions
curl -X GET "http://localhost:3000/api/admin/package-definitions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/package-definitions**
```bash
# Create new package definition
curl -X POST "http://localhost:3000/api/admin/package-definitions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Premium Package",
    "description": "Premium session package",
    "sessionsCount": 10,
    "sessionDurationId": 1,
    "packageType": "premium",
    "maxGroupSize": 3,
    "isActive": true
  }'
```

### **5. Package Prices** (`/api/admin/package-prices/`)

#### **GET /api/admin/package-prices**
```bash
# List all package prices
curl -X GET "http://localhost:3000/api/admin/package-prices" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/package-prices**
```bash
# Create new package price
curl -X POST "http://localhost:3000/api/admin/package-prices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "packageDefinitionId": 1,
    "currencyId": 1,
    "price": 299.99,
    "pricingMode": "fixed",
    "isActive": true
  }'
```

### **6. Schedule Templates** (`/api/admin/schedule-templates/`)

#### **GET /api/admin/schedule-templates**
```bash
# List all schedule templates
curl -X GET "http://localhost:3000/api/admin/schedule-templates" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/schedule-templates**
```bash
# Create new schedule template
curl -X POST "http://localhost:3000/api/admin/schedule-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dayOfWeek": "Monday",
    "startTime": "09:00",
    "endTime": "17:00",
    "capacity": 3,
    "isAvailable": true,
    "sessionDurationId": 1,
    "autoAvailable": true
  }'
```

### **7. Schedule Slots** (`/api/admin/schedule-slots/`)

#### **GET /api/admin/schedule-slots**
```bash
# List all schedule slots
curl -X GET "http://localhost:3000/api/admin/schedule-slots" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/schedule-slots**
```bash
# Create new schedule slot
curl -X POST "http://localhost:3000/api/admin/schedule-slots" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scheduleTemplateId": 1,
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T10:00:00Z",
    "capacity": 3,
    "bookedCount": 0,
    "isAvailable": true
  }'
```

### **8. User Packages** (`/api/admin/user-packages/`)

#### **GET /api/admin/user-packages**
```bash
# List all user packages
curl -X GET "http://localhost:3000/api/admin/user-packages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/admin/user-packages**
```bash
# Create new user package
curl -X POST "http://localhost:3000/api/admin/user-packages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user_id_here",
    "purchaseId": 1,
    "packagePriceId": 1,
    "quantity": 1,
    "sessionsUsed": 0,
    "isActive": true
  }'
```

## 🧪 **Client API Endpoints Testing**

### **1. User Profile** (`/api/client/me/`)

#### **GET /api/client/me**
```bash
# Get user profile
curl -X GET "http://localhost:3000/api/client/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **PUT /api/client/me**
```bash
# Update user profile
curl -X PUT "http://localhost:3000/api/client/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fullName": "Updated Name",
    "phone": "+1234567890",
    "birthDate": "1990-01-01",
    "language": "en"
  }'
```

### **2. Client Bookings** (`/api/client/bookings/`)

#### **GET /api/client/bookings**
```bash
# Get user bookings
curl -X GET "http://localhost:3000/api/client/bookings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/client/bookings?status=upcoming&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/client/bookings**
```bash
# Create new booking
curl -X POST "http://localhost:3000/api/client/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scheduleSlotId": 1,
    "userPackageId": 1,
    "sessionType": "Individual Session",
    "notes": "Test booking"
  }'
```

### **3. Available Packages** (`/api/client/packages/`)

#### **GET /api/client/packages**
```bash
# Get available packages
curl -X GET "http://localhost:3000/api/client/packages" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/client/packages?currency=USD&packageType=premium" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **4. User Packages** (`/api/client/my-packages/`)

#### **GET /api/client/my-packages**
```bash
# Get user packages
curl -X GET "http://localhost:3000/api/client/my-packages" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/client/my-packages?isActive=true&hasRemainingSessions=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 **Testing Scenarios**

### **Scenario 1: Complete Purchase Flow**
1. Create a user
2. Create package definitions and prices
3. Create a purchase with user packages
4. Create schedule templates and slots
5. Create a booking using the user package
6. Verify all relationships are correct

### **Scenario 2: Booking Management**
1. Create multiple bookings for a user
2. Update booking status (confirmed → completed)
3. Cancel a booking and verify session restoration
4. Delete a booking and verify cleanup

### **Scenario 3: Package Management**
1. Create package definitions with different session counts
2. Create package prices in different currencies
3. Assign packages to users through purchases
4. Track session usage and remaining sessions

### **Scenario 4: Schedule Management**
1. Create schedule templates for different days
2. Generate schedule slots from templates
3. Book sessions and verify capacity management
4. Update slot availability and capacity

## 🔍 **Expected Response Formats**

### **Success Response**
```json
{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid data provided",
  "details": [...]
}
```

## 🚨 **Common Issues & Solutions**

### **Authentication Errors**
- Ensure proper Bearer token is included
- Verify token has correct permissions (admin vs user)

### **Validation Errors**
- Check required fields are provided
- Verify data types match expected format
- Ensure foreign key relationships exist

### **Database Errors**
- Verify database connection
- Check if required tables exist
- Ensure proper indexes are in place

## 📊 **Performance Testing**

### **Load Testing**
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X GET "http://localhost:3000/api/admin/users" &
done
wait
```

### **Response Time Monitoring**
```bash
# Measure response time
time curl -X GET "http://localhost:3000/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ **Testing Checklist**

- [ ] All GET endpoints return proper data
- [ ] All POST endpoints create records correctly
- [ ] All PUT endpoints update records properly
- [ ] All DELETE endpoints remove records safely
- [ ] Pagination works correctly
- [ ] Filtering works as expected
- [ ] Error handling is consistent
- [ ] Authentication is enforced
- [ ] Data validation is working
- [ ] Relationships are maintained correctly

## 🎯 **Next Steps**

1. **Run all test scenarios** to verify functionality
2. **Update frontend components** to use new APIs
3. **Implement comprehensive testing** in your test suite
4. **Deploy to staging** for further validation
5. **Monitor performance** in production

---

**Note**: This testing guide assumes you have proper authentication tokens and database access. Adjust the examples based on your specific setup and requirements.
