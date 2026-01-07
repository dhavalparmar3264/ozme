// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '../utils/api.js';

// Import Firebase (will be null if not configured)
import { auth, googleProvider } from '../firebase.js';

// Import Firebase Auth functions (proper imports, no dynamic imports)
// Note: authStateReady may not exist in older Firebase versions, use onAuthStateChanged instead
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  /**
   * Sync Firebase auth with backend
   * Called when Firebase auth state changes (e.g., on refresh)
   */
  const syncFirebaseAuthWithBackend = async (firebaseUser) => {
    if (!firebaseUser) {
      return null;
    }

    try {
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Call backend to sync/create session
      const response = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          idToken: idToken,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }),
      });

      if (response && response.success) {
        // Backend session created/restored via httpOnly cookie
        // DO NOT store token in localStorage - use httpOnly cookie only
        
        // Set user from backend response
        const userData = response.data.user || {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        
        if (!userData.photoURL && firebaseUser.photoURL) {
          userData.photoURL = firebaseUser.photoURL;
        }
        
        setUser(userData);
        return userData;
      }
    } catch (error) {
      // CRITICAL: Handle 502/offline errors gracefully - don't redirect to login
      const is502 = error.response?.status === 502 || 
                   error.message?.includes('502') ||
                   error.message?.includes('Bad Gateway');
      const isOffline = error.errorCode === 'BACKEND_OFFLINE' || 
                       error.isOffline ||
                       error.message?.includes('Failed to fetch') ||
                       error.message?.includes('NetworkError');
      
      if (is502 || isOffline) {
        console.warn('[AuthContext] Backend unavailable during sync (502/offline) - using Firebase only:', error);
        // Use Firebase user data directly (backend unavailable)
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || null,
        };
        setUser(userData);
        return userData; // Return user data - don't redirect
      }
      
      console.warn('Failed to sync Firebase auth with backend:', error);
      // Fallback: use Firebase user data directly
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || null,
      };
      setUser(userData);
      return userData;
    }
    
    return null;
  };

  /**
   * Check authentication status on app load
   * CRITICAL: Wait for Firebase auth to initialize, then check both Firebase and backend cookie
   * Backend httpOnly cookie is the source of truth - no localStorage token storage
   */
  const checkAuth = async () => {
    try {
      // Step 1: Wait for Firebase auth to initialize (if Firebase is configured)
      if (auth) {
        try {
          // Wait for Firebase auth state to be ready using onAuthStateChanged
          // This ensures persistence is restored before checking auth state
          await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
              unsubscribe(); // Only listen once
              resolve(firebaseUser);
            });
            
            // Timeout after 3 seconds if Firebase doesn't respond
            setTimeout(() => {
              unsubscribe();
              resolve(null);
            }, 3000);
          });
          
          setAuthReady(true);
          
          // Check current Firebase user
          const currentFirebaseUser = auth.currentUser;
          
          if (currentFirebaseUser) {
            // Firebase user is logged in - sync with backend to restore session
            console.log('🔄 Firebase user found, syncing with backend...');
            const userData = await syncFirebaseAuthWithBackend(currentFirebaseUser);
            setLoading(false);
            return userData || null;
          }
        } catch (firebaseError) {
          console.warn('Firebase auth initialization error:', firebaseError);
          setAuthReady(true); // Mark as ready even if Firebase fails
          // Continue to backend check if Firebase fails
        }
      } else {
        setAuthReady(true); // No Firebase, mark as ready immediately
      }
      
      // Step 2: Check backend cookie (for regular login or if no Firebase user)
      // Backend httpOnly cookie is the source of truth
      const response = await apiRequest('/auth/me');
      
      if (response && response.success) {
        // User is authenticated via backend httpOnly cookie
        const userData = response.data.user;
        
        // Normalize verification fields: phoneVerified is single source of truth
        if (userData.isPhoneVerified !== undefined && userData.phoneVerified === undefined) {
          userData.phoneVerified = userData.isPhoneVerified;
        }
        if (userData.phoneVerified !== undefined) {
          userData.isPhoneVerified = userData.phoneVerified; // Alias for compatibility
        }
        
        // Debug: Log verification status from backend (temporary)
        console.log('[AuthContext] checkAuth - phoneVerified:', userData?.phoneVerified, 'isPhoneVerified:', userData?.isPhoneVerified, 'phone:', userData?.phone);
        
        setUser(userData);
        // DO NOT store token in localStorage - cookie is source of truth
        return userData; // Return user data for immediate use
      } else if (response && (response.errorCode === 'BACKEND_OFFLINE' || response.isOffline || response.status === 502)) {
        // Backend is offline (502) - don't clear user state, allow Firebase-only auth
        console.warn('[AuthContext] Backend offline during checkAuth (502) - preserving Firebase auth state');
        // Return null but don't clear user state (let Firebase auth handle it)
        // This prevents redirect loop when backend is down
        return null;
      } else {
        // Not authenticated - clear any stale state
        // CRITICAL: Only clear if backend explicitly says no session (not if backend is offline)
        if (response && response.errorCode !== 'BACKEND_OFFLINE' && !response.isOffline && response.status !== 502) {
          setUser(null);
        }
        return null;
      }
    } catch (error) {
      // CRITICAL: Handle 502/offline errors gracefully - don't clear user state
      const is502 = error.response?.status === 502 || 
                   error.message?.includes('502') ||
                   error.message?.includes('Bad Gateway');
      const isOffline = error.errorCode === 'BACKEND_OFFLINE' || 
                       error.isOffline ||
                       error.message?.includes('Failed to fetch') ||
                       error.message?.includes('NetworkError');
      
      if (is502 || isOffline) {
        // Backend unavailable - keep existing user state if available (Firebase auth)
        console.warn('[AuthContext] Backend unavailable during checkAuth (502/offline) - preserving Firebase auth state');
        // Don't clear user state - allow Firebase-only auth to continue
        return null; // Return null but don't clear user
      }
      
      // Handle authentication errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Token expired or invalid - only clear if backend explicitly says so
        console.log('[AuthContext] Backend returned 401/403 - clearing user state');
        setUser(null);
        return null;
      } else {
        // Other error - log but don't clear user state (might be temporary backend issue)
        console.warn('[AuthContext] Error during checkAuth:', error.message);
        // Don't clear user state on unknown errors - might be temporary
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize auth check on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Register new user
   * @param {Object} userData - { name, email, password, phone? }
   */
  const signup = async (userData) => {
    try {
      setLoading(true);
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Handle backend offline case
      if (response && response.isOffline) {
        return { 
          success: false, 
          error: response.message || 'Unable to connect to the server. Please try again later.',
          errorCode: 'BACKEND_OFFLINE'
        };
      }

      // Handle null response (shouldn't happen for auth endpoints, but handle gracefully)
      if (response === null) {
        return { 
          success: false, 
          error: 'Unable to connect to the server. The backend may be offline.',
          errorCode: 'BACKEND_OFFLINE'
        };
      }

      if (response && response.success) {
        // Backend sets httpOnly cookie - DO NOT store token in localStorage
        setUser(response.data.user);
        toast.success('Account created successfully!');
        return { success: true, user: response.data.user };
      } else {
        // Return error with code for specific handling
        let errorMessage = response?.message || 'Registration failed due to an unexpected issue.';
        let errorCode = response?.errorCode || 'SIGNUP_FAILED';
        
        // Handle database unavailable error
        if (errorCode === 'DATABASE_UNAVAILABLE') {
          errorMessage = 'Database is not available. Please try again later.';
        }
        
        return { 
          success: false, 
          error: errorMessage,
          errorCode
        };
      }
    } catch (error) {
      // Handle API errors with error codes
      let errorMessage = 'Registration failed due to an unexpected issue.';
      let errorCode = 'SIGNUP_FAILED';
      
      // Extract error from response if available
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        errorCode = error.response.data.errorCode || errorCode;
      } else if (error.errorCode) {
        errorCode = error.errorCode;
        errorMessage = error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Don't show toast here - let the Login component handle it
      return { success: false, error: errorMessage, errorCode };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Handle backend offline case
      if (response && response.isOffline) {
        return { 
          success: false, 
          error: response.message || 'Unable to connect to the server. Please try again later.',
          errorCode: 'BACKEND_OFFLINE'
        };
      }

      // Handle null response (shouldn't happen for auth endpoints, but handle gracefully)
      if (response === null) {
        return { 
          success: false, 
          error: 'Unable to connect to the server. The backend may be offline.',
          errorCode: 'BACKEND_OFFLINE'
        };
      }

      if (response && response.success) {
        // Backend sets httpOnly cookie - DO NOT store token in localStorage
        setUser(response.data.user);
        toast.success('Login successful!');
        return { success: true, user: response.data.user };
      } else {
        // Return error with code for specific handling
        let errorMessage = response?.message || 'Login failed. Please try again or contact support.';
        let errorCode = response?.errorCode || 'LOGIN_FAILED';
        
        // Handle database unavailable error
        if (errorCode === 'DATABASE_UNAVAILABLE') {
          errorMessage = 'Database is not available. Please try again later.';
        }
        
        return { 
          success: false, 
          error: errorMessage,
          errorCode
        };
      }
    } catch (error) {
      // Handle API errors with error codes
      let errorMessage = 'Login failed. Please try again or contact support.';
      let errorCode = 'LOGIN_FAILED';
      
      // Extract error from response if available
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        errorCode = error.response.data.errorCode || errorCode;
      } else if (error.errorCode) {
        errorCode = error.errorCode;
        errorMessage = error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Don't show toast here - let the Login component handle it
      return { success: false, error: errorMessage, errorCode };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Login
   */
  const googleLogin = async () => {
    if (!auth || !googleProvider) {
      toast.error('Google login is not configured. Please add Firebase credentials to .env file.');
      return { success: false, error: 'Google login not available' };
    }

    try {
      setLoading(true);
      
      // Sign in with Google using Firebase
      // signInWithPopup is imported from firebase/auth
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Get the ID token from Firebase
      const idToken = await firebaseUser.getIdToken();
      
      // Optionally call backend to create/update user and get JWT
      try {
        const response = await apiRequest('/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            idToken: idToken,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }),
        });
        
        if (response && response.success) {
          // Store backend JWT token if provided
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          
          // Set user from backend response (which includes photoURL) or fallback to Firebase
          const userData = response.data.user || {
            id: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          };
          // Ensure photoURL is included
          if (!userData.photoURL && firebaseUser.photoURL) {
            userData.photoURL = firebaseUser.photoURL;
          }
          setUser(userData);
          
          // Debug: Log user data to verify photoURL
          if (import.meta.env.DEV) {
            console.log('Google login - User data set:', { 
              hasPhotoURL: !!userData.photoURL, 
              photoURL: userData.photoURL 
            });
          }
          
          toast.success('Login successful!');
          return { success: true, user: userData };
        }
      } catch (backendError) {
        // CRITICAL: Handle 502 Bad Gateway and other backend errors gracefully
        // Do NOT redirect to login - show error and allow user to retry
        const is502 = backendError.response?.status === 502 || 
                     backendError.message?.includes('502') ||
                     backendError.message?.includes('Bad Gateway');
        const isOffline = backendError.errorCode === 'BACKEND_OFFLINE' || 
                         backendError.isOffline ||
                         backendError.message?.includes('Failed to fetch') ||
                         backendError.message?.includes('NetworkError');
        
        if (is502 || isOffline) {
          console.error('Backend unavailable (502/offline) - preventing redirect loop:', backendError);
          toast.error('Server is temporarily unavailable. Please try again in a moment.');
          
          // Set user from Firebase temporarily (backend unavailable)
          // User can still use app, but backend features won't work
          const userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || null,
          };
          setUser(userData);
          
          // Return success with Firebase-only auth (no redirect)
          return { 
            success: true, 
            user: userData,
            backendUnavailable: true 
          };
        }
        
        // For other errors, show error but don't redirect
        console.error('Backend Google auth failed:', backendError);
        toast.error(backendError.message || 'Authentication failed. Please try again.');
        return { success: false, error: backendError.message || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Google login failed:', error);
      const errorMessage = error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in cancelled'
        : error.message || 'Google login failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Sign out from Firebase if logged in via Google
      if (auth.currentUser) {
        await auth.signOut();
      }
      
      // Call logout endpoint to clear cookie
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call
      setUser(null);
      // No localStorage cleanup needed - backend cookie is cleared by logout endpoint
      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    googleLogin,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

