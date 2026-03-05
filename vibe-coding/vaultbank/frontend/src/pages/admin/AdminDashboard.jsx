import { useState, useEffect } from 'react'
import { Search, Users, Building2, Settings, BarChart3, Plus, RefreshCw, CheckCircle, XCircle, ChevronDown, Globe } from 'lucide-react'
import { adminApi, currencyApi } from '../../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(v)
}

const ROLES = ['customer', 'teller', 'branch_manager', 'compliance_officer', 'admin']
const ROLE_LABELS = {
  customer: 'Customer', teller: 'Teller', branch_manager: 'Branch Manager',
  compliance_officer: 'Compliance', admin: 'Admin',
}

const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'branches', label: 'Branches', icon: Building2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'currency', label: 'FX Rates', icon: Globe },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [branches, setBranches] = useState([])
  const [settings, setSettings] = useState({})
  const [settingsEdits, setSettingsEdits] = useState({})
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [rates, setRates] = useState([])
  const [rateForm, setRateForm] = useState({ from_currency: 'USD', to_currency: 'EUR', rate: '' })

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'branches') loadBranches()
    if (activeTab === 'settings') loadSettings()
    if (activeTab === 'analytics') loadAnalytics()
    if (activeTab === 'currency') loadRates()
  }, [activeTab, usersPage, userSearch, roleFilter])

  const loadRates = async () => {
    const res = await currencyApi.getRates()
    setRates(res.data)
  }

  const handleSaveRate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await currencyApi.upsertRate({ ...rateForm, rate: parseFloat(rateForm.rate) })
      loadRates()
      setRateForm(f => ({ ...f, rate: '' }))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update rate')
    } finally { setSaving(false) }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({ page: usersPage, search: userSearch || undefined, role: roleFilter || undefined })
      setUsers(res.data.users)
      setUsersTotal(res.data.total)
    } finally { setLoading(false) }
  }

  const loadBranches = async () => {
    const res = await adminApi.getBranches()
    setBranches(res.data)
  }

  const loadSettings = async () => {
    const res = await adminApi.getSettings()
    setSettings(res.data)
    const edits = {}
    Object.entries(res.data).forEach(([k, v]) => { edits[k] = v.value })
    setSettingsEdits(edits)
  }

  const loadAnalytics = async () => {
    const res = await adminApi.getAnalytics()
    setAnalytics(res.data)
  }

  const handleRoleChange = async (userId, role) => {
    await adminApi.updateRole(userId, { role })
    loadUsers()
  }

  const handleToggleActive = async (userId) => {
    await adminApi.toggleActive(userId)
    loadUsers()
  }

  const handleCreateBranch = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.createBranch(newBranch)
      setNewBranch({ name: '', code: '', address: '' })
      loadBranches()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create branch')
    } finally { setSaving(false) }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(settingsEdits)
      loadSettings()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Portal</h1>
        <p className="text-slate-400 text-sm mt-0.5">System administration and configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 border border-navy-400 rounded-2xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === id ? 'bg-gold-400/10 text-gold-400' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1) }}
                placeholder="Search users..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUsersPage(1) }}
                className="input-field pr-8 py-2 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-4 px-5 py-3 border-b border-navy-400 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-navy-400/40">
                {users.map((u) => (
                  <div key={u.id} className="grid md:grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr] gap-3 md:gap-4 px-5 py-3.5 items-center hover:bg-navy-600/20">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-slate-500">ID: {u.id}</p>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    <div className="relative">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="w-full bg-navy-700 border border-navy-400 rounded-lg px-2 py-1.5 text-xs text-slate-300 appearance-none cursor-pointer"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </div>
                    <span className={clsx(
                      'text-xs font-medium px-2.5 py-1 rounded-full w-fit',
                      u.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                    )}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className={clsx('text-xs px-3 py-1.5 rounded-lg transition-colors',
                        u.is_active
                          ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                          : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                      )}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3 border-t border-navy-400 text-xs text-slate-500">
              <span>{usersTotal} total users</span>
              <div className="flex gap-2">
                <button disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Prev</button>
                <button disabled={users.length < 20} onClick={() => setUsersPage(p => p + 1)} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-100">Create Branch</h3>
            <form onSubmit={handleCreateBranch} className="space-y-3">
              <input value={newBranch.name} onChange={(e) => setNewBranch(b => ({ ...b, name: e.target.value }))} placeholder="Branch name" className="input-field py-2 text-sm" required />
              <input value={newBranch.code} onChange={(e) => setNewBranch(b => ({ ...b, code: e.target.value.toUpperCase() }))} placeholder="Branch code (e.g. MB001)" className="input-field py-2 text-sm" required />
              <input value={newBranch.address} onChange={(e) => setNewBranch(b => ({ ...b, address: e.target.value }))} placeholder="Address (optional)" className="input-field py-2 text-sm" />
              <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm">
                <Plus size={15} /> Create Branch
              </button>
            </form>
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-100">Existing Branches</h3>
            {branches.length === 0 ? (
              <p className="text-slate-500 text-sm">No branches yet</p>
            ) : (
              branches.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-navy-700 rounded-xl">
                  <Building2 size={16} className="text-gold-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.code} · {b.address || 'No address'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="card space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">System Settings</h3>
            <button onClick={handleSaveSettings} disabled={saving} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              {saving ? <div className="w-3 h-3 border border-navy-900 border-t-transparent rounded-full animate-spin" /> : null}
              Save Changes
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(settings).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  <p className="text-xs text-slate-500">{meta.description}</p>
                </div>
                <input
                  value={settingsEdits[key] ?? ''}
                  onChange={(e) => setSettingsEdits(s => ({ ...s, [key]: e.target.value }))}
                  className="input-field w-32 py-1.5 text-sm text-right"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Volume', value: formatCurrency(analytics.total_volume), color: 'text-gold-400' },
              { label: 'Total Accounts', value: analytics.total_accounts, color: 'text-blue-400' },
              { label: 'Pending Approvals', value: analytics.pending_approvals, color: 'text-amber-400' },
              { label: 'Flagged Transactions', value: analytics.flagged_transactions, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={clsx('text-2xl font-bold mt-1', color)}>{value}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-100 mb-4">Users by Role</h3>
            <div className="space-y-3">
              {Object.entries(analytics.user_counts).map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-36 capitalize">{ROLE_LABELS[role] || role}</span>
                  <div className="flex-1 bg-navy-700 rounded-full h-2">
                    <div
                      className="bg-gold-400 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (count / (analytics.user_counts.customer || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-200 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency / FX Rates Tab */}
      {activeTab === 'currency' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-100">Update Exchange Rate</h3>
            <form onSubmit={handleSaveRate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From</label>
                  <select value={rateForm.from_currency} onChange={e => setRateForm(f => ({ ...f, from_currency: e.target.value }))} className="input-field py-2 text-sm">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">To</label>
                  <select value={rateForm.to_currency} onChange={e => setRateForm(f => ({ ...f, to_currency: e.target.value }))} className="input-field py-2 text-sm">
                    {CURRENCIES.filter(c => c !== rateForm.from_currency).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rate (1 {rateForm.from_currency} = ? {rateForm.to_currency})</label>
                <input
                  type="number" step="0.000001" min="0.000001"
                  value={rateForm.rate}
                  onChange={e => setRateForm(f => ({ ...f, rate: e.target.value }))}
                  placeholder="e.g. 0.919500"
                  className="input-field py-2 text-sm"
                  required
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
                {saving ? 'Saving...' : 'Update Rate'}
              </button>
            </form>
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-100">Current Rates</h3>
            {rates.length === 0 ? (
              <p className="text-slate-500 text-sm">No rates configured</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rates.map(r => (
                  <div key={`${r.from_currency}-${r.to_currency}`} className="flex items-center justify-between p-3 bg-navy-700 rounded-xl">
                    <span className="text-sm text-slate-300 font-medium">{r.from_currency} → {r.to_currency}</span>
                    <span className="text-sm font-semibold text-gold-400">{Number(r.rate).toFixed(6)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
