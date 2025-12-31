import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useIdleTimeout from '../hooks/useIdleTimeout';

/**
 * Component to handle idle timeout for admin routes
 * Should be placed inside AuthProvider but outside ProtectedRoute
 */
const IdleTimeoutHandler = () => {
  const location = useLocation();
  const { resetTimer } = useIdleTimeout();

  // Reset timer on route change
  useEffect(() => {
    // Only reset timer on admin routes (not login)
    if (location.pathname !== '/login') {
      resetTimer();
    }
  }, [location.pathname, resetTimer]);

  // This component doesn't render anything
  return null;
};

export default IdleTimeoutHandler;

