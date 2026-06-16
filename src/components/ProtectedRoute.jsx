import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, authLoading, role } = useAuth();
  const location = useLocation();
  const normalizedRole = (role || '').toLowerCase();
  const canManage = normalizedRole === 'admin' || normalizedRole === 'manager';

  if (authLoading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !canManage) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
