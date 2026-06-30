import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LogoLoader from './LogoLoader';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, authLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <LogoLoader label="טוען..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
