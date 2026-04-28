import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../lib/auth';

export function AdminRoute() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/403" replace />;
  return <Outlet />;
}
