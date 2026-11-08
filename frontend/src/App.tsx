import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InvoiceListPage } from './pages/invoices/InvoiceListPage';
import { InvoiceCreatePage } from './pages/invoices/InvoiceCreatePage';
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage';
import { PublicInvoiceViewPage } from './pages/public/PublicInvoiceViewPage';
import { IncomingInvoiceListPage } from './pages/incoming/IncomingInvoiceListPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { SupplierListPage } from './pages/suppliers/SupplierListPage';
import { ProductListPage } from './pages/products/ProductListPage';
import { PaymentListPage } from './pages/payments/PaymentListPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AiAssistantPage } from './pages/assistant/AiAssistantPage';
import { CompanySettingsPage } from './pages/settings/CompanySettingsPage';
import { ProfilePage } from './pages/settings/ProfilePage';
import { PlatformDashboardPage } from './pages/admin/PlatformDashboardPage';
import { PlatformCompaniesPage } from './pages/admin/PlatformCompaniesPage';
import { PlatformUsersPage } from './pages/admin/PlatformUsersPage';
import { PlatformAuditLogsPage } from './pages/admin/PlatformAuditLogsPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing & Marketing */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/view-invoice/:token" element={<PublicInvoiceViewPage />} />

        {/* Platform Super Admin Console (Strictly Protected) */}
        <Route
          path="/admin"
          element={
            <SuperAdminRoute>
              <DashboardLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<PlatformDashboardPage />} />
          <Route path="companies" element={<PlatformCompaniesPage />} />
          <Route path="users" element={<PlatformUsersPage />} />
          <Route path="audit-logs" element={<PlatformAuditLogsPage />} />
        </Route>

        {/* Protected Tenant Business Workspace Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/new" element={<InvoiceCreatePage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/incoming-invoices" element={<IncomingInvoiceListPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/suppliers" element={<SupplierListPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/payments" element={<PaymentListPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
          <Route path="/settings" element={<CompanySettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all: Redirect unknown routes to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
