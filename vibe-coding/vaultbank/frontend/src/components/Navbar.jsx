import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Shield, Menu, X, LayoutDashboard, ArrowLeftRight, History,
  Settings, LogOut, Users, Building2, ShieldCheck, Crown, Receipt,
  FileText, Clock, BarChart3, AlertTriangle, Globe, Monitor,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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

export default function Navbar({ notificationBell }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setOpen(false)
  }

  const navItems = navByRole[user?.role] || navByRole.customer

  return (
    <header className="lg:hidden bg-navy-800 border-b border-navy-400 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-navy-900" />
          </div>
          <span className="text-base font-bold text-slate-100">VaultBank</span>
        </div>
        <div className="flex items-center gap-2">
          {notificationBell}
          <div className="w-8 h-8 rounded-full bg-gold-400/20 border border-gold-400/30 flex items-center justify-center">
            <span className="text-gold-400 text-xs font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-600 transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-navy-400 bg-navy-800 px-3 pb-4">
          <nav className="pt-3 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gold-400/10 text-gold-400'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-navy-600'
                  )
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
