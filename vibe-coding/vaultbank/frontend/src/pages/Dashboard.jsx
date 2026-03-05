import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, Plus, CreditCard, ChevronRight,
  RefreshCw, Eye, EyeOff
} from 'lucide-react'
import { accountsApi, transactionsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}

function TxnIcon({ type }) {
  const map = {
    deposit: { icon: ArrowDownLeft, cls: 'text-emerald-400 bg-emerald-400/10' },
    withdrawal: { icon: ArrowUpRight, cls: 'text-red-400 bg-red-400/10' },
    transfer: { icon: ArrowLeftRight, cls: 'text-blue-400 bg-blue-400/10' },
    bill_payment: { icon: CreditCard, cls: 'text-amber-400 bg-amber-400/10' },
  }
  const { icon: Icon, cls } = map[type] || map.transfer
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon size={16} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(false)

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      transactionsApi.list({ limit: 8 }),
    ]).then(([accRes, txnRes]) => {
      setAccounts(accRes.data)
      setTransactions(txnRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0)
  const checking = accounts.find((a) => a.account_type === 'checking')
  const savings = accounts.find((a) => a.account_type === 'savings')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {user?.first_name} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Here's your financial overview</p>
        </div>
        <button
          onClick={() => setHideBalance(!hideBalance)}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          {hideBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          <span className="hidden sm:inline">{hideBalance ? 'Show' : 'Hide'} balance</span>
        </button>
      </div>

      {/* Total balance hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-600 to-navy-700 border border-navy-400 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />
        <p className="text-sm text-slate-400 mb-1">Total Balance</p>
        <p className="text-4xl sm:text-5xl font-extrabold text-slate-100 mb-4">
          {hideBalance ? '••••••' : formatCurrency(totalBalance)}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/transfer" className="btn-primary flex items-center gap-1.5 text-sm py-2">
            <ArrowLeftRight size={15} /> Transfer
          </Link>
          <button className="btn-secondary flex items-center gap-1.5 text-sm py-2">
            <Plus size={15} /> Add Money
          </button>
        </div>
        <div className="absolute bottom-4 right-6 opacity-10">
          <Wallet size={80} className="text-gold-400" />
        </div>
      </div>

      {/* Account cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { account: checking, label: 'Checking', icon: CreditCard, gradient: 'from-blue-900/40 to-navy-700' },
          { account: savings, label: 'Savings', icon: TrendingUp, gradient: 'from-emerald-900/30 to-navy-700' },
        ].map(({ account, label, icon: Icon, gradient }) => (
          account ? (
            <div
              key={label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border border-navy-400 p-5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{label} Account</p>
                  <p className="text-slate-500 text-xs mt-0.5 font-mono">{account.account_number}</p>
                </div>
                <div className="w-9 h-9 bg-navy-600/50 rounded-xl flex items-center justify-center">
                  <Icon size={18} className="text-slate-300" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100">
                {hideBalance ? '••••' : formatCurrency(account.balance)}
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase">{account.currency}</p>
            </div>
          ) : (
            <div key={label} className="rounded-2xl border border-dashed border-navy-400 p-5 flex items-center justify-center">
              <button className="flex flex-col items-center gap-2 text-slate-500 hover:text-gold-400 transition-colors">
                <Plus size={24} />
                <span className="text-sm">Open {label} Account</span>
              </button>
            </div>
          )
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This month in', value: formatCurrency(transactions.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + parseFloat(t.amount), 0)), positive: true },
          { label: 'This month out', value: formatCurrency(transactions.filter(t => t.transaction_type !== 'deposit').reduce((s, t) => s + parseFloat(t.amount), 0)), positive: false },
          { label: 'Transactions', value: transactions.length, neutral: true },
        ].map(({ label, value, positive, neutral }) => (
          <div key={label} className="card-sm text-center">
            <p className={clsx(
              'text-lg font-bold',
              positive ? 'text-emerald-400' : neutral ? 'text-gold-400' : 'text-red-400'
            )}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100">Recent Transactions</h2>
          <Link to="/transactions" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <RefreshCw size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((txn) => {
              const isIncoming = txn.transaction_type === 'deposit' ||
                (txn.transaction_type === 'transfer' && accounts.some(a => a.id === txn.to_account_id))
              return (
                <div key={txn.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy-600/50 transition-colors">
                  <TxnIcon type={txn.transaction_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{txn.description || txn.transaction_type}</p>
                    <p className="text-xs text-slate-500">{formatDate(txn.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={clsx(
                      'text-sm font-semibold',
                      txn.transaction_type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {txn.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-xs text-slate-600 capitalize">{txn.status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
