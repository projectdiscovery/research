import { useState, useEffect } from 'react'
import { PlusCircle, FileText, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { loanApplicationsApi, accountsApi } from '../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

const statusConfig = {
  submitted: { label: 'Submitted', cls: 'text-blue-400 bg-blue-400/10', icon: Clock },
  auto_scored: { label: 'Under Review', cls: 'text-amber-400 bg-amber-400/10', icon: Clock },
  under_review: { label: 'Manager Review', cls: 'text-amber-400 bg-amber-400/10', icon: Clock },
  compliance_review: { label: 'Compliance Review', cls: 'text-purple-400 bg-purple-400/10', icon: AlertCircle },
  approved: { label: 'Approved', cls: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle },
  rejected: { label: 'Rejected', cls: 'text-red-400 bg-red-400/10', icon: XCircle },
  disbursed: { label: 'Disbursed', cls: 'text-gold-400 bg-gold-400/10', icon: CheckCircle },
}

const purposes = ['personal', 'home', 'auto', 'business', 'education', 'medical', 'other']

export default function Loans() {
  const [view, setView] = useState('list') // 'list' | 'apply'
  const [applications, setApplications] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({
    amount: '',
    term_months: '36',
    purpose: 'personal',
    description: '',
    annual_income: '',
    employment_status: 'employed',
    disburse_to_account_id: '',
  })

  useEffect(() => {
    Promise.all([loanApplicationsApi.myApplications(), accountsApi.list()])
      .then(([appsRes, accRes]) => {
        setApplications(appsRes.data)
        setAccounts(accRes.data)
        if (accRes.data.length > 0) {
          setForm(f => ({ ...f, disburse_to_account_id: String(accRes.data[0].id) }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await loanApplicationsApi.apply({
        ...form,
        amount: parseFloat(form.amount),
        term_months: parseInt(form.term_months),
        annual_income: form.annual_income ? parseFloat(form.annual_income) : null,
        disburse_to_account_id: form.disburse_to_account_id ? parseInt(form.disburse_to_account_id) : null,
      })
      setApplications(prev => [res.data, ...prev])
      setSuccess(res.data)
      setView('list')
    } catch (err) {
      alert(err.response?.data?.detail || 'Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Loan Applications</h1>
          <p className="text-slate-400 text-sm mt-0.5">Apply for personal, home, auto, or business loans</p>
        </div>
        <button
          onClick={() => setView(view === 'apply' ? 'list' : 'apply')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusCircle size={16} />
          {view === 'apply' ? 'Back to Applications' : 'Apply for Loan'}
        </button>
      </div>

      {success && (
        <div className="card border border-emerald-400/30 bg-emerald-400/5">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Application Submitted!</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Credit Score: <span className="text-slate-200">{success.credit_score}</span> ·
                Risk Level: <span className="text-slate-200 capitalize">{success.risk_level}</span> ·
                Rate: <span className="text-slate-200">{success.interest_rate}%</span> ·
                Est. Monthly: <span className="text-slate-200">{formatCurrency(success.monthly_payment)}</span>
              </p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">Dismiss</button>
          </div>
        </div>
      )}

      {view === 'apply' && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">New Loan Application</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Loan Amount</label>
              <input
                type="number"
                min="500"
                max="500000"
                step="100"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 15000"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Term (months)</label>
              <div className="relative">
                <select
                  value={form.term_months}
                  onChange={e => setForm(f => ({ ...f, term_months: e.target.value }))}
                  className="input-field appearance-none pr-9"
                >
                  {[12, 24, 36, 48, 60, 84, 120].map(m => (
                    <option key={m} value={m}>{m} months</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Purpose</label>
              <div className="relative">
                <select
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  className="input-field appearance-none pr-9 capitalize"
                >
                  {purposes.map(p => (
                    <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Disburse to Account</label>
              <div className="relative">
                <select
                  value={form.disburse_to_account_id}
                  onChange={e => setForm(f => ({ ...f, disburse_to_account_id: e.target.value }))}
                  className="input-field appearance-none pr-9"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} ···{a.account_number.slice(-4)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Annual Income (optional)</label>
              <input
                type="number"
                min="0"
                value={form.annual_income}
                onChange={e => setForm(f => ({ ...f, annual_income: e.target.value }))}
                placeholder="e.g. 75000"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Employment Status</label>
              <div className="relative">
                <select
                  value={form.employment_status}
                  onChange={e => setForm(f => ({ ...f, employment_status: e.target.value }))}
                  className="input-field appearance-none pr-9"
                >
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                  <option value="unemployed">Unemployed</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of loan purpose..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setView('list')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No loan applications</p>
          <p className="text-slate-500 text-sm mt-1">Apply for a loan to get started</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-navy-400">
            <span className="text-sm font-semibold text-slate-200">{applications.length} Application{applications.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-navy-400/40">
            {applications.map(app => {
              const cfg = statusConfig[app.status] || statusConfig.submitted
              const StatusIcon = cfg.icon
              return (
                <div key={app.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-100">{formatCurrency(app.amount)}</p>
                        <span className="text-xs capitalize text-slate-400">· {app.purpose} · {app.term_months}mo</span>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full flex items-center gap-1', cfg.cls)}>
                          <StatusIcon size={11} />{cfg.label}
                        </span>
                      </div>
                      {app.credit_score && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span>Score: <span className="text-slate-200">{app.credit_score}</span></span>
                          <span>Risk: <span className="text-slate-200 capitalize">{app.risk_level}</span></span>
                          {app.interest_rate && <span>Rate: <span className="text-slate-200">{app.interest_rate}%</span></span>}
                          {app.monthly_payment && <span>Est. monthly: <span className="text-slate-200">{formatCurrency(app.monthly_payment)}</span></span>}
                        </div>
                      )}
                      {app.description && <p className="text-xs text-slate-500 mt-1">{app.description}</p>}
                      {app.rejection_reason && <p className="text-xs text-red-400 mt-1">Reason: {app.rejection_reason}</p>}
                      {app.disbursed_at && <p className="text-xs text-emerald-400 mt-1">Disbursed on {formatDate(app.disbursed_at)}</p>}
                    </div>
                    <p className="text-xs text-slate-500 flex-shrink-0">{formatDate(app.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
