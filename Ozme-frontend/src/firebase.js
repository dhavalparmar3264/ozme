import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is valid
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

let app = null;
let auth = null;
let googleProvider = null;
let analytics = null;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firebase Auth
    auth = getAuth(app);
    
    // Set persistence to LOCAL - persists across browser sessions
    // This ensures Google login persists after page refresh and browser restart
    // Must be set BEFORE any auth operations
    if (typeof window !== 'undefined') {
      try {
        setPersistence(auth, browserLocalPersistence).catch((err) => {
          console.warn('Firebase persistence setting error:', err);
        });
      } catch (err) {
        console.warn('Firebase persistence initialization error:', err);
      }
    }

    // Initialize Google Auth Provider
    googleProvider = new GoogleAuthProvider();

    // Initialize Analytics (only in browser, not SSR)
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Firebase Analytics initialization error:', error);
      }
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  // Only show warning in development mode
  if (import.meta.env.DEV) {
    console.warn('Firebase is not configured. Google login will be disabled. Add Firebase credentials to .env file to enable.');
  }
}

export { auth, googleProvider, analytics };

