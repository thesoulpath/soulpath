# 🚀 SoulPath Deployment Checklist

## 📋 **Pre-Deployment Checklist**

### **✅ Database Migration**
- [ ] **Backup Production Database**
  ```bash
  # Create backup before migration
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] **Run Database Migrations**
  ```bash
  # Apply the new schema
  npx prisma db push --accept-data-loss
  # Or use migrations
  npx prisma migrate deploy
  ```
- [ ] **Verify Migration Success**
  ```bash
  # Check if all tables exist
  npx prisma db pull
  npx prisma generate
  ```

### **✅ Environment Configuration**
- [ ] **Update Environment Variables**
  ```env
  # Ensure these are set in production
  DATABASE_URL=your_production_db_url
  DIRECT_URL=your_production_db_direct_url
  NEXTAUTH_SECRET=your_auth_secret
  NEXTAUTH_URL=your_production_url
  ```
- [ ] **Verify Prisma Configuration**
  ```bash
  # Test database connection
  npx prisma db seed
  ```

### **✅ Code Quality Checks**
- [ ] **TypeScript Compilation**
  ```bash
  npx tsc --noEmit
  ```
- [ ] **Build Process**
  ```bash
  npm run build
  ```
- [ ] **Linting**
  ```bash
  npm run lint
  ```

### **✅ API Testing**
- [ ] **Test All Admin Endpoints**
  - [ ] `/api/admin/users/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/purchases/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/bookings/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/package-definitions/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/package-prices/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/schedule-templates/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/schedule-slots/` - GET, POST, PUT, DELETE
  - [ ] `/api/admin/user-packages/` - GET, POST, PUT, DELETE

- [ ] **Test All Client Endpoints**
  - [ ] `/api/client/me/` - GET, PUT
  - [ ] `/api/client/bookings/` - GET, POST
  - [ ] `/api/client/packages/` - GET
  - [ ] `/api/client/my-packages/` - GET

### **✅ Authentication & Authorization**
- [ ] **Verify Admin Routes Protection**
  - [ ] All `/api/admin/` routes require admin role
  - [ ] Proper error responses for unauthorized access
- [ ] **Verify Client Routes Protection**
  - [ ] All `/api/client/` routes require authentication
  - [ ] Users can only access their own data

## 🚀 **Deployment Steps**

### **Step 1: Database Migration**
```bash
# 1. Create backup
pg_dump $DATABASE_URL > pre_migration_backup.sql

# 2. Run migration
npx prisma migrate deploy

# 3. Verify migration
npx prisma db pull
npx prisma generate
```

### **Step 2: Deploy Application**
```bash
# 1. Build application
npm run build

# 2. Deploy to your platform
# For Vercel:
vercel --prod

# For other platforms, follow their deployment process
```

### **Step 3: Post-Deployment Verification**
```bash
# 1. Test API endpoints
curl -X GET "https://your-domain.com/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Check application logs
# Monitor for any errors or issues
```

## 🔍 **Post-Deployment Testing**

### **✅ API Endpoint Testing**
```bash
# Test each endpoint with proper authentication
# Admin endpoints
curl -X GET "https://your-domain.com/api/admin/users" \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X POST "https://your-domain.com/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"email":"test@example.com","fullName":"Test User"}'

# Client endpoints
curl -X GET "https://your-domain.com/api/client/me" \
  -H "Authorization: Bearer USER_TOKEN"
```

### **✅ Database Verification**
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'purchases', 'bookings', 'package_definitions', 'package_prices', 'schedule_templates', 'schedule_slots', 'user_packages');

-- Check if data migration was successful
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM purchases;
SELECT COUNT(*) FROM bookings;
```

### **✅ Performance Testing**
```bash
# Test response times
time curl -X GET "https://your-domain.com/api/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test concurrent requests
for i in {1..10}; do
  curl -X GET "https://your-domain.com/api/admin/users" &
done
wait
```

## 🚨 **Rollback Plan**

### **If Issues Occur:**
1. **Immediate Rollback**
   ```bash
   # Restore database from backup
   psql $DATABASE_URL < pre_migration_backup.sql
   
   # Deploy previous version of application
   # (Follow your platform's rollback process)
   ```

2. **Investigate Issues**
   - Check application logs
   - Verify database connectivity
   - Test API endpoints individually
   - Check environment variables

3. **Fix and Redeploy**
   - Address any issues found
   - Test thoroughly in development
   - Redeploy with fixes

## 📊 **Monitoring & Alerts**

### **✅ Set Up Monitoring**
- [ ] **Application Performance Monitoring**
  - Response times
  - Error rates
  - API endpoint availability

- [ ] **Database Monitoring**
  - Connection pool usage
  - Query performance
  - Database size and growth

- [ ] **Error Tracking**
  - Set up error tracking (Sentry, etc.)
  - Monitor for new errors after deployment

### **✅ Health Checks**
```bash
# Create health check endpoint
curl -X GET "https://your-domain.com/api/health"

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## 🔧 **Configuration Files**

### **Production Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your_secure_secret_here
NEXTAUTH_URL=https://your-domain.com

# Application
NODE_ENV=production
```

### **Prisma Configuration**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 📋 **Final Verification Checklist**

### **✅ Before Going Live**
- [ ] All API endpoints tested and working
- [ ] Database migration completed successfully
- [ ] Authentication working properly
- [ ] Error handling functioning correctly
- [ ] Performance acceptable
- [ ] Monitoring and alerts configured
- [ ] Rollback plan ready
- [ ] Team notified of deployment

### **✅ After Going Live**
- [ ] Monitor application logs for errors
- [ ] Check API response times
- [ ] Verify all features working
- [ ] Monitor database performance
- [ ] Check for any user-reported issues
- [ ] Validate data integrity

## 🎯 **Success Criteria**

### **✅ Deployment Success Indicators**
- [ ] All API endpoints responding correctly
- [ ] No 500 errors in logs
- [ ] Database queries performing well
- [ ] Authentication working for all user types
- [ ] Frontend can connect to new APIs
- [ ] No data loss during migration

### **✅ Performance Benchmarks**
- [ ] API response times < 500ms
- [ ] Database query times < 100ms
- [ ] Application startup time < 30s
- [ ] Memory usage within acceptable limits

## 📞 **Emergency Contacts**

### **If Issues Occur:**
1. **Database Issues**: Contact your database administrator
2. **Application Issues**: Check logs and error tracking
3. **Performance Issues**: Monitor and optimize queries
4. **Security Issues**: Review authentication and authorization

---

**Remember**: Take your time with the deployment and test thoroughly at each step. The new API architecture is more robust and will provide better performance and maintainability in the long run.

**Deployment Status**: ✅ Ready for Production
