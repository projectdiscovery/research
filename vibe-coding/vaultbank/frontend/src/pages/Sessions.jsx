import { useState, useEffect } from 'react'
import { Monitor, Shield, Trash2, LogOut } from 'lucide-react'
import { sessionsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function formatDate(d) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

function parseDevice(userAgent) {
  if (!userAgent) return 'Unknown Device'
  if (userAgent.includes('Mobile')) return 'Mobile Browser'
  if (userAgent.includes('Chrome')) return 'Chrome Browser'
  if (userAgent.includes('Firefox')) return 'Firefox Browser'
  if (userAgent.includes('Safari')) return 'Safari Browser'
  return 'Web Browser'
}

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    sessionsApi.list()
      .then(res => setSessions(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleRevoke = async (id) => {
    setRevoking(id)
    try {
      await sessionsApi.revoke(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to revoke session')
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('This will sign you out of all devices. Continue?')) return
    try {
      await sessionsApi.revokeAll()
      await logout()
      navigate('/')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to revoke all sessions')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Active Sessions</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage devices where you're signed in</p>
        </div>
        <button
          onClick={handleRevokeAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl text-sm font-medium hover:bg-red-400/20 transition-colors"
        >
          <LogOut size={15} />
          Sign Out All
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <Shield size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No active sessions</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-navy-400/40">
            {sessions.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center flex-shrink-0">
                  <Monitor size={18} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{parseDevice(s.user_agent)}</p>
                    {idx === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400">Current</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {s.ip_address || 'Unknown IP'} · Active {formatDate(s.last_active)}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">Signed in {formatDate(s.created_at)}</p>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  disabled={revoking === s.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-xl text-xs font-medium hover:bg-red-400/20 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  {revoking === s.id ? '...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
