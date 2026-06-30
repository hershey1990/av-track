import { Routes, Route, Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth-guard'
import { GuestGuard } from '@/components/guest-guard'
import { NavBar } from '@/components/nav-bar'
import { PWARegister } from '@/components/pwa-register'
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('@/routes/login'))
const RegisterPage = lazy(() => import('@/routes/register'))
const DashboardPage = lazy(() => import('@/routes/dashboard'))
const HistoryPage = lazy(() => import('@/routes/history'))
const ReportPage = lazy(() => import('@/routes/report'))
const SettingsPage = lazy(() => import('@/routes/settings'))
const AdminPage = lazy(() => import('@/routes/admin'))
const AdminPeriodsPage = lazy(() => import('@/routes/admin-periods'))
const AdminUserDetailPage = lazy(() => import('@/routes/admin-user-detail'))
const AdminUserEntriesPage = lazy(() => import('@/routes/admin-user-entries'))
const AdminPolicyPage = lazy(() => import('@/routes/admin-policy'))
const OfflinePage = lazy(() => import('@/routes/offline'))

function ProtectedLayout() {
  return (
    <AuthGuard>
      <NavBar />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <Outlet />
      </main>
    </AuthGuard>
  )
}

function GuestLayout() {
  return (
    <GuestGuard>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Outlet />
      </main>
    </GuestGuard>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" />
    </div>
  )
}

export function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Auth routes */}
          <Route element={<GuestLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/periods" element={<AdminPeriodsPage />} />
            <Route path="/admin/policy" element={<AdminPolicyPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/users/:id/entries" element={<AdminUserEntriesPage />} />
          </Route>

          {/* Public routes */}
          <Route path="/offline" element={<OfflinePage />} />
        </Routes>
      </Suspense>
      <PWARegister />
    </div>
  )
}
