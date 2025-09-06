# 🎨 SoulPath Frontend Integration Guide

## 📋 **Overview**

This guide provides step-by-step instructions for updating your frontend components to work with the newly refactored API endpoints. The main changes involve replacing email-based relationships with user ID-based relationships and updating API endpoint URLs.

## 🔄 **Key Changes Summary**

### **1. User Identification**
- **Before**: Used `clientEmail` for user identification
- **After**: Use `userId` (CUID/UUID) for user identification

### **2. API Endpoint Changes**
- **Before**: `/api/admin/clients/` → **After**: `/api/admin/users/`
- **Before**: `/api/admin/schedules/` → **After**: `/api/admin/schedule-templates/` and `/api/admin/schedule-slots/`
- **Before**: `/api/admin/soul-packages/` → **After**: `/api/admin/package-definitions/` and `/api/admin/package-prices/`

### **3. Response Format Changes**
- **Before**: Direct data objects
- **After**: Wrapped in `{ success: true, data: {...} }` format

## 🔧 **Step-by-Step Integration**

### **Step 1: Update User Management Components**

#### **Before (Old Pattern)**
```typescript
// Old client management
const fetchClients = async () => {
  const response = await fetch('/api/admin/clients');
  const clients = await response.json();
  return clients;
};

const createClient = async (clientData) => {
  const response = await fetch('/api/admin/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: clientData.email,
      name: clientData.name,
      // ... other fields
    })
  });
  return await response.json();
};
```

#### **After (New Pattern)**
```typescript
// New user management
const fetchUsers = async () => {
  const response = await fetch('/api/admin/users');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const createUser = async (userData) => {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      fullName: userData.fullName, // Note: changed from 'name'
      // ... other fields
    })
  });
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};
```

### **Step 2: Update Booking Management Components**

#### **Before (Old Pattern)**
```typescript
// Old booking management
const fetchBookings = async (clientEmail) => {
  const response = await fetch(`/api/admin/bookings?clientEmail=${clientEmail}`);
  const bookings = await response.json();
  return bookings;
};

const createBooking = async (bookingData) => {
  const response = await fetch('/api/admin/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientEmail: bookingData.clientEmail,
      scheduleSlotId: bookingData.scheduleSlotId,
      // ... other fields
    })
  });
  return await response.json();
};
```

#### **After (New Pattern)**
```typescript
// New booking management
const fetchBookings = async (userId) => {
  const response = await fetch(`/api/admin/bookings?userId=${userId}`);
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const createBooking = async (bookingData) => {
  const response = await fetch('/api/admin/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: bookingData.userId, // Note: changed from clientEmail
      userPackageId: bookingData.userPackageId,
      scheduleSlotId: bookingData.scheduleSlotId,
      // ... other fields
    })
  });
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};
```

### **Step 3: Update Package Management Components**

#### **Before (Old Pattern)**
```typescript
// Old package management
const fetchPackages = async () => {
  const response = await fetch('/api/admin/soul-packages');
  const packages = await response.json();
  return packages;
};

const assignPackage = async (clientEmail, packageId) => {
  const response = await fetch('/api/admin/user-packages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientEmail: clientEmail,
      packageId: packageId,
      // ... other fields
    })
  });
  return await response.json();
};
```

#### **After (New Pattern)**
```typescript
// New package management
const fetchPackageDefinitions = async () => {
  const response = await fetch('/api/admin/package-definitions');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const fetchPackagePrices = async () => {
  const response = await fetch('/api/admin/package-prices');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const createPurchase = async (purchaseData) => {
  const response = await fetch('/api/admin/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: purchaseData.userId,
      packages: purchaseData.packages, // Array of { packagePriceId, quantity }
      paymentMethod: purchaseData.paymentMethod,
      currencyCode: purchaseData.currencyCode,
      // ... other fields
    })
  });
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};
```

### **Step 4: Update Schedule Management Components**

#### **Before (Old Pattern)**
```typescript
// Old schedule management
const fetchSchedules = async () => {
  const response = await fetch('/api/admin/schedules');
  const schedules = await response.json();
  return schedules;
};

const createSchedule = async (scheduleData) => {
  const response = await fetch('/api/admin/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dayOfWeek: scheduleData.dayOfWeek,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      // ... other fields
    })
  });
  return await response.json();
};
```

#### **After (New Pattern)**
```typescript
// New schedule management
const fetchScheduleTemplates = async () => {
  const response = await fetch('/api/admin/schedule-templates');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const fetchScheduleSlots = async () => {
  const response = await fetch('/api/admin/schedule-slots');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const createScheduleTemplate = async (templateData) => {
  const response = await fetch('/api/admin/schedule-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dayOfWeek: templateData.dayOfWeek,
      startTime: templateData.startTime,
      endTime: templateData.endTime,
      capacity: templateData.capacity,
      // ... other fields
    })
  });
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};
```

### **Step 5: Update Client-Side Components**

#### **Before (Old Pattern)**
```typescript
// Old client profile
const fetchClientProfile = async () => {
  const response = await fetch('/api/client/me');
  const profile = await response.json();
  return profile;
};

const fetchClientBookings = async () => {
  const response = await fetch('/api/client/bookings');
  const bookings = await response.json();
  return bookings;
};
```

#### **After (New Pattern)**
```typescript
// New user profile
const fetchUserProfile = async () => {
  const response = await fetch('/api/client/me');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};

const fetchUserBookings = async () => {
  const response = await fetch('/api/client/bookings');
  const result = await response.json();
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
};
```

## 🔄 **Data Structure Changes**

### **User Object Changes**
```typescript
// Before
interface Client {
  id: number;
  email: string;
  name: string;
  phone?: string;
  // ... other fields
}

// After
interface User {
  id: string; // CUID/UUID
  email: string;
  fullName: string; // Changed from 'name'
  phone?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  // ... other fields
}
```

### **Booking Object Changes**
```typescript
// Before
interface Booking {
  id: number;
  clientEmail: string;
  scheduleSlotId: number;
  // ... other fields
}

// After
interface Booking {
  id: number;
  userId: string; // Changed from clientEmail
  userPackageId: number;
  scheduleSlotId: number;
  sessionType: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  // ... other fields
}
```

### **Package Object Changes**
```typescript
// Before
interface SoulPackage {
  id: number;
  name: string;
  price: number;
  // ... other fields
}

// After
interface PackageDefinition {
  id: number;
  name: string;
  description?: string;
  sessionsCount: number;
  packageType: string;
  // ... other fields
}

interface PackagePrice {
  id: number;
  packageDefinitionId: number;
  price: number;
  currency: Currency;
  // ... other fields
}
```

## 🛠️ **Utility Functions**

### **Error Handling Utility**
```typescript
const handleApiResponse = async (response: Response) => {
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  }
  
  throw new Error(result.message || 'API request failed');
};

// Usage
const fetchData = async () => {
  try {
    const response = await fetch('/api/admin/users');
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
```

### **API Client Utility**
```typescript
class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.message || 'API request failed');
  }

  // User methods
  async getUsers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/admin/users${queryString}`);
  }

  async createUser(userData: any) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Booking methods
  async getBookings(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/admin/bookings${queryString}`);
  }

  async createBooking(bookingData: any) {
    return this.request('/admin/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // ... other methods
}

// Usage
const apiClient = new ApiClient('http://localhost:3000/api', 'your-token');
const users = await apiClient.getUsers({ page: 1, limit: 10 });
```

## 🧪 **Testing Your Changes**

### **1. Update Test Files**
```typescript
// Before
describe('Client Management', () => {
  it('should fetch clients', async () => {
    const clients = await fetchClients();
    expect(clients).toBeDefined();
  });
});

// After
describe('User Management', () => {
  it('should fetch users', async () => {
    const users = await fetchUsers();
    expect(users).toBeDefined();
    expect(users).toHaveProperty('data');
  });
});
```

### **2. Update Mock Data**
```typescript
// Before
const mockClient = {
  id: 1,
  email: 'test@example.com',
  name: 'Test Client',
};

// After
const mockUser = {
  id: 'clh1234567890abcdef',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'user',
  status: 'active',
};
```

## 🚨 **Common Issues & Solutions**

### **1. Authentication Issues**
```typescript
// Ensure proper token handling
const token = localStorage.getItem('authToken');
if (!token) {
  throw new Error('Authentication required');
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};
```

### **2. Response Format Issues**
```typescript
// Always check for success property
const response = await fetch('/api/admin/users');
const result = await response.json();

if (!result.success) {
  throw new Error(result.message);
}

return result.data;
```

### **3. TypeScript Type Issues**
```typescript
// Update your type definitions
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## ✅ **Migration Checklist**

- [ ] Update all API endpoint URLs
- [ ] Replace `clientEmail` with `userId` in all components
- [ ] Update response handling to check for `success` property
- [ ] Update TypeScript interfaces and types
- [ ] Update form field names (e.g., `name` → `fullName`)
- [ ] Update test files and mock data
- [ ] Test all CRUD operations
- [ ] Verify pagination and filtering work
- [ ] Test error handling
- [ ] Update documentation

## 🎯 **Next Steps**

1. **Start with one component** and test thoroughly
2. **Update related components** that depend on the changed data structure
3. **Run your test suite** to ensure nothing is broken
4. **Test in development** before deploying to production
5. **Monitor for any issues** after deployment

---

**Note**: Take your time with the migration and test each component thoroughly. The new API structure is more robust and will provide better performance and maintainability in the long run.
