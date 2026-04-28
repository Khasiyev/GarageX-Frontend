import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

export function GuestRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}
