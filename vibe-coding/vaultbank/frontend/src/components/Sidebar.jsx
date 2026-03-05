import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, History, Settings, LogOut, Shield,
  Users, Building2, ShieldCheck, Crown, Receipt, FileText,
  Clock, BarChart3, AlertTriangle, Globe, Monitor,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import clsx from 'clsx'

const navByRole = {
  customer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: History, label: 'Transactions' },
    { to: '/transfer', icon: ArrowLeftRight, label: 'Transfer' },
    { to: '/bills', icon: Receipt, label: 'Bills' },
    { to: '/loans', icon: FileText, label: 'Loans' },
    { to: '/scheduled-payments', icon: Clock, label: 'Scheduled' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/disputes', icon: AlertTriangle, label: 'Disputes' },
    { to: '/currency', icon: Globe, label: 'FX Exchange' },
    { to: '/sessions', icon: Monitor, label: 'Sessions' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  teller: [
    { to: '/teller', icon: Users, label: 'Teller Dashboard' },
    { to: '/sessions', icon: Monitor, label: 'Sessions' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  branch_manager: [
    { to: '/manager', icon: Building2, label: 'Manager Dashboard' },
    { to: '/teller', icon: Users, label: 'Teller View' },
    { to: '/sessions', icon: Monitor, label: 'Sessions' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  compliance_officer: [
    { to: '/compliance', icon: ShieldCheck, label: 'Compliance' },
    { to: '/sessions', icon: Monitor, label: 'Sessions' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  admin: [
    { to: '/admin', icon: Crown, label: 'Admin Portal' },
    { to: '/sessions', icon: Monitor, label: 'Sessions' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
}

const roleLabel = {
  customer: 'Customer',
  teller: 'Teller',
  branch_manager: 'Branch Manager',
  compliance_officer: 'Compliance',
  admin: 'Administrator',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = navByRole[user?.role] || navByRole.customer

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-navy-800 border-r border-navy-400 min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-navy-400">
        <div className="w-9 h-9 bg-gold-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-navy-900" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-100">VaultBank</span>
          <p className="text-xs text-slate-500 -mt-0.5">Secure Banking</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-navy-600'
              )
            }
          >
            <Icon className="w-4.5 h-4.5" size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + notification + logout */}
      <div className="px-3 py-4 border-t border-navy-400">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2">
          <div className="w-9 h-9 rounded-full bg-gold-400/20 border border-gold-400/30 flex items-center justify-center flex-shrink-0">
            <span className="text-gold-400 text-sm font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500">{roleLabel[user?.role] || 'Member'}</p>
          </div>
          <NotificationBell />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-150"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
