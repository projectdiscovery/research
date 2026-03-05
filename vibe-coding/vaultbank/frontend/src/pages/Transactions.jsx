import { useState, useEffect, useCallback } from 'react'
import {
  Search, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  CreditCard, ChevronDown, X, RefreshCw, Download, FileText
} from 'lucide-react'
import { accountsApi, transactionsApi, statementsApi } from '../services/api'
import clsx from 'clsx'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr))
}

const typeConfig = {
  deposit: { icon: ArrowDownLeft, label: 'Deposit', cls: 'text-emerald-400 bg-emerald-400/10' },
  withdrawal: { icon: ArrowUpRight, label: 'Withdrawal', cls: 'text-red-400 bg-red-400/10' },
  transfer: { icon: ArrowLeftRight, label: 'Transfer', cls: 'text-blue-400 bg-blue-400/10' },
  bill_payment: { icon: CreditCard, label: 'Bill Payment', cls: 'text-amber-400 bg-amber-400/10' },
  loan_disbursement: { icon: ArrowDownLeft, label: 'Loan', cls: 'text-purple-400 bg-purple-400/10' },
  scheduled_payment: { icon: ArrowLeftRight, label: 'Scheduled', cls: 'text-cyan-400 bg-cyan-400/10' },
  fx_conversion: { icon: ArrowLeftRight, label: 'FX Exchange', cls: 'text-gold-400 bg-gold-400/10' },
}

const statusBadge = {
  completed: 'text-emerald-400 bg-emerald-400/10',
  pending: 'text-amber-400 bg-amber-400/10',
  failed: 'text-red-400 bg-red-400/10',
  pending_approval: 'text-gold-400 bg-gold-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}

export default function Transactions() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    accountsApi.list().then((r) => setAccounts(r.data))
  }, [])

  const fetchTxns = useCallback(() => {
    setLoading(true)
    const params = { limit, offset, search: search || undefined, account_id: accountFilter || undefined }
    transactionsApi.list(params)
      .then((r) => setTransactions(r.data))
      .finally(() => setLoading(false))
  }, [search, accountFilter, offset])

  useEffect(() => {
    const t = setTimeout(fetchTxns, 300)
    return () => clearTimeout(t)
  }, [fetchTxns])

  const filtered = typeFilter
    ? transactions.filter((t) => t.transaction_type === typeFilter)
    : transactions

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('')
    setAccountFilter('')
    setOffset(0)
  }

  const hasFilters = search || typeFilter || accountFilter

  const handleDownloadPdf = async () => {
    const accId = accountFilter || accounts[0]?.id
    if (!accId) return
    setDownloading(true)
    try {
      const res = await statementsApi.downloadPdf(accId)
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch {
      alert('Failed to generate statement PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transactions</h1>
          <p className="text-slate-400 text-sm mt-0.5">View and search your transaction history</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading || accounts.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gold-400/10 border border-gold-400/20 text-gold-400 rounded-xl text-sm font-medium hover:bg-gold-400/20 transition-colors disabled:opacity-50"
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Download Statement
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
              placeholder="Search transactions..."
              className="input-field pl-9 py-2.5 text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setOffset(0) }}
              className="input-field py-2.5 pr-9 text-sm appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="">All Types</option>
              {Object.entries(typeConfig).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {accounts.length > 0 && (
            <div className="relative">
              <select
                value={accountFilter}
                onChange={(e) => { setAccountFilter(e.target.value); setOffset(0) }}
                className="input-field py-2.5 pr-9 text-sm appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} ···{a.account_number.slice(-4)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          )}

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost flex items-center gap-1.5 text-sm whitespace-nowrap">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-navy-400 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <span>Transaction</span>
          <span>Type</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <RefreshCw size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No transactions found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-400/50">
            {filtered.map((txn) => {
              const { icon: Icon, label, cls } = typeConfig[txn.transaction_type] || typeConfig.transfer
              const isCredit = txn.transaction_type === 'deposit'
              return (
                <div
                  key={txn.id}
                  className="grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-3 sm:gap-4 px-5 py-4 hover:bg-navy-600/30 transition-colors items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {txn.description || label}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(txn.created_at)}</p>
                      <p className="text-xs text-slate-600 font-mono">{txn.reference_number}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
                      {label}
                    </span>
                  </div>

                  <div className="hidden sm:block">
                    <span className={clsx(
                      'text-xs font-medium px-2.5 py-1 rounded-full capitalize',
                      statusBadge[txn.status] || ''
                    )}>
                      {txn.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-right sm:block flex-shrink-0">
                    <p className={clsx(
                      'text-sm font-semibold',
                      isCredit ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                    {txn.balance_after && (
                      <p className="text-xs text-slate-600">
                        Bal: {formatCurrency(txn.balance_after)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-navy-400">
            <p className="text-xs text-slate-500">
              Showing {offset + 1}–{offset + filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={filtered.length < limit}
                onClick={() => setOffset(offset + limit)}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
