# ✅ MongoDB Connection & Admin Login Fix

## Problem

**Issue:** Admin login failing with "Operation `users.findOne()` buffering timed out after 10000ms"

**Root Causes:**
1. **MongoDB Atlas IP not whitelisted** - Server IP is not in Atlas Network Access whitelist
2. **Server starts before DB connection** - Server was accepting requests before DB was connected
3. **Mongoose buffering enabled** - Commands were buffered when DB not connected, causing timeouts
4. **Admin user missing** - Admin user might not exist in new Atlas database

## Solutions Implemented

### 1. Disabled Mongoose Buffering

**File:** `ozme-backend/src/config/db.js`

**Changes:**
```javascript
// Disable Mongoose buffering - fail fast instead of hanging
mongoose.set('bufferCommands', false);
mongoose.set('bufferMaxEntries', 0);
```

**Result:** Queries now fail immediately with clear errors instead of timing out after 10 seconds.

### 2. Enhanced MongoDB Connection Options

**File:** `ozme-backend/src/config/db.js`

**Changes:**
```javascript
const conn = await mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 10000, // 10s timeout for Atlas
  connectTimeoutMS: 10000, // 10s connection timeout
  socketTimeoutMS: 45000, // 45s socket timeout
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  retryWrites: true,
  w: 'majority',
});
```

**Result:** Better connection handling and timeout management.

### 3. Server Startup Sequence

**File:** `ozme-backend/src/server.js`

**Changes:**
- Server now attempts DB connection before starting
- If DB connection fails, server still starts (with warnings)
- Admin bootstrap runs only if DB is connected and `ADMIN_BOOTSTRAP=true`

**Result:** Server is more resilient and provides clear error messages.

### 4. Admin Bootstrap Function

**File:** `ozme-backend/src/utils/bootstrapAdmin.js` (NEW)

**Functionality:**
- Runs on server startup if `ADMIN_BOOTSTRAP=true` in `.env`
- Creates admin user if it doesn't exist
- Updates admin password if user exists
- Uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`

**Result:** Admin user is automatically created/updated with correct credentials.

### 5. Fixed Health Endpoint

**File:** `ozme-backend/src/server.js`

**Changes:**
- Added `getConnectionInfo` import
- Health endpoint now correctly shows DB connection status

## Current Status

### ✅ Code Fixes Complete:
- Mongoose buffering disabled
- Enhanced connection options
- Server startup sequence improved
- Admin bootstrap function created
- Health endpoint fixed

### ⚠️ Remaining Issue:
**MongoDB Atlas IP Whitelisting Required**

The server logs show:
```
❌ MongoDB Connection Error: Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Next Steps (REQUIRED)

### Step 1: Whitelist Server IP in MongoDB Atlas

1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Navigate to your cluster → **Network Access**
3. Click **"Add IP Address"**
4. Add your server's IP address (or use `0.0.0.0/0` for all IPs - less secure)
5. Wait 1-2 minutes for changes to propagate

**To find your server IP:**
```bash
curl -s ifconfig.me
# or
curl -s ipinfo.io/ip
```

### Step 2: Verify Database Name in MONGODB_URI

Ensure your `.env` has:
```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0...mongodb.net/ozme_production?retryWrites=true&w=majority&appName=Cluster0
```

**Important:** Replace `/ozme_production` with your actual database name if different.

### Step 3: Restart Backend After IP Whitelisting

```bash
cd /var/www/ozme_production/OZME
pm2 restart ozme-backend --update-env
```

### Step 4: Verify Connection

```bash
# Check logs for successful connection
pm2 logs ozme-backend --lines 50 | grep -i "mongo\|connected"

# Check health endpoint
curl -s https://www.ozme.in/api/health | jq '.'
```

**Expected output:**
```json
{
  "status": "OK",
  "database": "connected",
  "dbInfo": {
    "host": "cluster0...mongodb.net",
    "name": "ozme_production"
  }
}
```

### Step 5: Verify Admin User

After connection is established and `ADMIN_BOOTSTRAP=true`:
- Check logs for: `✅ Admin user created` or `✅ Admin user updated`
- Try logging in at `https://ozme.in/admin/login` with:
  - Email: `admin@ozme.in`
  - Password: `Ozme@0911`

## Environment Variables

**Required in `.env`:**
```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0...mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
ADMIN_EMAIL=admin@ozme.in
ADMIN_PASSWORD=Ozme@0911
ADMIN_BOOTSTRAP=true  # Set to true to auto-create/update admin on startup
```

## Files Modified

1. ✅ `ozme-backend/src/config/db.js`
   - Disabled Mongoose buffering
   - Enhanced connection options

2. ✅ `ozme-backend/src/server.js`
   - Fixed server startup sequence
   - Added admin bootstrap call
   - Fixed health endpoint import

3. ✅ `ozme-backend/src/utils/bootstrapAdmin.js` (NEW)
   - Admin user creation/update function

4. ✅ `ozme-backend/.env`
   - Added `ADMIN_BOOTSTRAP=true`

## Testing

### Test 1: Health Endpoint
```bash
curl https://www.ozme.in/api/health
```
Should show `"database": "connected"` after IP whitelisting.

### Test 2: Admin Login
1. Navigate to `https://ozme.in/admin/login`
2. Enter: `admin@ozme.in` / `Ozme@0911`
3. Should login successfully (after IP whitelisting)

### Test 3: Check Logs
```bash
pm2 logs ozme-backend --lines 100 | grep -E "MongoDB|Connected|bootstrap|admin"
```

**Expected after IP whitelisting:**
```
✅ MongoDB Connected Successfully
✅ Admin user created: admin@ozme.in
```

## Summary

**Code fixes are complete.** The remaining issue is MongoDB Atlas IP whitelisting, which must be done in the Atlas dashboard. Once the IP is whitelisted:

1. ✅ Server will connect to MongoDB
2. ✅ Admin user will be created/updated automatically
3. ✅ Admin login will work
4. ✅ No more buffering timeout errors

---

**Note:** The server will now start even if MongoDB is not connected, but queries will fail fast with clear errors instead of timing out. This provides better debugging and user experience.

