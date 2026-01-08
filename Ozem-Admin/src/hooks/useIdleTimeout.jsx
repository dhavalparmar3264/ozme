import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook for idle timeout
 * Logs out admin after 60 minutes of inactivity
 * Tracks: mousemove, keydown, scroll, click, touchstart
 * Resets on route change and API requests
 */
const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds

const useIdleTimeout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // Idle timeout reached - logout admin
      console.log('⏰ Admin session expired due to inactivity');
      
      // Show toast notification
      toast.error('Session expired due to inactivity. Please login again.', {
        duration: 5000,
      });

      // Logout and redirect to login
      logout().then(() => {
        navigate('/login', { replace: true });
      }).catch((error) => {
        console.error('Logout error during idle timeout:', error);
        // Force redirect even if logout fails
        navigate('/login', { replace: true });
      });
    }, IDLE_TIMEOUT);
  }, [logout, navigate]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Only apply idle timeout on admin routes (not on login page)
    if (location.pathname === '/login') {
      // Clear timeout if on login page
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Reset timer on route change
    resetTimer();

    // Track user activity events
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // Add event listeners with throttling (only reset timer max once per second)
    let throttleTimeout = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleActivity();
          throttleTimeout = null;
        }, 1000); // Throttle to max once per second
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Also reset timer on visibility change (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User switched back to tab - check if still within timeout
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity < IDLE_TIMEOUT) {
          resetTimer();
        } else {
          // Already expired - logout immediately
          handleActivity(); // This will trigger logout
        }
      }
    };

    // Reset timer on successful API requests
    const handleApiRequestSuccess = () => {
      resetTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('apiRequestSuccess', handleApiRequestSuccess);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('apiRequestSuccess', handleApiRequestSuccess);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [location.pathname, resetTimer, handleActivity]);

  // Expose reset function for API requests
  return {
    resetTimer,
  };
};

export default useIdleTimeout;

