import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { accountsApi, transactionsApi } from '../services/api'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

const CATEGORIES = ['Utilities', 'Telecom', 'Insurance', 'Credit Card', 'Other']

export default function BillPayment() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({
    from_account_id: '',
    biller_name: '',
    biller_category: 'Utilities',
    account_number: '',
    amount: '',
    due_date: '',
    reference: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    accountsApi.list().then((r) => {
      setAccounts(r.data)
      if (r.data.length > 0) setForm((f) => ({ ...f, from_account_id: r.data[0].id }))
    })
  }, [])

  const selectedAccount = accounts.find((a) => a.id === Number(form.from_account_id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.biller_name.trim()) return setError('Biller name is required')
    if (!form.account_number.trim()) return setError('Biller account number is required')
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return setError('Enter a valid amount')

    setLoading(true)
    try {
      const res = await transactionsApi.billPay({
        from_account_id: Number(form.from_account_id),
        biller_name: form.biller_name,
        biller_category: form.biller_category,
        account_number: form.account_number,
        amount,
        due_date: form.due_date || undefined,
        reference: form.reference || undefined,
      })
      setSuccess(res.data)
      setForm((f) => ({ ...f, biller_name: '', account_number: '', amount: '', due_date: '', reference: '' }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Bill payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Bill Payment</h1>
        </div>
        <div className="card text-center py-10 space-y-4">
          <div className="w-16 h-16 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-emerald-400 w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Payment Successful</h2>
            <p className="text-slate-400 text-sm mt-1">Your bill payment has been processed</p>
          </div>
          <div className="bg-navy-700 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="text-slate-100 font-semibold">{formatCurrency(success.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Reference</span>
              <span className="text-slate-300 font-mono text-xs">{success.reference_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="text-emerald-400 capitalize">{success.status}</span>
            </div>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="btn-primary w-full"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Bill Payment</h1>
        <p className="text-slate-400 text-sm mt-0.5">Pay your bills directly from your account</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* From account */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">From Account</label>
          <div className="relative">
            <select
              value={form.from_account_id}
              onChange={(e) => setForm((f) => ({ ...f, from_account_id: e.target.value }))}
              className="input-field pr-9 appearance-none cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} ···{a.account_number.slice(-4)} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          {selectedAccount && (
            <p className="text-xs text-slate-500 mt-1">
              Available: {formatCurrency(selectedAccount.balance - (selectedAccount.hold_amount || 0))}
            </p>
          )}
        </div>

        {/* Biller details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Biller Name</label>
            <input
              value={form.biller_name}
              onChange={(e) => setForm((f) => ({ ...f, biller_name: e.target.value }))}
              placeholder="e.g. Con Edison, AT&T"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <div className="relative">
              <select
                value={form.biller_category}
                onChange={(e) => setForm((f) => ({ ...f, biller_category: e.target.value }))}
                className="input-field pr-9 appearance-none cursor-pointer"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Biller Account Number</label>
          <input
            value={form.account_number}
            onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
            placeholder="Enter biller account/invoice number"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="input-field pl-7"
            />
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2">
            {[50, 100, 250, 500].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((f) => ({ ...f, amount: String(v) }))}
                className="text-xs px-2.5 py-1 rounded-lg bg-navy-600 text-slate-400 hover:text-gold-400 hover:bg-navy-500 transition-colors"
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Reference / Note <span className="text-slate-500">(optional)</span></label>
          <input
            value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            placeholder="Invoice # or note"
            className="input-field"
          />
        </div>

        {/* Summary */}
        {form.amount && (
          <div className="bg-navy-700 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="text-slate-200">{formatCurrency(form.amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fee</span>
              <span className="text-emerald-400">Free</span>
            </div>
            <div className="flex justify-between border-t border-navy-400 pt-2">
              <span className="text-slate-300 font-semibold">Total</span>
              <span className="text-slate-100 font-bold">{formatCurrency(form.amount || 0)}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CreditCard size={16} />
          )}
          {loading ? 'Processing...' : 'Pay Bill'}
        </button>
      </form>
    </div>
  )
}
