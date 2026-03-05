import { useState, useEffect } from 'react'
import {
  ArrowRight, CheckCircle, AlertCircle, ChevronDown,
  User, CreditCard, MessageSquare, Plus, X
} from 'lucide-react'
import { accountsApi, transactionsApi, beneficiariesApi } from '../services/api'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function Transfer() {
  const [accounts, setAccounts] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [form, setForm] = useState({
    from_account_id: '',
    to_account_number: '',
    amount: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false)
  const [newBeneficiary, setNewBeneficiary] = useState({ name: '', account_number: '', bank_name: '' })

  useEffect(() => {
    accountsApi.list().then((r) => {
      setAccounts(r.data)
      if (r.data.length > 0) setForm((f) => ({ ...f, from_account_id: r.data[0].id }))
    })
    beneficiariesApi.list().then((r) => setBeneficiaries(r.data))
  }, [])

  const fromAccount = accounts.find((a) => a.id === parseInt(form.from_account_id))

  const handleSelectBeneficiary = (b) => {
    setForm((f) => ({ ...f, to_account_number: b.account_number }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!form.to_account_number.trim()) {
      setError('Please enter a destination account number')
      return
    }
    if (fromAccount && amount > parseFloat(fromAccount.balance)) {
      setError(`Insufficient funds. Available: ${formatCurrency(fromAccount.balance)}`)
      return
    }

    setLoading(true)
    try {
      const res = await transactionsApi.transfer({
        from_account_id: parseInt(form.from_account_id),
        to_account_number: form.to_account_number,
        amount: amount,
        description: form.description || undefined,
      })
      setSuccess(res.data)
      setForm((f) => ({ ...f, to_account_number: '', amount: '', description: '' }))
      // Refresh accounts
      accountsApi.list().then((r) => setAccounts(r.data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBeneficiary = async (e) => {
    e.preventDefault()
    try {
      const res = await beneficiariesApi.create(newBeneficiary)
      setBeneficiaries([...beneficiaries, res.data])
      setNewBeneficiary({ name: '', account_number: '', bank_name: '' })
      setShowAddBeneficiary(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add beneficiary')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Transfer Money</h1>
        <p className="text-slate-400 text-sm mt-0.5">Send funds securely to any VaultBank account</p>
      </div>

      {success && (
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-4">
          <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Transfer Successful!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              {formatCurrency(success.amount)} sent · Ref: {success.reference_number}
            </p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400/60 hover:text-emerald-400">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Beneficiaries quick select */}
      {beneficiaries.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Quick Send</h2>
            <button
              onClick={() => setShowAddBeneficiary(!showAddBeneficiary)}
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {beneficiaries.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBeneficiary(b)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all flex-shrink-0 ${
                  form.to_account_number === b.account_number
                    ? 'border-gold-400/40 bg-gold-400/10'
                    : 'border-navy-400 hover:border-navy-300 bg-navy-800'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-navy-600 border border-navy-400 flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-300">{b.name[0]}</span>
                </div>
                <p className="text-xs font-medium text-slate-300 whitespace-nowrap">{b.name.split(' ')[0]}</p>
                <p className="text-xs text-slate-600">{b.bank_name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add beneficiary form */}
      {showAddBeneficiary && (
        <div className="card border-gold-400/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Add Beneficiary</h3>
            <button onClick={() => setShowAddBeneficiary(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAddBeneficiary} className="grid grid-cols-3 gap-3">
            <div>
              <label className="label text-xs">Full Name</label>
              <input value={newBeneficiary.name} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                placeholder="Jane Smith" required className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="label text-xs">Account Number</label>
              <input value={newBeneficiary.account_number} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, account_number: e.target.value })}
                placeholder="VB1234567890" required className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="label text-xs">Bank Name</label>
              <input value={newBeneficiary.bank_name} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, bank_name: e.target.value })}
                placeholder="VaultBank" required className="input-field text-sm py-2" />
            </div>
            <div className="col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddBeneficiary(false)} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" className="btn-primary text-sm py-2">Save Beneficiary</button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <h2 className="text-base font-semibold text-slate-100">Transfer Details</h2>

        {/* From account */}
        <div>
          <label className="label flex items-center gap-1.5">
            <CreditCard size={13} /> From Account
          </label>
          <div className="relative">
            <select
              value={form.from_account_id}
              onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
              required
              className="input-field pr-9 appearance-none cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} —{' '}
                  {a.account_number} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          {fromAccount && (
            <p className="text-xs text-slate-500 mt-1.5">
              Available balance: <span className="text-gold-400 font-medium">{formatCurrency(fromAccount.balance)}</span>
            </p>
          )}
        </div>

        {/* To account */}
        <div>
          <label className="label flex items-center gap-1.5">
            <User size={13} /> To Account Number
          </label>
          <input
            type="text"
            value={form.to_account_number}
            onChange={(e) => setForm({ ...form, to_account_number: e.target.value })}
            placeholder="VB1234567890"
            required
            className="input-field font-mono"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="label">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              required
              className="input-field pl-8 text-lg font-semibold"
            />
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2">
            {[100, 250, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setForm({ ...form, amount: String(amt) })}
                className="text-xs px-3 py-1.5 bg-navy-600 hover:bg-navy-500 border border-navy-400 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label flex items-center gap-1.5">
            <MessageSquare size={13} /> Note <span className="text-slate-600 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's this for?"
            maxLength={100}
            className="input-field"
          />
        </div>

        {/* Summary */}
        {form.amount && parseFloat(form.amount) > 0 && (
          <div className="bg-navy-800 rounded-xl p-4 border border-navy-400">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Transfer Summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-slate-200 font-medium">{formatCurrency(parseFloat(form.amount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fee</span>
                <span className="text-emerald-400 font-medium">Free</span>
              </div>
              <div className="flex justify-between border-t border-navy-400 pt-1.5 mt-1.5">
                <span className="text-slate-300 font-semibold">Total Deducted</span>
                <span className="text-gold-400 font-bold">{formatCurrency(parseFloat(form.amount) || 0)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || accounts.length === 0}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Send Money <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
