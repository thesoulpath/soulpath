# Vercel Deployment Checklist

## 🚨 Package Loading Issue in Vercel

If packages are loading in localhost but not in Vercel, follow this checklist:

### 1. Environment Variables Check

Run the environment check script:
```bash
node scripts/check-vercel-env.js
```

### 2. Required Environment Variables

Ensure these are set in your Vercel dashboard:

#### Required Variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NEXT_PUBLIC_APP_URL` - Your app's public URL

#### Optional Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - If using Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - If using Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - If using Supabase

### 3. Database Connection Issues

#### Common Problems:
1. **Connection Pooling**: Vercel requires connection pooling for PostgreSQL
2. **SSL Requirements**: Some databases require SSL connections
3. **Network Access**: Database must be accessible from Vercel's IP ranges

#### Solutions:
1. **Use a connection pooler** (recommended):
   ```
   # Example with Supabase
   DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
   
   # Example with PlanetScale
   DATABASE_URL=mysql://user:password@aws.connect.psdb.cloud/database?sslaccept=strict
   ```

2. **Add SSL parameters**:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

### 4. Vercel Dashboard Steps

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add/update the required variables
4. Make sure to set them for **Production** environment
5. **Redeploy** your application

### 5. Database Migration

Ensure your database schema is up to date:

```bash
# Run migrations
npx prisma migrate deploy

# Or push schema changes
npx prisma db push
```

### 6. Check Vercel Logs

1. Go to your Vercel dashboard
2. Navigate to **Functions** tab
3. Check the logs for `/api/packages` endpoint
4. Look for error messages

### 7. Test API Endpoints

Test your API endpoints directly:

```bash
# Test packages endpoint
curl https://your-app.vercel.app/api/packages?active=true

# Test schedule slots endpoint
curl https://your-app.vercel.app/api/schedule-slots?available=true
```

### 8. Common Error Messages

#### "Database connection failed"
- Check DATABASE_URL format
- Ensure database is accessible
- Verify connection pooling is enabled

#### "ECONNREFUSED"
- Database server is not accessible
- Check firewall settings
- Verify database credentials

#### "SSL connection required"
- Add `?sslmode=require` to DATABASE_URL
- Or use a connection pooler

#### "Too many connections"
- Enable connection pooling
- Reduce connection limit

### 9. Debugging Steps

1. **Check environment variables**:
   ```bash
   node scripts/check-vercel-env.js
   ```

2. **Test database connection locally**:
   ```bash
   npx prisma studio
   ```

3. **Check Vercel function logs**:
   - Go to Vercel dashboard
   - Check Functions tab for error logs

4. **Test API endpoints**:
   - Use browser dev tools
   - Check Network tab for failed requests

### 10. Quick Fixes

#### If using Supabase:
```bash
# Get connection string with pooling
# Go to Supabase dashboard > Settings > Database
# Copy the "Connection pooling" URL
```

#### If using PlanetScale:
```bash
# Get connection string
# Go to PlanetScale dashboard > Connect
# Copy the connection string
```

#### If using Railway:
```bash
# Get connection string
# Go to Railway dashboard > Database
# Copy the connection string
```

### 11. Redeploy After Changes

After making changes:
1. Commit your changes
2. Push to your repository
3. Vercel will automatically redeploy
4. Or manually trigger a redeploy in Vercel dashboard

### 12. Verification

After deployment:
1. Visit your live site
2. Navigate to the booking section
3. Check browser console for errors
4. Verify packages are loading

## 🆘 Still Having Issues?

If you're still experiencing issues:

1. **Check Vercel logs** for specific error messages
2. **Test API endpoints** directly
3. **Verify database connectivity** from Vercel
4. **Contact support** with specific error messages

## 📞 Support

- Vercel Support: https://vercel.com/support
- Prisma Support: https://www.prisma.io/support
- Database Provider Support: Check your database provider's documentation
