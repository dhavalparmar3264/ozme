# Clear Browser Storage - Instructions

After running the database reset script, you also need to clear browser localStorage to remove cached order data.

## Option 1: Browser Console (Recommended)

Open your browser's developer console (F12) and run:

```javascript
// Clear all order-related localStorage
localStorage.removeItem('allOrders');
localStorage.removeItem('currentOrder');
localStorage.removeItem('lastOrderId');
localStorage.removeItem('appliedPromoCode');

// Clear sessionStorage
sessionStorage.removeItem('buyNowItem');

// Verify it's cleared
console.log('allOrders:', localStorage.getItem('allOrders'));
console.log('Cleared! Refresh the page.');
```

Then refresh the page (F5 or Ctrl+R).

## Option 2: Clear All Site Data

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear site data** or **Clear storage**
4. Check all boxes and click **Clear**
5. Refresh the page

## Option 3: Manual Browser Settings

### Chrome/Edge:
1. Settings → Privacy and security → Clear browsing data
2. Select "All time"
3. Check "Cookies and other site data"
4. Click "Clear data"

### Firefox:
1. Settings → Privacy & Security
2. Scroll to "Cookies and Site Data"
3. Click "Clear Data"
4. Check "Cookies and Site Data"
5. Click "Clear"

## For All Users

The frontend code has been updated to automatically clear localStorage when the backend returns empty orders. However, existing users who already have cached data need to:
- Clear their browser storage manually (use Option 1 above), OR
- Wait for the next page load (the updated code will clear it automatically)

## Verification

After clearing storage, verify:
1. Visit `/track-order` - should show "No orders found"
2. Visit `/admin/orders` - should show 0 orders
3. Visit `/admin` - should show all zeros

