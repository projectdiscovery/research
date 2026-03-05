import { useState, useEffect } from 'react'
import { ArrowLeftRight, RefreshCw, TrendingUp } from 'lucide-react'
import { currencyApi, accountsApi } from '../services/api'
import clsx from 'clsx'

function formatCurrency(v, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v)
}

const currencyFlags = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', CAD: '🇨🇦', AUD: '🇦🇺' }

export default function CurrencyExchange() {
  const [accounts, setAccounts] = useState([])
  const [rates, setRates] = useState([])
  const [supported, setSupported] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [quote, setQuote] = useState(null)
  const [form, setForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: '',
  })

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      currencyApi.getRates(),
      currencyApi.getSupported(),
    ]).then(([accRes, ratesRes, suppRes]) => {
      setAccounts(accRes.data)
      setRates(ratesRes.data)
      setSupported(suppRes.data)
      if (accRes.data.length >= 2) {
        setForm(f => ({
          ...f,
          from_account_id: String(accRes.data[0].id),
          to_account_id: String(accRes.data[1].id),
        }))
      }
    }).finally(() => setLoading(false))
  }, [])

  const fromAccount = accounts.find(a => String(a.id) === form.from_account_id)
  const toAccount = accounts.find(a => String(a.id) === form.to_account_id)

  const fetchQuote = async () => {
    if (!fromAccount || !toAccount || !form.amount) return
    if (fromAccount.currency === toAccount.currency) { setQuote(null); return }
    try {
      const res = await currencyApi.getQuote({
        from_currency: fromAccount.currency,
        to_currency: toAccount.currency,
        amount: parseFloat(form.amount),
      })
      setQuote(res.data)
    } catch {
      setQuote(null)
    }
  }

  useEffect(() => {
    if (form.amount && parseFloat(form.amount) > 0) {
      const t = setTimeout(fetchQuote, 500)
      return () => clearTimeout(t)
    }
  }, [form.amount, form.from_account_id, form.to_account_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await currencyApi.convert({
        from_account_id: parseInt(form.from_account_id),
        to_account_id: parseInt(form.to_account_id),
        amount: parseFloat(form.amount),
        description: form.description || null,
      })
      setSuccess(res.data)
      setForm(f => ({ ...f, amount: '', description: '' }))
      setQuote(null)
      // Refresh accounts
      const accRes = await accountsApi.list()
      setAccounts(accRes.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Conversion failed')
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
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Currency Exchange</h1>
        <p className="text-slate-400 text-sm mt-0.5">Convert between currencies across your accounts</p>
      </div>

      {success && (
        <div className="card border border-emerald-400/30 bg-emerald-400/5">
          <div className="flex items-start gap-3">
            <RefreshCw size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Conversion Complete</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Deducted: <span className="text-slate-200">{formatCurrency(success.deducted, success.from_currency)} {success.from_currency}</span> ·
                Credited: <span className="text-slate-200">{formatCurrency(success.credited, success.to_currency)} {success.to_currency}</span> ·
                Rate: <span className="text-slate-200">{success.rate.toFixed(4)}</span>
              </p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">Dismiss</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Exchange form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-base font-semibold text-slate-100">Convert Currency</h2>

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
                  {currencyFlags[a.currency] || ''} {a.currency} · {a.account_type} ···{a.account_number.slice(-4)} · {formatCurrency(a.balance, a.currency)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-navy-700 border border-navy-400 flex items-center justify-center">
              <ArrowLeftRight size={14} className="text-gold-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">To Account</label>
            <select
              value={form.to_account_id}
              onChange={e => setForm(f => ({ ...f, to_account_id: e.target.value }))}
              className="input-field"
              required
            >
              {accounts.filter(a => String(a.id) !== form.from_account_id).map(a => (
                <option key={a.id} value={a.id}>
                  {currencyFlags[a.currency] || ''} {a.currency} · {a.account_type} ···{a.account_number.slice(-4)} · {formatCurrency(a.balance, a.currency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Amount ({fromAccount?.currency || 'USD'})</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="input-field"
              required
            />
          </div>

          {quote && fromAccount?.currency !== toAccount?.currency && (
            <div className="bg-navy-700 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Exchange Rate</span>
                <span className="text-slate-200">1 {quote.from_currency} = {quote.rate.toFixed(4)} {quote.to_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">You'll Receive</span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(quote.converted, quote.to_currency)} {quote.to_currency}</span>
              </div>
            </div>
          )}

          {fromAccount?.currency === toAccount?.currency && (
            <p className="text-xs text-amber-400">Both accounts have the same currency. Please select accounts with different currencies.</p>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Note (optional)</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Travel funds"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || fromAccount?.currency === toAccount?.currency}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? 'Converting...' : 'Convert Currency'}
          </button>
        </form>

        {/* Live rates */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-slate-100">Live Exchange Rates</h2>
          </div>
          {rates.length === 0 ? (
            <p className="text-slate-500 text-sm">No rates available</p>
          ) : (
            <div className="space-y-2">
              {rates.map(r => (
                <div key={`${r.from_currency}-${r.to_currency}`} className="flex items-center justify-between py-2 border-b border-navy-400/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{currencyFlags[r.from_currency] || ''}</span>
                    <span className="text-sm text-slate-300 font-medium">{r.from_currency}</span>
                    <ArrowLeftRight size={12} className="text-slate-600" />
                    <span className="text-sm">{currencyFlags[r.to_currency] || ''}</span>
                    <span className="text-sm text-slate-300 font-medium">{r.to_currency}</span>
                  </div>
                  <span className="text-sm font-semibold text-gold-400">{Number(r.rate).toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
