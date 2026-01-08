# Admin Dashboard Performance Optimization - Deployment Guide

## Quick Start

### 1. Install Backend Dependencies
```bash
cd ozme-backend
npm install compression
```

### 2. Restart Backend Server
```bash
# If using PM2
pm2 restart ozme-backend

# Or manually
cd ozme-backend
npm start
```

### 3. Rebuild Frontend
```bash
cd Ozem-Admin
npm run build
```

### 4. Verify Changes

#### Backend Verification:
1. Check compression is working:
   ```bash
   curl -H "Accept-Encoding: gzip" -I https://www.ozme.in/api/admin/dashboard/stats
   # Should see: Content-Encoding: gzip
   ```

2. Check cache headers:
   ```bash
   curl -I https://www.ozme.in/api/admin/dashboard/stats
   # Should see: Cache-Control: public, max-age=30
   # Should see: X-Cache: MISS (first request) or HIT (cached)
   ```

3. Test cache:
   - First request: `X-Cache: MISS` (fetches from DB)
   - Second request within 30s: `X-Cache: HIT` (served from cache)

#### Frontend Verification:
1. Check bundle sizes:
   ```bash
   cd Ozem-Admin
   npm run build
   # Check dist/ folder for chunk sizes
   ```

2. Test lazy loading:
   - Open browser DevTools → Network tab
   - Navigate to different admin pages
   - Verify chunks load on-demand

3. Test skeleton loading:
   - Hard refresh dashboard page
   - Should see skeleton UI immediately
   - Then data loads

## Performance Testing

### Before/After Comparison

#### Test Dashboard Load Time:
```bash
# Before optimization (baseline)
time curl -s https://www.ozme.in/api/admin/dashboard/stats > /dev/null

# After optimization (should be faster)
time curl -s https://www.ozme.in/api/admin/dashboard/stats > /dev/null
```

#### Test Cache Performance:
```bash
# First request (cache miss)
time curl -s https://www.ozme.in/api/admin/dashboard/stats > /dev/null

# Second request (cache hit - should be much faster)
time curl -s https://www.ozme.in/api/admin/dashboard/stats > /dev/null
```

### Browser Testing:
1. Open Chrome DevTools → Network tab
2. Navigate to https://ozme.in/admin
3. Check:
   - Initial bundle size (should be ~400-600KB)
   - Dashboard API response time
   - Cache headers in response
   - Compression (Content-Encoding: gzip)

## Monitoring

### Database Indexes
Verify indexes are created:
```javascript
// In MongoDB Compass or shell
use your_database_name
db.orders.getIndexes()
db.products.getIndexes()
db.users.getIndexes()
```

### Cache Statistics
Check cache performance in logs:
- Look for `X-Cache: HIT` vs `X-Cache: MISS` headers
- Higher HIT rate = better performance

### Database Query Performance
Monitor slow queries:
```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 });

// Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

## Troubleshooting

### Issue: Compression not working
**Solution:** Verify `compression` package is installed:
```bash
cd ozme-backend
npm list compression
```

### Issue: Cache not working
**Solution:** Check cache utility is imported correctly:
```bash
grep -r "cache.js" ozme-backend/src/controllers/
```

### Issue: Lazy loading not working
**Solution:** Verify build output has separate chunks:
```bash
ls -lh Ozem-Admin/dist/assets/
# Should see multiple .js files (chunks)
```

### Issue: Database queries still slow
**Solution:** Verify indexes are created:
```javascript
// Check index usage
db.orders.find({ paymentStatus: 'Paid' }).explain('executionStats')
```

## Rollback Plan

If issues occur, rollback:

1. **Backend:**
   ```bash
   cd ozme-backend
   git checkout HEAD -- src/server.js src/controllers/adminDashboardController.js src/models/
   npm uninstall compression
   ```

2. **Frontend:**
   ```bash
   cd Ozem-Admin
   git checkout HEAD -- src/App.jsx src/pages/Dashboard.jsx vite.config.ts
   rm -rf src/components/DashboardSkeleton.jsx
   ```

## Expected Results

### Performance Improvements:
- **Dashboard API:** 60-80% faster (cache hits: 98% faster)
- **Initial Load:** 50-60% faster
- **Bundle Size:** 40-50% smaller
- **Database Load:** 80-90% reduction (due to caching)

### User Experience:
- Faster page loads
- Immediate skeleton UI feedback
- Smoother navigation
- Better perceived performance

## Next Steps

1. Monitor performance metrics for 24-48 hours
2. Adjust cache TTL if needed (currently 30 seconds)
3. Consider upgrading to Redis for distributed caching
4. Enable PM2 cluster mode for better CPU utilization
5. Set up performance monitoring (e.g., New Relic, Datadog)
