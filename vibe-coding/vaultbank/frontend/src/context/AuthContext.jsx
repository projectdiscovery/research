import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('vaultbank_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vaultbank_token')
    if (token) {
      authApi.me()
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('vaultbank_user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('vaultbank_token')
          localStorage.removeItem('vaultbank_refresh')
          localStorage.removeItem('vaultbank_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    const { access_token, refresh_token, user: userData } = res.data
    localStorage.setItem('vaultbank_token', access_token)
    localStorage.setItem('vaultbank_refresh', refresh_token)
    localStorage.setItem('vaultbank_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (formData) => {
    const res = await authApi.register(formData)
    const { access_token, refresh_token, user: userData } = res.data
    localStorage.setItem('vaultbank_token', access_token)
    localStorage.setItem('vaultbank_refresh', refresh_token)
    localStorage.setItem('vaultbank_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('vaultbank_refresh')
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // Ignore logout errors - clear state regardless
      }
    }
    localStorage.removeItem('vaultbank_token')
    localStorage.removeItem('vaultbank_refresh')
    localStorage.removeItem('vaultbank_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await authApi.me()
    setUser(res.data)
    localStorage.setItem('vaultbank_user', JSON.stringify(res.data))
    return res.data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
