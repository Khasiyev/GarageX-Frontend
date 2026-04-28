import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { GuestRoute } from '../components/GuestRoute';
import { AdminRoute } from '../components/AdminRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { ConfirmEmailPage } from '../features/auth/ConfirmEmailPage';
import { WelcomePage } from '../features/welcome/WelcomePage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { VehiclesPage } from '../features/vehicles/VehiclesPage';
import { JobOrdersPage } from '../features/jobOrders/JobOrdersPage';
import { JobOrderDetailPage } from '../features/jobOrders/JobOrderDetailPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { AiPage } from '../features/ai/AiPage';
import { AccessDeniedPage } from '../features/error/AccessDeniedPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/403" element={<AccessDeniedPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />

      {/* Guest only */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected - welcome */}
      <Route element={<ProtectedRoute />}>
        <Route path="/welcome" element={<WelcomePage />} />
      </Route>

      {/* Protected - with sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/job-orders" element={<JobOrdersPage />} />
          <Route path="/job-orders/:id" element={<JobOrderDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ai" element={<AiPage />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}