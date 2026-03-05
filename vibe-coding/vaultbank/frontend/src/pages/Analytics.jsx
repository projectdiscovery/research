import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { analyticsApi } from '../services/api'
import clsx from 'clsx'

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

const categoryColors = [
  'bg-gold-400', 'bg-blue-400', 'bg-emerald-400', 'bg-purple-400',
  'bg-amber-400', 'bg-red-400', 'bg-cyan-400', 'bg-pink-400',
]

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [spending, setSpending] = useState([])
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [trendsMonths, setTrendsMonths] = useState(6)
  const [spendingMonths, setSpendingMonths] = useState(3)

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.spendingBreakdown({ months: spendingMonths }),
      analyticsApi.monthlyTrends({ months: trendsMonths }),
    ]).then(([sumRes, spendRes, trendRes]) => {
      setSummary(sumRes.data)
      setSpending(spendRes.data)
      setTrends(trendRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const refreshSpending = async () => {
    const res = await analyticsApi.spendingBreakdown({ months: spendingMonths })
    setSpending(res.data)
  }

  const refreshTrends = async () => {
    const res = await analyticsApi.monthlyTrends({ months: trendsMonths })
    setTrends(res.data)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalSpent = spending.reduce((s, c) => s + c.total, 0)
  const maxTrendVal = Math.max(...trends.flatMap(t => [t.spent, t.income]), 1)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Spending Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">Understand your financial patterns</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Balance', value: formatCurrency(summary.total_balance), icon: DollarSign, color: 'text-gold-400' },
            { label: 'Spent This Month', value: formatCurrency(summary.this_month_spent), icon: ArrowUpRight, color: 'text-red-400' },
            { label: 'Income This Month', value: formatCurrency(summary.this_month_income), icon: ArrowDownLeft, color: 'text-emerald-400' },
            {
              label: 'Net This Month',
              value: formatCurrency(Math.abs(summary.net_this_month)),
              icon: summary.net_this_month >= 0 ? TrendingUp : TrendingDown,
              color: summary.net_this_month >= 0 ? 'text-emerald-400' : 'text-red-400',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={color} />
                <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
              <p className={clsx('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spending breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-gold-400" />
              <h2 className="text-sm font-semibold text-slate-100">Spending by Category</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={spendingMonths}
                onChange={e => setSpendingMonths(Number(e.target.value))}
                className="text-xs bg-navy-700 border border-navy-400 text-slate-300 rounded-lg px-2 py-1"
              >
                {[1, 3, 6, 12].map(m => <option key={m} value={m}>{m}mo</option>)}
              </select>
              <button onClick={refreshSpending} className="text-xs text-gold-400 hover:text-gold-300">Refresh</button>
            </div>
          </div>

          {spending.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No spending data available</p>
          ) : (
            <div className="space-y-3">
              {spending.map((cat, idx) => {
                const pct = totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300">{cat.category}</span>
                      <span className="text-xs text-slate-400">{formatCurrency(cat.total)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', categoryColors[idx % categoryColors.length])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Monthly trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gold-400" />
              <h2 className="text-sm font-semibold text-slate-100">Monthly Trends</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={trendsMonths}
                onChange={e => setTrendsMonths(Number(e.target.value))}
                className="text-xs bg-navy-700 border border-navy-400 text-slate-300 rounded-lg px-2 py-1"
              >
                {[3, 6, 12].map(m => <option key={m} value={m}>{m}mo</option>)}
              </select>
              <button onClick={refreshTrends} className="text-xs text-gold-400 hover:text-gold-300">Refresh</button>
            </div>
          </div>

          {trends.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No trend data available</p>
          ) : (
            <div className="space-y-2">
              {/* Legend */}
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-400" />
                  <span className="text-xs text-slate-400">Spent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                  <span className="text-xs text-slate-400">Income</span>
                </div>
              </div>
              {trends.map(t => (
                <div key={t.month} className="space-y-1">
                  <p className="text-xs text-slate-400">{t.month}</p>
                  <div className="flex gap-1 items-center">
                    <div
                      className="h-4 bg-red-400/70 rounded-sm min-w-[2px]"
                      style={{ width: `${(t.spent / maxTrendVal) * 100}%` }}
                      title={`Spent: ${formatCurrency(t.spent)}`}
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <div
                      className="h-4 bg-emerald-400/70 rounded-sm min-w-[2px]"
                      style={{ width: `${(t.income / maxTrendVal) * 100}%` }}
                      title={`Income: ${formatCurrency(t.income)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
