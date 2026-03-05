import { useState, useEffect } from 'react'
import { Clock, PlusCircle, Trash2, Pause, Play, RefreshCw } from 'lucide-react'
import { scheduledPaymentsApi, accountsApi } from '../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

const recurrenceLabels = {
  one_time: 'One-Time',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
}

export default function ScheduledPayments() {
  const [payments, setPayments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    from_account_id: '',
    to_account_number: '',
    amount: '',
    description: '',
    recurrence: 'one_time',
    scheduled_for: '',
  })

  useEffect(() => {
    Promise.all([scheduledPaymentsApi.list(), accountsApi.list()])
      .then(([spRes, accRes]) => {
        setPayments(spRes.data)
        setAccounts(accRes.data)
        if (accRes.data.length > 0) {
          setForm(f => ({ ...f, from_account_id: String(accRes.data[0].id) }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Default scheduled_for to 1 hour from now
  const defaultScheduledFor = () => {
    const d = new Date(Date.now() + 3600000)
    return d.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await scheduledPaymentsApi.create({
        ...form,
        from_account_id: parseInt(form.from_account_id),
        amount: parseFloat(form.amount),
        scheduled_for: new Date(form.scheduled_for).toISOString(),
      })
      setPayments(prev => [res.data, ...prev])
      setShowForm(false)
      setForm(f => ({ ...f, to_account_number: '', amount: '', description: '', scheduled_for: '' }))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create payment')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (sp) => {
    try {
      const res = await scheduledPaymentsApi.update(sp.id, { is_active: !sp.is_active })
      setPayments(prev => prev.map(p => p.id === sp.id ? res.data : p))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheduled payment?')) return
    try {
      await scheduledPaymentsApi.delete(id)
      setPayments(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
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
          <h1 className="text-2xl font-bold text-slate-100">Scheduled Payments</h1>
          <p className="text-slate-400 text-sm mt-0.5">Set up one-time or recurring automatic transfers</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm(f => ({ ...f, scheduled_for: defaultScheduledFor() })) }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusCircle size={16} />
          New Payment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-base font-semibold text-slate-100">Schedule a Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">From Account</label>
              <select
                value={form.from_account_id}
                onChange={e => setForm(f => ({ ...f, from_account_id: e.target.value }))}
                className="input-field"
                required
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} ···{a.account_number.slice(-4)} · {formatCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">To Account Number</label>
              <input
                value={form.to_account_number}
                onChange={e => setForm(f => ({ ...f, to_account_number: e.target.value }))}
                placeholder="VB1234567890"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Amount</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Recurrence</label>
              <select
                value={form.recurrence}
                onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
                className="input-field"
              >
                {Object.entries(recurrenceLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Scheduled For</label>
              <input
                type="datetime-local"
                value={form.scheduled_for}
                onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Description (optional)</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly rent"
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? 'Scheduling...' : 'Schedule Payment'}
            </button>
          </div>
        </form>
      )}

      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No scheduled payments</p>
          <p className="text-slate-500 text-sm mt-1">Create your first automatic payment</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-navy-400/40">
            {payments.map(sp => (
              <div key={sp.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-100">{formatCurrency(sp.amount)}</p>
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      sp.is_active ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 bg-slate-500/10'
                    )}>
                      {recurrenceLabels[sp.recurrence]}
                    </span>
                    {!sp.is_active && <span className="text-xs text-slate-500">Paused</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">To: {sp.to_account_number}</p>
                  {sp.description && <p className="text-xs text-slate-500 mt-0.5">{sp.description}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">
                    Next: {formatDate(sp.next_run_at)}
                    {sp.last_run_at && ` · Last: ${formatDate(sp.last_run_at)}`}
                  </p>
                  {sp.failure_count > 0 && (
                    <p className="text-xs text-red-400 mt-0.5">
                      {sp.failure_count} failure{sp.failure_count !== 1 ? 's' : ''}{sp.last_failure_reason ? `: ${sp.last_failure_reason}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(sp)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                      sp.is_active
                        ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                        : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                    )}
                  >
                    {sp.is_active ? <><Pause size={12} />Pause</> : <><Play size={12} />Resume</>}
                  </button>
                  <button
                    onClick={() => handleDelete(sp.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-xl text-xs font-medium hover:bg-red-400/20"
                  >
                    <Trash2 size={12} />Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
