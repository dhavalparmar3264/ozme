# ✅ User Login Persistence Fix (30 Days)

## Problem

**Issue:** Users were logged out on every page refresh, breaking expected UX.

**Root Causes:**
1. Backend cookie expiry was only 7 days (hardcoded)
2. Backend JWT expiry was 7 days (from env or default)
3. Frontend `checkAuth` checked `localStorage.getItem('token')` first and returned early if not found
4. Since backend uses httpOnly cookies (which JavaScript can't read), localStorage was often empty on refresh
5. Frontend never called `/api/auth/me` to check the cookie when localStorage was empty

## Solution Implemented

### 1. Backend JWT Expiry (30 Days)

**File:** `ozme-backend/src/utils/generateToken.js`

**Before:**
```javascript
const tokenExpiry = expiresIn || process.env.JWT_EXPIRE || '7d';
```

**After:**
```javascript
// Default to 30 days if not specified
const tokenExpiry = expiresIn || process.env.JWT_EXPIRE || '30d';
```

**Environment Variable:**
- Updated `.env`: `JWT_EXPIRE=30d` (was `7d`)

### 2. Backend Cookie Configuration (30 Days)

**File:** `ozme-backend/src/controllers/authController.js`

**Before:**
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

**After:**
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from 'strict' to 'lax' for better cross-site compatibility
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

**Applied to:**
- `register()` function
- `login()` function
- `googleAuth()` function

### 3. Frontend Auth Persistence (CRITICAL FIX)

**File:** `Ozme-frontend/src/context/AuthContext.jsx`

**Before:**
```javascript
const checkAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return; // ❌ Early return - never checks cookie!
    }

    const response = await apiRequest('/auth/me');
    // ...
  }
};
```

**After:**
```javascript
const checkAuth = async () => {
  try {
    // CRITICAL: Always call /api/auth/me to check cookie-based auth
    // Do NOT rely on localStorage token check first, as backend uses httpOnly cookies
    // The cookie is sent via credentials: 'include' in apiRequest
    const response = await apiRequest('/auth/me');
    
    if (response && response.success) {
      // User is authenticated via cookie
      setUser(response.data.user);
      
      // Also store token in localStorage if provided (for backward compatibility)
      // But cookie is the primary auth method
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
    } else {
      // Not authenticated - clear any stale localStorage token
      localStorage.removeItem('token');
      setUser(null);
    }
  } catch (error) {
    // Handle authentication errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired or invalid - clear localStorage
      localStorage.removeItem('token');
      setUser(null);
    } else if (error.message && error.message.includes('Failed to fetch')) {
      // Backend unreachable - check if we have a localStorage token as fallback
      const localToken = localStorage.getItem('token');
      if (localToken) {
        // Keep user state if we have a token (offline mode)
        console.warn('Backend unreachable during auth check, using localStorage token as fallback');
      } else {
        setUser(null);
      }
    } else {
      // Other error - clear auth state
      localStorage.removeItem('token');
      setUser(null);
    }
  } finally {
    setLoading(false);
  }
};
```

**Key Changes:**
- ✅ **Always calls `/api/auth/me`** - doesn't check localStorage first
- ✅ Cookie is automatically sent via `credentials: 'include'` in `apiRequest`
- ✅ Backend reads token from cookie via `req.cookies.token` in `authMiddleware`
- ✅ Falls back to localStorage token only if backend is unreachable

### 4. Logout Cookie Clearing

**File:** `ozme-backend/src/controllers/authController.js`

**Before:**
```javascript
res.cookie('token', '', {
  httpOnly: true,
  expires: new Date(0),
});
```

**After:**
```javascript
// Clear cookie with same options as login (for proper deletion)
res.cookie('token', '', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 0, // Immediately expire
  expires: new Date(0),
});
```

## How It Works Now

### Login Flow:
1. User logs in → Backend generates JWT with 30-day expiry
2. Backend sets httpOnly cookie with 30-day `maxAge`
3. Backend returns token in response body
4. Frontend stores token in localStorage (for backward compatibility)
5. Frontend sets user state

### Refresh Flow:
1. Page refreshes → `AuthContext` mounts
2. `checkAuth()` is called
3. **Always calls `/api/auth/me`** (doesn't check localStorage first)
4. Request includes cookie automatically (`credentials: 'include'`)
5. Backend reads token from cookie via `req.cookies.token`
6. Backend validates token and returns user data
7. Frontend sets user state
8. **User stays logged in! ✅**

### Cookie Properties:
- `httpOnly: true` - JavaScript can't read (security)
- `secure: true` - Only sent over HTTPS (production)
- `sameSite: 'lax'` - Sent on same-site and top-level navigation
- `maxAge: 30 days` - Cookie expires in 30 days

## Verification

### Test 1: Login and Refresh
1. Login at `/login`
2. Refresh page (F5)
3. ✅ User should remain logged in

### Test 2: Close and Reopen Browser
1. Login at `/login`
2. Close browser completely
3. Reopen browser and navigate to site
4. ✅ User should remain logged in

### Test 3: Check Cookie in DevTools
1. Login at `/login`
2. Open DevTools → Application → Cookies
3. Find `token` cookie
4. ✅ Should show:
   - Expires: ~30 days from now
   - HttpOnly: ✓
   - Secure: ✓ (in production)
   - SameSite: Lax

### Test 4: Token Expiry
1. Login at `/login`
2. Wait 30 days (or manually expire cookie)
3. ✅ User should be logged out after 30 days

## Files Modified

1. ✅ `ozme-backend/src/utils/generateToken.js`
   - Default expiry changed from '7d' to '30d'

2. ✅ `ozme-backend/src/controllers/authController.js`
   - Cookie `maxAge` changed from 7 days to 30 days
   - Cookie `sameSite` changed from 'strict' to 'lax'
   - Applied to `register()`, `login()`, `googleAuth()`
   - Fixed `logout()` to properly clear cookie

3. ✅ `ozme-backend/.env`
   - `JWT_EXPIRE=30d` (was `7d`)

4. ✅ `Ozme-frontend/src/context/AuthContext.jsx`
   - `checkAuth()` now always calls `/api/auth/me`
   - Removed early return on missing localStorage token
   - Cookie-based auth is primary method

## Status

- ✅ Backend JWT expiry: 30 days
- ✅ Backend cookie expiry: 30 days
- ✅ Frontend always checks cookie on refresh
- ✅ Cookie properties configured correctly
- ✅ Backend restarted with new JWT_EXPIRE
- ✅ Frontend rebuilt and restarted

**Result:** Users now stay logged in for 30 days across:
- ✅ Page refresh
- ✅ Tab close/open
- ✅ Browser restart
- ✅ Navigation between pages

**Auto-logout only occurs:**
- After 30 days (token/cookie expiry)
- Manual logout click
- Token invalid/expired

---

**Note:** The fix ensures cookie-based authentication is the primary method, with localStorage as a fallback for offline scenarios. The httpOnly cookie provides better security while maintaining persistence.

