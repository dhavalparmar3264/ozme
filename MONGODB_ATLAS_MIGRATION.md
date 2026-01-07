# ✅ MongoDB Atlas Production Migration Complete

## Overview

The application has been migrated to use **ONLY** the new MongoDB Atlas production database. All hardcoded localhost references have been removed, and the app now exclusively uses `MONGODB_URI` from environment variables.

## Changes Made

### 1. Database Connection (`src/config/db.js`)

**Before:**
- Had fallback to `mongodb://localhost:27017/ozme`
- No safe logging of connection details
- No connection info export

**After:**
- ✅ **REQUIRES** `MONGODB_URI` environment variable (no fallback)
- ✅ Safe password masking in logs
- ✅ Extracts and logs database name
- ✅ Exports connection info for health checks
- ✅ Better error messages for Atlas connection issues

**Key Changes:**
```javascript
// BEFORE: Had localhost fallback
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ozme';

// AFTER: Requires MONGODB_URI
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  throw new Error('MONGODB_URI environment variable is not set.');
}
```

### 2. Server Startup Logging (`src/server.js`)

**Added:**
- ✅ Logs MongoDB connection status after 2 seconds
- ✅ Shows host and database name (safe - no secrets)
- ✅ Health endpoint includes DB connection info

### 3. Removed Hardcoded Database References

**Files Updated:**
- ✅ `src/__tests__/User.test.js` - Uses `MONGODB_URI_TEST` or `MONGODB_URI`
- ✅ `src/scripts/purge-live-test-data.js` - Requires `MONGODB_URI`
- ✅ `src/scripts/verify-reset.js` - Requires `MONGODB_URI`
- ✅ `src/scripts/reset-live-data.js` - Requires `MONGODB_URI`
- ✅ `src/scripts/cleanup-test-data.js` - Requires `MONGODB_URI`

### 4. Seed Script Safety (`src/scripts/seedFaqs.js`)

**Before:**
- Auto-ran on import

**After:**
- ✅ Only runs when explicitly called: `node src/scripts/seedFaqs.js`
- ✅ No auto-seeding on server startup

### 5. New Production Scripts

#### A. Database Verification Script (`src/scripts/db-check.js`)

**Purpose:** Verify connection to MongoDB Atlas and show data counts

**Usage:**
```bash
node src/scripts/db-check.js
```

**Output:**
- Connection details (masked password)
- Database name
- Collection counts (products, users, orders)
- Environment verification

#### B. Purge Test Data Script (`src/scripts/purge-test-data.js`)

**Purpose:** Safely delete test/demo data from production

**Usage:**
```bash
CONFIRM_PROD_PURGE=true node src/scripts/purge-test-data.js
```

**Safety:**
- ✅ Requires `CONFIRM_PROD_PURGE=true` environment variable
- ✅ Only runs in `NODE_ENV=production`
- ✅ Deletes: orders, customer users, carts, wishlists
- ✅ Keeps: admin users, products

## Verification

### 1. Check Environment Variable

```bash
cd /var/www/ozme_production/OZME/ozme-backend
grep MONGODB_URI .env
```

**Expected:**
```
MONGODB_URI=mongodb+srv://ozme_perfume:***@cluster0.potmzu0.mongodb.net/?appName=Cluster0
```

### 2. Run Database Check Script

```bash
node src/scripts/db-check.js
```

**Expected Output:**
```
🔍 OZME Database Verification Script
=====================================

📋 Connection Details:
   URI: mongodb+srv://ozme_perfume:***@cluster0.potmzu0.mongodb.net/?appName=Cluster0
   Database: [database_name]
   Environment: production

🔄 Connecting to MongoDB...
✅ Connected Successfully!

📊 Connection Info:
   Host: cluster0.potmzu0.mongodb.net
   Database: [database_name]

📈 Collection Counts:
   Products: X (Y active)
   Users: X (Y admin, Z customers)
   Orders: X (Y paid, Z pending)
```

### 3. Check Server Startup Logs

```bash
pm2 logs ozme-backend --lines 50
```

**Look for:**
```
🔄 Connecting to MongoDB Atlas...
   URI: mongodb+srv://ozme_perfume:***@cluster0.potmzu0.mongodb.net/?appName=Cluster0
   Database: [database_name]
✅ MongoDB Connected Successfully
   Host: cluster0.potmzu0.mongodb.net
   Database: [database_name]
   Environment: production
```

### 4. Health Endpoint Check

```bash
curl https://www.ozme.in/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "OZME Backend API is running",
  "database": "connected",
  "dbInfo": {
    "host": "cluster0.potmzu0.mongodb.net",
    "name": "[database_name]"
  },
  "timestamp": "2024-..."
}
```

## MongoDB Atlas Configuration

### Connection String Format

The connection string should be:
```
mongodb+srv://ozme_perfume:YVKkzZP4UUoiAPSm@cluster0.potmzu0.mongodb.net/?appName=Cluster0
```

**Note:** If you need to specify a database name explicitly, add it before the `?`:
```
mongodb+srv://ozme_perfume:YVKkzZP4UUoiAPSm@cluster0.potmzu0.mongodb.net/ozme_production?appName=Cluster0
```

### IP Whitelist

**IMPORTANT:** Ensure your server's IP address is whitelisted in MongoDB Atlas:
1. Go to MongoDB Atlas Dashboard
2. Network Access → IP Access List
3. Add server IP address (or use `0.0.0.0/0` for all IPs - less secure)

### Database User

- Username: `ozme_perfume`
- Password: `YVKkzZP4UUoiAPSm`
- Ensure user has read/write permissions

## Troubleshooting

### Connection Error: "IP not whitelisted"

**Solution:**
1. Check MongoDB Atlas Network Access
2. Add server IP to whitelist
3. Wait 1-2 minutes for changes to propagate

### Connection Error: "Authentication failed"

**Solution:**
1. Verify username/password in `.env`
2. Check database user exists in Atlas
3. Verify user has correct permissions

### Database Name Not Showing

**Solution:**
- If database name is not in URI, MongoDB uses default database
- Add database name to connection string: `...mongodb.net/ozme_production?...`

## Files Modified

1. ✅ `src/config/db.js` - Removed localhost fallback, added safe logging
2. ✅ `src/server.js` - Added connection status logging
3. ✅ `src/scripts/db-check.js` - New verification script
4. ✅ `src/scripts/purge-test-data.js` - New purge script
5. ✅ `src/scripts/seedFaqs.js` - Made safe (no auto-run)
6. ✅ `src/scripts/purge-live-test-data.js` - Removed localhost fallback
7. ✅ `src/scripts/verify-reset.js` - Removed localhost fallback
8. ✅ `src/scripts/reset-live-data.js` - Removed localhost fallback
9. ✅ `src/scripts/cleanup-test-data.js` - Removed localhost fallback
10. ✅ `src/__tests__/User.test.js` - Uses environment variable

## Next Steps

1. ✅ Verify `.env` has correct `MONGODB_URI`
2. ✅ Whitelist server IP in MongoDB Atlas
3. ✅ Restart backend: `pm2 restart ozme-backend --update-env`
4. ✅ Run verification: `node src/scripts/db-check.js`
5. ✅ Check server logs for connection confirmation
6. ✅ Test API endpoints to ensure data operations work

## Status

- ✅ Database connection uses ONLY `MONGODB_URI`
- ✅ No localhost fallbacks
- ✅ Safe logging (password masked)
- ✅ Connection info exported for health checks
- ✅ Seed scripts made safe (no auto-run)
- ✅ Production scripts created
- ✅ All hardcoded references removed

**The application is now fully configured to use MongoDB Atlas production database.**

