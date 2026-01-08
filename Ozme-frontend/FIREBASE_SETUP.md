# Firebase Google Login Setup

Firebase Google Login has been successfully integrated into Ozme-frontend.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `Ozme-frontend` directory with the following content:

```env
VITE_FIREBASE_API_KEY=AIzaSyCn1X27mVRsI4_dDWmkIrtbhnC1PQ0GNTo
VITE_FIREBASE_AUTH_DOMAIN=ozmeperfume.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ozmeperfume
VITE_FIREBASE_STORAGE_BUCKET=ozmeperfume.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=647392858064
VITE_FIREBASE_APP_ID=1:647392858064:web:a24b5eeb5f6df154fab3d5
VITE_FIREBASE_MEASUREMENT_ID=G-DGSJGZJD1M
```

**Note:** The `.env` file is already added to `.gitignore` to keep your credentials secure.

### 2. Files Created/Modified

#### Created Files:
- `src/firebase.js` - Firebase configuration and initialization
- `.env.example` - Example environment variables file

#### Modified Files:
- `src/context/AuthContext.jsx` - Added `googleLogin()` function
- `src/pages/Login.jsx` - Integrated Google login button
- `src/componets/Headers.jsx` - Shows user's Google photo in navbar
- `src/pages/Dashboard.jsx` - Shows user's Google photo in profile section
- `.gitignore` - Added `.env` to ignore list
- `package.json` - Added `firebase` dependency

### 3. Features Implemented

✅ **Firebase Google Login**
- Google sign-in popup integration
- User authentication via Firebase
- Optional backend integration (falls back to Firebase-only if backend unavailable)
- User profile photo display in navbar and dashboard

✅ **User Experience**
- Loading states during Google sign-in
- Error handling with user-friendly messages
- Automatic redirect after successful login
- User photo displayed in navbar (if available)
- User photo displayed in dashboard profile section

✅ **Backend Integration**
- Attempts to call `/api/auth/google` endpoint (optional)
- Falls back gracefully if backend is unavailable
- Stores Firebase ID token in localStorage
- Stores backend JWT token if provided

### 4. Usage

Users can now:
1. Click "Sign in with Google" button on the login page
2. Select their Google account in the popup
3. Get automatically logged in and redirected
4. See their Google profile photo in the navbar and dashboard

### 5. Testing

To test the integration:
1. Make sure `.env` file exists with Firebase credentials
2. Start the frontend: `npm run dev`
3. Navigate to `/login`
4. Click "Sign in with Google"
5. Select a Google account
6. Verify you're redirected and logged in
7. Check that your Google photo appears in the navbar and dashboard

### 6. Backend Integration (Optional)

If you want to integrate with your backend:
- Create a `POST /api/auth/google` endpoint that accepts:
  ```json
  {
    "idToken": "firebase-id-token",
    "email": "user@example.com",
    "name": "User Name",
    "photoURL": "https://..."
  }
  ```
- Return a JWT token in the response:
  ```json
  {
    "success": true,
    "data": {
      "token": "backend-jwt-token",
      "user": { ... }
    }
  }
  ```

The frontend will automatically use the backend token if available, otherwise it will use Firebase authentication only.

