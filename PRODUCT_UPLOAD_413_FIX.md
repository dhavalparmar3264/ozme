# ✅ Product Image Upload 413 Error Fix

## Problem

**Issue:** Admin "Add Product" failing with 413 error when uploading multiple images:
- Error: "Request Entity Too Large (413). Image files may be too large. Maximum file size is 5MB per image."
- User uploading 3 images of ~1.67MB each (total ~5MB)
- Request rejected before reaching backend

## Root Cause

**Nginx `client_max_body_size` was not set**, defaulting to **1MB**. When uploading 3 images of ~1.67MB each, the total request size exceeded 1MB, so nginx rejected it **before** it reached the backend.

**Request Flow:**
1. Frontend sends FormData with 3 images (~5MB total)
2. Request hits nginx reverse proxy
3. **Nginx rejects with 413** (default limit: 1MB)
4. Request never reaches backend Express server

## Solution Implemented

### 1. Fixed Nginx Configuration

**File:** `/etc/nginx/sites-available/ozme`

**Before:**
```nginx
location /api {
    proxy_pass http://127.0.0.1:3002;
    # ... other proxy settings
}
```

**After:**
```nginx
location /api {
    # Increase body size limit for file uploads
    client_max_body_size 50M;
    proxy_pass http://127.0.0.1:3002;
    # ... other proxy settings
}
```

**Action Taken:**
- Added `client_max_body_size 50M;` to `/api` location block
- Reloaded nginx: `sudo systemctl reload nginx`
- Verified config: `sudo nginx -t`

### 2. Added Client-Side File Validation

**File:** `Ozem-Admin/src/pages/Products.jsx`

**Added validation in `handleFileSelect()`:**
```javascript
// Validate file size (5MB per file)
const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
if (file.size > maxFileSize) {
  alert(`Image "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum file size is 5MB per image.`);
  return;
}

// Validate file type
if (!file.type.startsWith('image/')) {
  alert(`File "${file.name}" is not an image. Please select an image file.`);
  return;
}
```

**Added validation in `handleSave()` before upload:**
```javascript
// Validate total file size before upload (client-side check)
const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
const maxTotalSize = 50 * 1024 * 1024; // 50MB total
if (totalSize > maxTotalSize) {
  alert(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (50MB). Please reduce the number or size of images.`);
  return;
}

// Validate each file size individually
for (let i = 0; i < selectedFiles.length; i++) {
  const file = selectedFiles[i];
  const maxFileSize = 5 * 1024 * 1024; // 5MB per file
  if (file.size > maxFileSize) {
    alert(`Image "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum file size is 5MB per image.`);
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert(`File "${file.name}" is not an image. Please select an image file.`);
    return;
  }
}
```

### 3. Added Backend Request Logging

**File:** `ozme-backend/src/controllers/adminProductController.js`

**Added logging in `createAdminProduct()`:**
```javascript
// Log request size for debugging (safe - no secrets)
const contentLength = req.headers['content-length'];
const contentType = req.headers['content-type'];
console.log('📤 Product creation request:', {
  method: req.method,
  contentType: contentType?.substring(0, 50) || 'unknown',
  contentLength: contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB` : 'unknown',
  fileCount: req.files?.length || 0,
  hasFiles: !!(req.files && req.files.length > 0),
});
```

## Verification

### Request Flow (After Fix)

1. ✅ Frontend validates files client-side (size, type)
2. ✅ Frontend sends FormData with images
3. ✅ **Nginx accepts request** (50MB limit)
4. ✅ Request reaches backend Express server
5. ✅ Multer processes files (5MB per file limit)
6. ✅ Backend uploads to Cloudinary
7. ✅ Product created with image URLs

### Configuration Summary

| Layer | Limit | Status |
|-------|-------|--------|
| **Nginx** | `client_max_body_size: 50M` | ✅ Fixed |
| **Express** | `express.json({ limit: '50mb' })` | ✅ Already configured |
| **Multer** | `fileSize: 5MB per file` | ✅ Already configured |
| **Client-side** | `5MB per file, 50MB total` | ✅ Added validation |

## Files Modified

1. ✅ `/etc/nginx/sites-available/ozme`
   - Added `client_max_body_size 50M;` to `/api` location block

2. ✅ `Ozem-Admin/src/pages/Products.jsx`
   - Added file size validation in `handleFileSelect()`
   - Added total size validation in `handleSave()`
   - Added file type validation

3. ✅ `ozme-backend/src/controllers/adminProductController.js`
   - Added request size logging

## Testing

**Test Case:** Upload 3 images of ~1.67MB each

**Expected Result:**
- ✅ Client-side validation passes (each file < 5MB)
- ✅ Total size validation passes (~5MB < 50MB)
- ✅ Nginx accepts request (50MB limit)
- ✅ Backend receives request
- ✅ Multer processes files successfully
- ✅ Images uploaded to Cloudinary
- ✅ Product created with image URLs
- ✅ Product appears on /shop page

## Error Handling

**Client-Side:**
- File size > 5MB → Alert before upload
- Total size > 50MB → Alert before upload
- Invalid file type → Alert before upload

**Server-Side:**
- File size > 5MB → 413 JSON error (from multer)
- Total size > 50MB → 413 HTML error (from nginx) - should not happen with client validation
- Invalid file type → 400 JSON error (from multer)

## Status

- ✅ Nginx configuration fixed
- ✅ Client-side validation added
- ✅ Backend logging added
- ✅ Admin frontend rebuilt
- ✅ Backend restarted
- ✅ Nginx reloaded

**Result:** Product image upload should now work correctly with multiple images. The system will:
- Accept requests up to 50MB total
- Validate files client-side before upload
- Process files server-side with multer
- Upload images to Cloudinary
- Create products with image URLs
- Display products on /shop page

---

**Note:** If 413 errors persist, check:
1. Nginx config is reloaded: `sudo systemctl reload nginx`
2. Nginx config is correct: `sudo nginx -t`
3. Browser cache cleared (hard refresh)
4. Backend logs show request received (check for "📤 Product creation request" log)

