import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

// LP is eager-loaded (initial route, no flash)
import LandingPage from './pages/LandingPage';

// Everything else is lazy-loaded to keep initial JS small
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Legal = lazy(() => import('./pages/Legal'));
const ReferralBonus = lazy(() => import('./pages/ReferralBonus'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const BotList = lazy(() => import('./pages/bots/BotList'));
const BotEditor = lazy(() => import('./pages/bots/BotEditor'));
const PostAnalytics = lazy(() => import('./pages/PostAnalytics'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const AccountStatus = lazy(() => import('./pages/AccountStatus'));
const Support = lazy(() => import('./pages/Support'));
const Guide = lazy(() => import('./pages/Guide'));
const Shop = lazy(() => import('./pages/Shop'));
const News = lazy(() => import('./pages/News'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const Affiliate = lazy(() => import('./pages/Affiliate'));
const MyBonus = lazy(() => import('./pages/MyBonus'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserList = lazy(() => import('./pages/admin/UserList'));
const AnnouncementList = lazy(() => import('./pages/admin/AnnouncementList'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const ReferralManagement = lazy(() => import('./pages/admin/ReferralManagement'));
const SubscriptionManagement = lazy(() => import('./pages/admin/SubscriptionManagement'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <RouteFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <RouteFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename="/posutto">
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Landing Page (eager) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/referral-bonus/:code" element={<ReferralBonus />} />

            <Route path="/login" element={<AuthLayout />}>
              <Route index element={<Login />} />
            </Route>
            <Route path="/signup" element={<AuthLayout />}>
              <Route index element={<Signup />} />
            </Route>
            <Route path="/forgot-password" element={<AuthLayout />}>
              <Route index element={<ForgotPassword />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserList />} />
              <Route path="announcements" element={<AnnouncementList />} />
              <Route path="subscriptions" element={<SubscriptionManagement />} />
              <Route path="referrals" element={<ReferralManagement />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>

            {/* User Routes (Dashboard) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="bots">
                <Route index element={<BotList />} />
                <Route path="new" element={<BotEditor />} />
                <Route path=":id/edit" element={<BotEditor />} />
              </Route>
              <Route path="analytics" element={<PostAnalytics />} />
              <Route path="accounts">
                <Route path="status" element={<AccountStatus />} />
              </Route>
              <Route path="support" element={<Support />} />
              <Route path="guide" element={<Guide />} />
              <Route path="shop" element={<Shop />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="my-bonus" element={<MyBonus />} />
              <Route path="news" element={<News />} />
              <Route path="settings">
                <Route path="account" element={<AccountSettings />} />
                <Route path="api" element={<Navigate to="/dashboard/settings/account" replace />} />
                <Route path="my-account" element={<MyAccount />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
