import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Transfer from './pages/Transfer'
import Settings from './pages/Settings'
import BillPayment from './pages/BillPayment'
import Loans from './pages/Loans'
import ScheduledPayments from './pages/ScheduledPayments'
import Analytics from './pages/Analytics'
import Disputes from './pages/Disputes'
import CurrencyExchange from './pages/CurrencyExchange'
import Sessions from './pages/Sessions'
import AdminDashboard from './pages/admin/AdminDashboard'
import TellerDashboard from './pages/teller/TellerDashboard'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ComplianceDashboard from './pages/compliance/ComplianceDashboard'

const roleHome = {
  customer: '/dashboard',
  teller: '/teller',
  branch_manager: '/manager',
  compliance_officer: '/compliance',
  admin: '/admin',
}

function Spinner() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={roleHome[user.role] || '/dashboard'} replace />
  return children
}

function RoleGuard({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Customer routes */}
      <Route path="/dashboard" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><Dashboard /></Layout>
        </RoleGuard>
      } />
      <Route path="/transactions" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><Transactions /></Layout>
        </RoleGuard>
      } />
      <Route path="/transfer" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><Transfer /></Layout>
        </RoleGuard>
      } />
      <Route path="/bills" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><BillPayment /></Layout>
        </RoleGuard>
      } />
      <Route path="/loans" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><Loans /></Layout>
        </RoleGuard>
      } />
      <Route path="/scheduled-payments" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><ScheduledPayments /></Layout>
        </RoleGuard>
      } />
      <Route path="/analytics" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><Analytics /></Layout>
        </RoleGuard>
      } />
      <Route path="/disputes" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><Disputes /></Layout>
        </RoleGuard>
      } />
      <Route path="/currency" element={
        <RoleGuard allowedRoles={['customer']}>
          <Layout><CurrencyExchange /></Layout>
        </RoleGuard>
      } />

      {/* Shared routes (all authenticated users) */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout><Settings /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/sessions" element={
        <ProtectedRoute>
          <Layout><Sessions /></Layout>
        </ProtectedRoute>
      } />

      {/* Teller routes */}
      <Route path="/teller" element={
        <RoleGuard allowedRoles={['teller', 'branch_manager', 'admin']}>
          <Layout><TellerDashboard /></Layout>
        </RoleGuard>
      } />

      {/* Manager routes */}
      <Route path="/manager" element={
        <RoleGuard allowedRoles={['branch_manager', 'admin']}>
          <Layout><ManagerDashboard /></Layout>
        </RoleGuard>
      } />

      {/* Compliance routes */}
      <Route path="/compliance" element={
        <RoleGuard allowedRoles={['compliance_officer', 'admin']}>
          <Layout><ComplianceDashboard /></Layout>
        </RoleGuard>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <RoleGuard allowedRoles={['admin']}>
          <Layout><AdminDashboard /></Layout>
        </RoleGuard>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  )
}
