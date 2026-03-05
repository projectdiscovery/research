import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, PlusCircle, Upload, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { disputesApi, transactionsApi } from '../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

const statusConfig = {
  pending: { label: 'Pending', cls: 'text-amber-400 bg-amber-400/10', icon: Clock },
  under_review: { label: 'Under Review', cls: 'text-blue-400 bg-blue-400/10', icon: Clock },
  resolved: { label: 'Resolved', cls: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle },
  denied: { label: 'Denied', cls: 'text-red-400 bg-red-400/10', icon: XCircle },
}

const disputeTypes = [
  { value: 'unauthorized', label: 'Unauthorized Transaction' },
  { value: 'duplicate', label: 'Duplicate Charge' },
  { value: 'merchant_error', label: 'Merchant Error' },
  { value: 'wrong_amount', label: 'Wrong Amount' },
  { value: 'other', label: 'Other' },
]

export default function Disputes() {
  const [disputes, setDisputes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFor, setUploadingFor] = useState(null)
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    transaction_id: '',
    dispute_type: 'unauthorized',
    description: '',
  })

  useEffect(() => {
    Promise.all([
      disputesApi.myDisputes(),
      transactionsApi.list({ limit: 50 }),
    ]).then(([dRes, tRes]) => {
      setDisputes(dRes.data)
      setTransactions(tRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.transaction_id) return
    setSubmitting(true)
    try {
      const res = await disputesApi.file({
        ...form,
        transaction_id: parseInt(form.transaction_id),
      })
      setDisputes(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({ transaction_id: '', dispute_type: 'unauthorized', description: '' })
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to file dispute')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadEvidence = async (disputeId, file) => {
    setUploadingFor(disputeId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await disputesApi.uploadEvidence(disputeId, fd)
      setDisputes(prev => prev.map(d =>
        d.id === disputeId
          ? { ...d, evidence: [...(d.evidence || []), res.data] }
          : d
      ))
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingFor(null)
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
          <h1 className="text-2xl font-bold text-slate-100">Transaction Disputes</h1>
          <p className="text-slate-400 text-sm mt-0.5">Report unauthorized or incorrect transactions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusCircle size={16} />
          File Dispute
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-base font-semibold text-slate-100">New Dispute</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Select Transaction</label>
            <div className="relative">
              <select
                value={form.transaction_id}
                onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
                className="input-field appearance-none pr-9"
                required
              >
                <option value="">-- Select a transaction --</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.id}>
                    {formatCurrency(t.amount)} · {t.description || t.transaction_type} · {formatDate(t.created_at)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Dispute Type</label>
            <div className="relative">
              <select
                value={form.dispute_type}
                onChange={e => setForm(f => ({ ...f, dispute_type: e.target.value }))}
                className="input-field appearance-none pr-9"
              >
                {disputeTypes.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="input-field resize-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      )}

      {disputes.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No disputes filed</p>
          <p className="text-slate-500 text-sm mt-1">Report a transaction issue if needed</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-navy-400/40">
            {disputes.map(d => {
              const cfg = statusConfig[d.status] || statusConfig.pending
              const StatusIcon = cfg.icon
              return (
                <div key={d.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-100 capitalize">
                          {disputeTypes.find(t => t.value === d.dispute_type)?.label || d.dispute_type}
                        </span>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full flex items-center gap-1', cfg.cls)}>
                          <StatusIcon size={11} />{cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{d.description}</p>
                      {d.resolution && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Resolution: <span className="text-slate-200 capitalize">{d.resolution.replace('_', ' ')}</span>
                          {d.refund_amount && <span className="text-emerald-400"> · Refund: {formatCurrency(d.refund_amount)}</span>}
                        </p>
                      )}
                      {d.notes && <p className="text-xs text-slate-500 mt-0.5">{d.notes}</p>}
                    </div>
                    <p className="text-xs text-slate-500 flex-shrink-0">{formatDate(d.created_at)}</p>
                  </div>

                  {/* Evidence */}
                  {(d.evidence?.length > 0 || ['pending', 'under_review'].includes(d.status)) && (
                    <div className="pt-1">
                      {d.evidence?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {d.evidence.map(ev => (
                            <span key={ev.id} className="text-xs bg-navy-700 text-slate-300 px-2 py-1 rounded-lg">
                              {ev.filename}
                            </span>
                          ))}
                        </div>
                      )}
                      {['pending', 'under_review'].includes(d.status) && (
                        <>
                          <input
                            type="file"
                            ref={fileRef}
                            className="hidden"
                            onChange={e => {
                              if (e.target.files[0]) handleUploadEvidence(d.id, e.target.files[0])
                            }}
                          />
                          <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploadingFor === d.id}
                            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 disabled:opacity-50"
                          >
                            <Upload size={12} />
                            {uploadingFor === d.id ? 'Uploading...' : 'Attach Evidence'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
