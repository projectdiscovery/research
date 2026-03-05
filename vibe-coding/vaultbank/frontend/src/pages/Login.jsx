import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => setForm({ email: 'demo@vaultbank.com', password: 'demo1234' })

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-navy-800 border-r border-navy-400 p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        </div>
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-gold-400 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-navy-900" />
          </div>
          <span className="text-lg font-bold text-slate-100">VaultBank</span>
        </Link>

        <div className="relative z-10">
          <blockquote className="text-2xl font-bold text-slate-100 leading-snug mb-6">
            "Your wealth, secured.<br />
            Your future, powered."
          </blockquote>
          <div className="space-y-3">
            {['256-bit AES encryption', 'FDIC insured deposits', 'Zero-fee transfers'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-slate-400 text-sm">
                <div className="w-1.5 h-1.5 bg-gold-400 rounded-full" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600 relative z-10">
          © 2025 VaultBank. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-navy-900" />
            </div>
            <span className="text-base font-bold text-slate-100">VaultBank</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 font-medium">
              Sign up
            </Link>
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-navy-400">
            <p className="text-xs text-slate-500 text-center mb-3">Demo credentials</p>
            <button
              onClick={fillDemo}
              className="w-full bg-navy-700 border border-navy-400 hover:border-gold-400/40 rounded-xl px-4 py-3 text-sm text-left transition-all"
            >
              <p className="font-medium text-slate-300">Demo Account</p>
              <p className="text-slate-500 text-xs mt-0.5">demo@vaultbank.com · demo1234</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
