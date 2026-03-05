import { useState } from 'react'
import { Search, User, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, History, CheckCircle, AlertCircle } from 'lucide-react'
import { tellerApi } from '../../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

const opTabs = [
  { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
  { id: 'withdrawal', label: 'Withdrawal', icon: ArrowUpRight },
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  { id: 'history', label: 'History', icon: History },
]

export default function TellerDashboard() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [opTab, setOpTab] = useState('deposit')
  const [form, setForm] = useState({ account_id: '', amount: '', description: '', to_account_number: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await tellerApi.searchCustomers(query)
      setResults(res.data)
    } catch { setResults([]) }
    finally { setSearching(false) }
  }

  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer)
    setResults([])
    setQuery(customer.email)
    setSuccess(null)
    setError('')
    const [accRes, txnRes] = await Promise.all([
      tellerApi.getCustomerAccounts(customer.id),
      tellerApi.getCustomerTransactions(customer.id, { limit: 20 }),
    ])
    setAccounts(accRes.data)
    setTransactions(txnRes.data)
    if (accRes.data.length > 0) setForm(f => ({ ...f, account_id: accRes.data[0].id }))
  }

  const handleOp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return setError('Enter a valid amount')
    setLoading(true)
    try {
      let res
      if (opTab === 'deposit') {
        res = await tellerApi.deposit({ account_id: Number(form.account_id), amount, description: form.description || 'Teller deposit' })
      } else if (opTab === 'withdrawal') {
        res = await tellerApi.withdraw({ account_id: Number(form.account_id), amount, description: form.description || 'Teller withdrawal' })
      } else if (opTab === 'transfer') {
        if (!form.to_account_number.trim()) return setError('Enter destination account number')
        res = await tellerApi.transfer({ from_account_id: Number(form.account_id), to_account_number: form.to_account_number, amount, description: form.description || 'Teller transfer' })
      }
      setSuccess(res.data)
      setForm(f => ({ ...f, amount: '', description: '', to_account_number: '' }))
      // Refresh accounts
      const accRes = await tellerApi.getCustomerAccounts(selectedCustomer.id)
      setAccounts(accRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Teller Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Search customers and perform banking operations</p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or email..."
              className="input-field pl-9 py-2.5 text-sm"
            />
          </div>
          <button onClick={handleSearch} disabled={searching} className="btn-primary px-5 text-sm">
            {searching ? <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" /> : 'Search'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-3 border border-navy-400 rounded-xl overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => selectCustomer(r)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-600/50 transition-colors text-left border-b border-navy-400/40 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 text-xs font-bold">{r.first_name[0]}{r.last_name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{r.first_name} {r.last_name}</p>
                  <p className="text-xs text-slate-500">{r.email} · {r.account_tier}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Customer Info + Accounts */}
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-bold">{selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                {accounts.map((a) => (
                  <div key={a.id} className={clsx('p-3 rounded-xl border', a.is_frozen ? 'border-red-400/30 bg-red-400/5' : 'border-navy-400 bg-navy-700')}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-slate-500 capitalize">{a.account_type}</p>
                        <p className="text-sm font-mono text-slate-300">···{a.account_number.slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-100">{formatCurrency(a.balance)}</p>
                        {a.is_frozen && <span className="text-xs text-red-400">Frozen</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Operations */}
          <div className="lg:col-span-2 space-y-4">
            {/* Op tabs */}
            <div className="flex gap-1 bg-navy-800 border border-navy-400 rounded-2xl p-1 w-fit">
              {opTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setOpTab(id); setSuccess(null); setError('') }}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    opTab === id ? 'bg-gold-400/10 text-gold-400' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {opTab === 'history' ? (
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-400 text-sm font-semibold text-slate-200">Recent Transactions</div>
                <div className="divide-y divide-navy-400/40 max-h-80 overflow-y-auto">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-slate-200">{t.description || t.transaction_type}</p>
                        <p className="text-xs text-slate-500">{formatDate(t.created_at)} · {t.reference_number}</p>
                      </div>
                      <p className={clsx('text-sm font-semibold', t.transaction_type === 'deposit' ? 'text-emerald-400' : 'text-red-400')}>
                        {t.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card">
                <form onSubmit={handleOp} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
                      <AlertCircle size={15} />{error}
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl text-emerald-400 text-sm">
                      <CheckCircle size={15} />Operation successful · Ref: {success.reference_number}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Account</label>
                    <select value={form.account_id} onChange={(e) => setForm(f => ({ ...f, account_id: e.target.value }))} className="input-field text-sm">
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_type} ···{a.account_number.slice(-4)} — {formatCurrency(a.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {opTab === 'transfer' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Destination Account Number</label>
                      <input value={form.to_account_number} onChange={(e) => setForm(f => ({ ...f, to_account_number: e.target.value }))} placeholder="VB..." className="input-field text-sm" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input-field pl-7 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description <span className="text-slate-500">(optional)</span></label>
                    <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Note..." className="input-field text-sm" />
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    {loading && <div className="w-3 h-3 border border-navy-900 border-t-transparent rounded-full animate-spin" />}
                    {opTab === 'deposit' ? 'Process Deposit' : opTab === 'withdrawal' ? 'Process Withdrawal' : 'Process Transfer'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
