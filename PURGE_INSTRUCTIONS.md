# PRODUCTION DATA PURGE - Complete Instructions

## Problem Summary
Test orders and users keep reappearing on `/track-order` even after deletion attempts. This document provides a complete solution to permanently remove all test data.

## Root Cause Analysis

### Step 1: Confirmed Data Source
- **Frontend:** `/track-order` calls `/api/orders/user` endpoint
- **Backend:** `GET /api/orders/user` → `getUserOrders()` controller
- **Database Query:** `Order.find({ user: req.user.id })` - queries real MongoDB
- **No Mock Data:** Confirmed no hardcoded test data in frontend

### Step 2: No Auto-Seeding Found
- ✅ No seed scripts in `package.json` postinstall
- ✅ No seed logic in `server.js` startup
- ✅ Only manual seed script: `seedFaqs.js` (for FAQs only)
- ✅ No cron jobs found that auto-create orders

### Step 3: Database Connection Verification
- Added logging to `getUserOrders` controller to show:
  - Database host and name
  - User email being queried
  - Number of orders found

## Solution: Production-Safe Purge Script

### File Created
**`ozme-backend/src/scripts/purge-live-test-data.js`**

### Safety Features
1. **Requires explicit confirmation:** `CONFIRM_PROD_PURGE=true`
2. **Shows database connection details** before deletion
3. **Lists all admin users** that will be preserved
4. **Verifies deletion** after completion
5. **Specifically checks for test user:** `dhavalparmar3264@gmail.com`

### What It Deletes
- ✅ All orders (including payment data)
- ✅ All cart items
- ✅ All wishlist items
- ✅ All reviews
- ✅ All OTP codes
- ✅ All contact form submissions
- ✅ All newsletter subscribers
- ✅ All non-admin users (including dhavalparmar3264@gmail.com)

### What It Preserves
- ✅ Products and product data
- ✅ Categories
- ✅ Inventory/stock data
- ✅ Admin users (role: 'admin')
- ✅ Coupons
- ✅ FAQs
- ✅ Policies

## Execution Steps

### Step 1: Backup Database (CRITICAL)
```bash
# Create backup before purging
mongodump --uri="your_mongodb_connection_string" --out=./backup-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Verify Environment Variables
```bash
cd /var/www/ozme_production/OZME/ozme-backend

# Check MongoDB connection
cat .env | grep MONGO
# Should show your PRODUCTION MongoDB URI
```

### Step 3: Run Purge Script
```bash
# Set confirmation flag and run
CONFIRM_PROD_PURGE=true node src/scripts/purge-live-test-data.js
```

### Step 4: Verify Results
The script will automatically verify and show:
- ✅ Orders remaining: 0
- ✅ Customer users: 0
- ✅ Test user exists: NO
- ✅ Admin users: > 0
- ✅ Products preserved: > 0

### Step 5: Clear Browser localStorage
After database purge, clear browser storage:

**Option A: Browser Console (F12)**
```javascript
localStorage.removeItem('allOrders');
localStorage.removeItem('currentOrder');
localStorage.removeItem('lastOrderId');
sessionStorage.removeItem('buyNowItem');
console.log('Cleared! Refresh page.');
```

**Option B: Clear All Site Data**
1. Open DevTools (F12)
2. Application tab → Clear storage
3. Check all boxes → Clear
4. Refresh page

### Step 6: Restart Backend Server
```bash
# If server was running during purge, restart it
pm2 restart ozme-backend
# or
systemctl restart ozme-backend
```

## Verification Checklist

After purge, verify these pages:

### ✅ `/track-order`
- Should show "No orders found" or empty state
- Search for old order ID (e.g., `OZME-6E032B11`) → "No order found"
- No order cards displayed

### ✅ `/admin/orders`
- Total Orders: **0**
- Pending: **0**
- Delivered: **0**
- Revenue: **₹0**
- Orders table: **Empty**

### ✅ `/admin/users`
- Only admin user(s) visible
- No customer users
- `dhavalparmar3264@gmail.com` should NOT exist

### ✅ `/admin` (Dashboard)
- Total Orders: **0**
- Total Revenue: **₹0**
- Pending Orders: **0**
- Total Customers: **1** (or number of admin users)
- Recent Orders: **Empty**

### ✅ `/admin/products`
- All products still visible (preserved)
- Product data intact

## Debugging: If Data Still Appears

### Check 1: Verify Database Connection
Check server logs when accessing `/track-order`. You should see:
```
[getUserOrders] Querying DB: host/database_name for user: user_id (user@email.com)
[getUserOrders] Found X orders for user user@email.com
```

### Check 2: Verify Correct Database
The purge script shows:
```
✅ MongoDB Connected:
   Host: your-host
   Database: your-database-name
```

Ensure this matches your production database.

### Check 3: Check for Multiple Databases
If you have staging/production databases:
- Verify `.env` file has correct `MONGO_URI`
- Check if there are multiple `.env` files (`.env.production`, `.env.staging`)
- Ensure the script runs against the SAME database as the live site

### Check 4: Check Browser Cache
- Clear browser localStorage (see Step 5 above)
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Try incognito/private window

### Check 5: Check Server Cache
If using Redis or in-memory cache:
```bash
# If Redis is used, flush cache
redis-cli FLUSHALL
```

### Check 6: Verify No Re-seeding
Check server startup logs for any seed/demo data creation. Should see no orders created on startup.

## Files Modified

1. **`ozme-backend/src/controllers/orderController.js`**
   - Added logging to `getUserOrders()` to show DB connection and query results

2. **`ozme-backend/src/scripts/purge-live-test-data.js`** (NEW)
   - Production-safe purge script with verification

3. **`Ozme-frontend/src/pages/TrackOrder.jsx`** (Previously fixed)
   - Clears localStorage when backend returns empty orders

4. **`Ozme-frontend/src/pages/Orders.jsx`** (Previously fixed)
   - Clears localStorage when backend returns empty orders

## Expected Script Output

```
🚀 OZME PRODUCTION DATA PURGE SCRIPT
======================================================================
⚠️  CRITICAL: This will PERMANENTLY DELETE all test data!
✅ Products, categories, and admin users will be preserved.

🔌 Connecting to MongoDB...
   URI: mongodb://***:***@host/database
✅ MongoDB Connected:
   Host: your-host
   Database: your-database-name
   Connection State: Connected

🧹 PRODUCTION DATA PURGE
======================================================================
⚠️  TARGET DATABASE: host/database-name
⚠️  This will PERMANENTLY DELETE all test data!

📊 Current Database State:
   Orders:              123
   Cart Items:          45
   ...
   ⚠️  TEST USER FOUND: dhavalparmar3264@gmail.com
      Orders for this user: 20 (will be deleted)

👤 Admin Users to Preserve:
   1. Admin (admin@ozme.in)

📦 Deleting all orders...
   ✅ Deleted 123 orders
...

======================================================================
📊 PURGE SUMMARY
======================================================================
✅ Orders deleted:              123
✅ Customer users deleted:       8
✅ Admin users preserved:        1

✅ VERIFICATION:
   Orders remaining:     0 ✅
   Customer users:        0 ✅
   Test user exists:      NO ✅
   Admin users:           1 ✅
   Products preserved:    25 ✅

✅ PURGE COMPLETED SUCCESSFULLY!
📦 All test data removed. Site is ready for live launch.

======================================================================
📊 Database: host/database-name
⏰ Purge completed at: 2026-01-04T12:00:00.000Z
======================================================================
```

## Post-Purge Actions

1. **Remove/Archive Script** (optional):
   ```bash
   mv src/scripts/purge-live-test-data.js src/scripts/purge-live-test-data.js.used
   ```

2. **Monitor for 24 hours:**
   - Check `/track-order` periodically
   - Check `/admin/orders` for any new test orders
   - Verify no data reappears

3. **If data reappears:**
   - Check server logs for database connection
   - Verify `.env` file hasn't changed
   - Check if there are multiple database connections
   - Review deployment scripts for any auto-seeding

## Support

If data continues to reappear after following all steps:
1. Check server logs for database queries
2. Verify MongoDB connection string in `.env`
3. Check if there are multiple environments (staging vs production)
4. Review any deployment/CI-CD scripts that might re-seed data





