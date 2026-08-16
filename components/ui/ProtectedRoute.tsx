import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerification = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [forceShow, setForceShow] = useState(false);

  // Safety timeout: force through after 800ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) setForceShow(true);
    }, 800);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Still loading — show brief spinner
  if (isLoading && !forceShow) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // All authenticated users pass through — verification is handled at login/signup
  return <>{children}</>;
};

export default ProtectedRoute;
