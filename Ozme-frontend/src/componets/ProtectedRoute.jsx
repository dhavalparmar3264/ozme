// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Only redirect to login if explicitly not authenticated
  // Don't redirect if backend is offline (502) - allow Firebase-only auth
  if (!isAuthenticated) {
    // Check if we're in a redirect loop (same location)
    const isLoginPage = location.pathname === '/login';
    if (isLoginPage) {
      // Already on login page - don't redirect again
      return children; // Allow access to login page
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
