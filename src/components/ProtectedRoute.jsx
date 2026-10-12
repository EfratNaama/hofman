import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LogoLoader from './LogoLoader';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, authLoading, authStatus, isAdmin, isSessionAuthorized } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <LogoLoader label="טוען..." />;
  }

  if (authStatus !== 'active' || !currentUser || !isSessionAuthorized(currentUser.uid)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
