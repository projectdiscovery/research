import { useState, useEffect } from 'react'
import { Flag, ShieldAlert, GitBranch, FileText, Lock, Unlock, AlertTriangle, CheckCircle, Search, MessageSquare, XCircle, Clock } from 'lucide-react'
import { complianceApi, disputesApi, loanApplicationsApi } from '../../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

const tabs = [
  { id: 'flagged', label: 'Flagged Txns', icon: Flag },
  { id: 'holds', label: 'Account Holds', icon: Lock },
  { id: 'disputes', label: 'Disputes', icon: MessageSquare },
  { id: 'loans', label: 'Loan Review', icon: FileText },
  { id: 'audit', label: 'Audit Trail', icon: GitBranch },
  { id: 'report', label: 'SAR', icon: ShieldAlert },
]

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('flagged')
  const [transactions, setTransactions] = useState([])
  const [frozenAccounts, setFrozenAccounts] = useState([])
  const [auditTrail, setAuditTrail] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [flagModal, setFlagModal] = useState(null)
  const [flagReason, setFlagReason] = useState('')
  const [holdModal, setHoldModal] = useState(null)
  const [holdReason, setHoldReason] = useState('')
  const [auditParams, setAuditParams] = useState({ from_date: '', to_date: '' })
  const [showAll, setShowAll] = useState(false)
  const [disputesList, setDisputesList] = useState([])
  const [resolveModal, setResolveModal] = useState(null)
  const [resolveData, setResolveData] = useState({ resolution: 'denied', notes: '', refund_amount: '' })
  const [loanQueue, setLoanQueue] = useState([])

  useEffect(() => {
    if (activeTab === 'flagged') loadFlagged()
    if (activeTab === 'holds') loadFrozen()
    if (activeTab === 'audit') loadAudit()
    if (activeTab === 'report') loadReport()
    if (activeTab === 'disputes') loadDisputes()
    if (activeTab === 'loans') loadLoanQueue()
  }, [activeTab, showAll])

  const loadDisputes = async () => {
    setLoading(true)
    try {
      const res = await disputesApi.allDisputes({ status: 'pending', limit: 50 })
      setDisputesList(res.data)
    } finally { setLoading(false) }
  }

  const loadLoanQueue = async () => {
    setLoading(true)
    try {
      const res = await loanApplicationsApi.getComplianceQueue()
      setLoanQueue(res.data)
    } finally { setLoading(false) }
  }

  const handleResolveDispute = async () => {
    if (!resolveModal) return
    try {
      await disputesApi.review(resolveModal, {
        resolution: resolveData.resolution,
        notes: resolveData.notes || null,
        refund_amount: resolveData.refund_amount ? parseFloat(resolveData.refund_amount) : null,
      })
      setDisputesList(prev => prev.filter(d => d.id !== resolveModal))
      setResolveModal(null)
    } catch (err) { alert(err.response?.data?.detail || 'Failed to resolve') }
  }

  const handleLoanComplianceReview = async (id, action) => {
    try {
      await loanApplicationsApi.complianceReview(id, { action, notes: null })
      setLoanQueue(prev => prev.filter(a => a.id !== id))
    } catch (err) { alert(err.response?.data?.detail || 'Review failed') }
  }

  const loadFlagged = async () => {
    setLoading(true)
    try {
      const res = await complianceApi.getTransactions({ flagged: showAll ? undefined : true, limit: 50 })
      setTransactions(res.data)
    } finally { setLoading(false) }
  }

  const loadFrozen = async () => {
    setLoading(true)
    try {
      // get all transactions - frozen accounts would be tracked via compliance holds
      const res = await complianceApi.getAuditTrail({ limit: 1 })
      // Load the suspicious report to get frozen accounts
      const rptRes = await complianceApi.getSuspiciousReport()
      setFrozenAccounts(rptRes.data.frozen_accounts || [])
    } finally { setLoading(false) }
  }

  const loadAudit = async () => {
    setLoading(true)
    try {
      const params = {}
      if (auditParams.from_date) params.from_date = auditParams.from_date
      if (auditParams.to_date) params.to_date = auditParams.to_date
      const res = await complianceApi.getAuditTrail({ ...params, limit: 100 })
      setAuditTrail(res.data)
    } finally { setLoading(false) }
  }

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await complianceApi.getSuspiciousReport()
      setReport(res.data)
    } finally { setLoading(false) }
  }

  const handleFlag = async () => {
    if (!flagModal) return
    try {
      await complianceApi.flagTransaction(flagModal, flagReason)
      setFlagModal(null)
      setFlagReason('')
      loadFlagged()
    } catch (err) { alert(err.response?.data?.detail || 'Failed to flag') }
  }

  const handleUnflag = async (id) => {
    await complianceApi.unflagTransaction(id)
    loadFlagged()
  }

  const handleHold = async () => {
    if (!holdModal) return
    try {
      await complianceApi.placeHold(holdModal, holdReason)
      setHoldModal(null)
      setHoldReason('')
      loadFrozen()
    } catch (err) { alert(err.response?.data?.detail || 'Failed to place hold') }
  }

  const handleRemoveHold = async (id) => {
    await complianceApi.removeHold(id)
    loadFrozen()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Compliance Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Monitor transactions, manage holds, and generate reports</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-navy-800 border border-navy-400 rounded-2xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              activeTab === id ? 'bg-gold-400/10 text-gold-400' : 'text-slate-400 hover:text-slate-200'
            )}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Flagged Transactions */}
      {activeTab === 'flagged' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-400">Show all transactions</span>
            </label>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr] gap-4 px-5 py-3 border-b border-navy-400 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Transaction</span><span>Amount</span><span>Status</span><span>Flag Reason</span><span>Actions</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No transactions found</div>
            ) : (
              <div className="divide-y divide-navy-400/40">
                {transactions.map((t) => (
                  <div key={t.id} className="grid md:grid-cols-[2fr_1fr_1fr_1.5fr_1fr] gap-3 md:gap-4 px-5 py-3.5 items-center hover:bg-navy-600/20">
                    <div>
                      <p className="text-sm text-slate-200 truncate">{t.description || t.transaction_type}</p>
                      <p className="text-xs text-slate-500 font-mono">{t.reference_number}</p>
                      <p className="text-xs text-slate-600">{formatDate(t.created_at)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{formatCurrency(t.amount)}</p>
                    <span className={clsx('text-xs px-2 py-1 rounded-full w-fit capitalize',
                      t.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'
                    )}>{t.status?.replace('_', ' ')}</span>
                    <p className={clsx('text-xs', t.is_flagged ? 'text-red-400' : 'text-slate-500')}>
                      {t.is_flagged ? t.flag_reason || 'Flagged' : '—'}
                    </p>
                    <div className="flex gap-2">
                      {t.is_flagged ? (
                        <button onClick={() => handleUnflag(t.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-400/20">
                          <CheckCircle size={12} />Unflag
                        </button>
                      ) : (
                        <button onClick={() => { setFlagModal(t.id); setFlagReason('') }} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-400/10 text-red-400 rounded-lg text-xs hover:bg-red-400/20">
                          <Flag size={12} />Flag
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Holds */}
      {activeTab === 'holds' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-100 mb-3">Place Account Hold</h3>
            <div className="flex gap-3">
              <input
                value={holdModal?.toString() || ''}
                onChange={(e) => setHoldModal(e.target.value ? Number(e.target.value) : null)}
                placeholder="Account ID..."
                type="number"
                className="input-field w-32 py-2 text-sm"
              />
              <input
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Reason for hold..."
                className="input-field flex-1 py-2 text-sm"
              />
              <button onClick={handleHold} disabled={!holdModal || !holdReason} className="btn-primary px-4 text-sm disabled:opacity-50">Place Hold</button>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-400 text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Lock size={14} className="text-red-400" />Frozen Accounts ({frozenAccounts.length})
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : frozenAccounts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No frozen accounts</div>
            ) : (
              <div className="divide-y divide-navy-400/40">
                {frozenAccounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-mono text-slate-200">{a.account_number}</p>
                      <p className="text-xs text-slate-500 capitalize">{a.account_type} · {formatCurrency(a.balance)}</p>
                      <p className="text-xs text-red-400 mt-0.5">{a.freeze_reason}</p>
                      <p className="text-xs text-slate-600">{formatDate(a.frozen_at)}</p>
                    </div>
                    <button onClick={() => handleRemoveHold(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-400/20">
                      <Unlock size={13} />Remove Hold
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="card flex gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">From Date</label>
              <input type="date" value={auditParams.from_date} onChange={(e) => setAuditParams(p => ({ ...p, from_date: e.target.value }))} className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To Date</label>
              <input type="date" value={auditParams.to_date} onChange={(e) => setAuditParams(p => ({ ...p, to_date: e.target.value }))} className="input-field py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <button onClick={loadAudit} className="btn-primary px-5 text-sm py-2">Search</button>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-navy-400 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Transaction</span><span>Amount</span><span>Status</span><span>Processed By</span><span>Flags</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="divide-y divide-navy-400/40 max-h-[500px] overflow-y-auto">
                {auditTrail.map((t) => (
                  <div key={t.id} className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 px-5 py-3 items-center hover:bg-navy-600/20">
                    <div>
                      <p className="text-xs text-slate-300 truncate">{t.description || t.transaction_type}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{t.reference_number}</p>
                      <p className="text-[10px] text-slate-600">{formatDate(t.created_at)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-300">{formatCurrency(t.amount)}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full w-fit capitalize',
                      t.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' :
                      t.status === 'pending_approval' ? 'bg-amber-400/10 text-amber-400' :
                      t.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-slate-400/10 text-slate-400'
                    )}>{t.status?.replace('_', ' ')}</span>
                    <p className="text-xs text-slate-500">{t.processed_by_id ? `#${t.processed_by_id}` : '—'}</p>
                    <div className="flex items-center gap-1">
                      {t.is_flagged && <span className="flex items-center gap-1 text-xs text-red-400"><Flag size={11} />Flagged</span>}
                      {t.requires_approval && <span className="text-xs text-amber-400">Approval</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suspicious Activity Report */}
      {activeTab === 'report' && report && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Large Transactions (>$10k)', value: report.large_transactions?.length, color: 'text-amber-400' },
              { label: 'Flagged Transactions', value: report.flagged_transactions?.length, color: 'text-red-400' },
              { label: 'Frozen Accounts', value: report.frozen_accounts?.length, color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={clsx('text-2xl font-bold mt-1', color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-400" />Large Transactions (&gt;$10,000)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.large_transactions?.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-navy-700 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-200 truncate">{t.description || t.transaction_type}</p>
                    <p className="text-xs text-slate-500 font-mono">{t.reference_number} · {formatDate(t.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(t.amount)}</p>
                    {t.is_flagged && <span className="text-xs text-red-400">Flagged</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2"><Flag size={15} className="text-red-400" />Flagged Transactions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.flagged_transactions?.map((t) => (
                <div key={t.id} className="p-3 bg-navy-700 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-200 truncate">{t.description}</p>
                    <p className="text-sm font-bold text-red-400 flex-shrink-0 ml-3">{formatCurrency(t.amount)}</p>
                  </div>
                  <p className="text-xs text-red-400/80 mt-1">{t.flag_reason}</p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">{t.reference_number}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disputes */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : disputesList.length === 0 ? (
            <div className="card text-center py-12">
              <MessageSquare size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No pending disputes</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-navy-400/40">
                {disputesList.map(d => (
                  <div key={d.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-100 capitalize">{d.dispute_type.replace('_', ' ')}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 flex items-center gap-1"><Clock size={11} />Pending</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{d.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Filed: {formatDate(d.created_at)}</p>
                      {d.evidence?.length > 0 && <p className="text-xs text-blue-400 mt-0.5">{d.evidence.length} evidence file(s)</p>}
                    </div>
                    <button
                      onClick={() => { setResolveModal(d.id); setResolveData({ resolution: 'denied', notes: '', refund_amount: '' }) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-400/10 text-gold-400 border border-gold-400/20 rounded-xl text-xs font-medium hover:bg-gold-400/20 flex-shrink-0"
                    >
                      <CheckCircle size={12} />Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loan Compliance Queue */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : loanQueue.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No loan applications awaiting compliance review</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y divide-navy-400/40">
                {loanQueue.map(app => (
                  <div key={app.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-100">{formatCurrency(app.amount)}</p>
                        <span className="text-xs text-slate-400 capitalize">· {app.purpose} · {app.term_months}mo</span>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full',
                          app.risk_level === 'low' ? 'bg-emerald-400/10 text-emerald-400' :
                          app.risk_level === 'medium' ? 'bg-amber-400/10 text-amber-400' :
                          'bg-red-400/10 text-red-400'
                        )}>Score: {app.credit_score} · {app.risk_level} risk</span>
                      </div>
                      {app.manager_notes && <p className="text-xs text-slate-400 mt-1">Manager: {app.manager_notes}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleLoanComplianceReview(app.id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-400/20">
                        <CheckCircle size={12} />Approve
                      </button>
                      <button onClick={() => handleLoanComplianceReview(app.id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-xl text-xs font-medium hover:bg-red-400/20">
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

      {/* Dispute Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-400 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Resolve Dispute</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Resolution</label>
              <select
                value={resolveData.resolution}
                onChange={e => setResolveData(d => ({ ...d, resolution: e.target.value }))}
                className="input-field"
              >
                <option value="reversed">Full Reversal</option>
                <option value="partial_refund">Partial Refund</option>
                <option value="denied">Deny Dispute</option>
              </select>
            </div>
            {resolveData.resolution === 'partial_refund' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Refund Amount</label>
                <input
                  type="number" min="0" step="0.01"
                  value={resolveData.refund_amount}
                  onChange={e => setResolveData(d => ({ ...d, refund_amount: e.target.value }))}
                  placeholder="0.00" className="input-field"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
              <input value={resolveData.notes} onChange={e => setResolveData(d => ({ ...d, notes: e.target.value }))} placeholder="..." className="input-field" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setResolveModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleResolveDispute} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-400 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Flag Transaction</h3>
            <input value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="Reason for flagging..." className="input-field" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setFlagModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleFlag} className="flex-1 py-2.5 px-4 bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl text-sm font-medium hover:bg-red-400/20">Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
