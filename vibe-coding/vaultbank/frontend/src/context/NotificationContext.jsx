import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { notificationsApi } from '../services/api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const wsRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef(null)
  const MAX_RECONNECT = 5

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await notificationsApi.list({ limit: 20 })
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch {
      // ignore
    }
  }, [user])

  const connectWs = useCallback(() => {
    if (!user) return
    const token = localStorage.getItem('vaultbank_token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/notifications?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setNotifications((prev) => [data, ...prev])
        setUnreadCount((c) => c + 1)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (reconnectAttemptsRef.current < MAX_RECONNECT && user) {
        reconnectAttemptsRef.current += 1
        reconnectTimerRef.current = setTimeout(connectWs, 3000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      connectWs()
    }
    return () => {
      clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect on intentional close
        wsRef.current.close()
        wsRef.current = null
      }
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllRead, fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
