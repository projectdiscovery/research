import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, ArrowLeftRight, AlertTriangle, CheckCircle, ShieldAlert, Info } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import clsx from 'clsx'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const typeIcon = {
  transaction: ArrowLeftRight,
  approval: CheckCircle,
  alert: AlertTriangle,
  compliance: ShieldAlert,
  system: Info,
}

const typeColor = {
  transaction: 'text-blue-400',
  approval: 'text-emerald-400',
  alert: 'text-amber-400',
  compliance: 'text-red-400',
  system: 'text-slate-400',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-gold-400 hover:bg-navy-600 transition-all"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gold-400 text-navy-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-navy-800 border border-navy-400 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-400">
            <span className="text-sm font-semibold text-slate-100">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} className="text-slate-600" />
                <p className="text-slate-500 text-sm">You're all caught up</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] || Info
                const color = typeColor[n.type] || 'text-slate-400'
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={clsx(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-navy-600/50 transition-colors border-b border-navy-400/30 last:border-0',
                      !n.is_read && 'bg-navy-700/40'
                    )}
                  >
                    <div className={clsx('mt-0.5 flex-shrink-0', color)}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx('text-xs font-semibold truncate', n.is_read ? 'text-slate-300' : 'text-slate-100')}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
