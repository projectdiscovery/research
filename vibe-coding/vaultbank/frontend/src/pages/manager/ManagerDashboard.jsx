import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, BarChart3, Users, Search, Lock, Unlock, AlertCircle, FileText, ChevronDown } from 'lucide-react'
import { managerApi, loanApplicationsApi } from '../../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

const tabs = [
  { id: 'approvals', label: 'Approvals', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: Lock },
  { id: 'loans', label: 'Loan Applications', icon: FileText },
]

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('approvals')
  const [approvals, setApprovals] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [accountSearch, setAccountSearch] = useState('')
  const [foundAccounts, setFoundAccounts] = useState([])
  const [freezeReason, setFreezeReason] = useState('')
  const [freezeTarget, setFreezeTarget] = useState(null)
  const [loanApps, setLoanApps] = useState([])
  const [reviewModal, setReviewModal] = useState(null)  // {id, action}
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewAction, setReviewAction] = useState('approve')
  const [disburseModal, setDisburseModal] = useState(null)

  useEffect(() => {
    if (activeTab === 'approvals') loadApprovals()
    if (activeTab === 'analytics') loadAnalytics()
    if (activeTab === 'loans') loadLoanApps()
  }, [activeTab])

  const loadLoanApps = async () => {
    setLoading(true)
    try {
      const res = await loanApplicationsApi.getPending()
      setLoanApps(res.data)
    } finally { setLoading(false) }
  }

  const handleManagerReview = async () => {
    if (!reviewModal) return
    try {
      await loanApplicationsApi.managerReview(reviewModal, { action: reviewAction, notes: reviewNotes })
      setLoanApps(prev => prev.filter(a => a.id !== reviewModal))
      setReviewModal(null)
      setReviewNotes('')
    } catch (err) {
      alert(err.response?.data?.detail || 'Review failed')
    }
  }

  const loadApprovals = async () => {
    setLoading(true)
    try {
      const res = await managerApi.getApprovals()
      setApprovals(res.data)
    } finally { setLoading(false) }
  }

  const loadAnalytics = async () => {
    const res = await managerApi.getAnalytics()
    setAnalytics(res.data)
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await managerApi.approve(id)
      setApprovals((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Approval failed')
    } finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal)
    try {
      await managerApi.reject(rejectModal, rejectReason || 'Rejected by branch manager')
      setApprovals((prev) => prev.filter((t) => t.id !== rejectModal))
      setRejectModal(null)
      setRejectReason('')
    } catch (err) {
      alert(err.response?.data?.detail || 'Rejection failed')
    } finally { setActionLoading(null) }
  }

  const searchAccounts = async () => {
    if (!accountSearch.trim()) return
    try {
      const res = await managerApi.searchAccounts(accountSearch)
      setFoundAccounts(res.data)
    } catch { setFoundAccounts([]) }
  }

  const handleFreeze = async (accountId, reason) => {
    try {
      await managerApi.freezeAccount(accountId, reason)
      setFoundAccounts(prev => prev.map(a => a.id === accountId ? { ...a, is_frozen: true, freeze_reason: reason } : a))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to freeze account')
    }
    setFreezeTarget(null)
    setFreezeReason('')
  }

  const handleUnfreeze = async (accountId) => {
    try {
      await managerApi.unfreezeAccount(accountId)
      setFoundAccounts(prev => prev.map(a => a.id === accountId ? { ...a, is_frozen: false, freeze_reason: null } : a))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to unfreeze account')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Manager Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage approvals, analytics, and account controls</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 border border-navy-400 rounded-2xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === id ? 'bg-gold-400/10 text-gold-400' : 'text-slate-400 hover:text-slate-200'
            )}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : approvals.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No pending approvals</p>
              <p className="text-slate-500 text-sm mt-1">All transactions are up to date</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-navy-400 flex items-center gap-2">
                <Clock size={15} className="text-amber-400" />
                <span className="text-sm font-semibold text-slate-200">{approvals.length} pending approval{approvals.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-navy-400/40">
                {approvals.map((txn) => (
                  <div key={txn.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-100">{formatCurrency(txn.amount)}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">Pending Approval</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{txn.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{txn.reference_number} · {formatDate(txn.created_at)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        disabled={actionLoading === txn.id}
                        onClick={() => handleApprove(txn.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-xl text-sm font-medium hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={14} />Approve
                      </button>
                      <button
                        disabled={actionLoading === txn.id}
                        onClick={() => { setRejectModal(txn.id); setRejectReason('') }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl text-sm font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} />Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Pending Approvals', value: analytics.pending_approvals, color: 'text-amber-400' },
              { label: 'Total Volume', value: formatCurrency(analytics.completed_volume), color: 'text-gold-400' },
              { label: 'Branch Tellers', value: analytics.tellers?.length || 0, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={clsx('text-2xl font-bold mt-1', color)}>{value}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2"><Users size={16} className="text-gold-400" />Branch Tellers</h3>
            {analytics.tellers?.length === 0 ? (
              <p className="text-slate-500 text-sm">No tellers assigned to this branch</p>
            ) : (
              <div className="space-y-2">
                {analytics.tellers?.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-navy-700 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold-400 text-xs font-bold">{t.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex gap-3">
              <input
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAccounts()}
                placeholder="Search by account number or ID..."
                className="input-field flex-1 py-2 text-sm"
              />
              <button onClick={searchAccounts} className="btn-primary px-5 text-sm">Search</button>
            </div>
          </div>

          {foundAccounts.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-navy-400/40">
                {foundAccounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200 font-mono">{a.account_number}</p>
                      <p className="text-xs text-slate-500 capitalize">{a.account_type} · {formatCurrency(a.balance)}</p>
                      {a.is_frozen && <p className="text-xs text-red-400 mt-0.5">Frozen: {a.freeze_reason}</p>}
                    </div>
                    <div className="flex gap-2">
                      {a.is_frozen ? (
                        <button onClick={() => handleUnfreeze(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-400/20">
                          <Unlock size={13} />Unfreeze
                        </button>
                      ) : (
                        <button onClick={() => setFreezeTarget(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-xl text-xs font-medium hover:bg-red-400/20">
                          <Lock size={13} />Freeze
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Freeze modal */}
          {freezeTarget && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-navy-800 border border-navy-400 rounded-2xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Freeze Account</h3>
                <input
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="Reason for freeze..."
                  className="input-field"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => setFreezeTarget(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={() => handleFreeze(freezeTarget, freezeReason || 'Frozen by manager')} className="flex-1 py-2.5 px-4 bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl text-sm font-medium hover:bg-red-400/20">Confirm Freeze</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loan Applications */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : loanApps.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No pending loan applications</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-navy-400/40">
                {loanApps.map(app => (
                  <div key={app.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-100">{formatCurrency(app.amount)}</p>
                        <span className="text-xs text-slate-400">· {app.purpose} · {app.term_months}mo</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">Score: {app.credit_score}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-navy-700 text-slate-400 capitalize">{app.risk_level} risk</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Rate: {app.interest_rate}% · Monthly: {formatCurrency(app.monthly_payment)}</p>
                      {app.description && <p className="text-xs text-slate-500 mt-0.5">{app.description}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setReviewModal(app.id); setReviewAction('approve'); setReviewNotes('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded-xl text-xs font-medium hover:bg-emerald-400/20"
                      >
                        <CheckCircle size={12} />Approve
                      </button>
                      <button
                        onClick={() => { setReviewModal(app.id); setReviewAction('send_compliance'); setReviewNotes('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-400/10 text-purple-400 border border-purple-400/20 rounded-xl text-xs font-medium hover:bg-purple-400/20"
                      >
                        <AlertCircle size={12} />Compliance
                      </button>
                      <button
                        onClick={() => { setReviewModal(app.id); setReviewAction('reject'); setReviewNotes('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl text-xs font-medium hover:bg-red-400/20"
                      >
                        <XCircle size={12} />Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loan Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-400 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">
              {reviewAction === 'approve' ? 'Approve' : reviewAction === 'send_compliance' ? 'Send to Compliance' : 'Reject'} Loan Application
            </h3>
            <input
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Notes (optional)..."
              className="input-field"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleManagerReview}
                className={clsx('flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
                  reviewAction === 'approve' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20' :
                  reviewAction === 'send_compliance' ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20 hover:bg-purple-400/20' :
                  'bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20'
                )}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-400 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Reject Transaction</h3>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="input-field"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} className="flex-1 py-2.5 px-4 bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl text-sm font-medium hover:bg-red-400/20">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
