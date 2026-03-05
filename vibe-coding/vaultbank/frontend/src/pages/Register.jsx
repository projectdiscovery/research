import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', phone: '', date_of_birth: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Left panel */}
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
          <h2 className="text-2xl font-bold text-slate-100 mb-6">
            Join 2.4M+ customers banking smarter
          </h2>
          <div className="space-y-4">
            {[
              'Free checking & savings accounts',
              'Instant money transfers',
              'No hidden fees, ever',
              'FDIC insured up to $250,000',
              '24/7 customer support',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-400">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600 relative z-10">© 2025 VaultBank. All rights reserved.</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[440px] py-8">
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-navy-900" />
            </div>
            <span className="text-base font-bold text-slate-100">VaultBank</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-100 mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium">Sign in</Link>
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input type="text" value={form.first_name} onChange={set('first_name')}
                  placeholder="John" required className="input-field" />
              </div>
              <div>
                <label className="label">Last name</label>
                <input type="text" value={form.last_name} onChange={set('last_name')}
                  placeholder="Doe" required className="input-field" />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" required className="input-field" />
            </div>

            <div>
              <label className="label">Phone number <span className="text-slate-600">(optional)</span></label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+1 (555) 000-0000" className="input-field" />
            </div>

            <div>
              <label className="label">Date of birth <span className="text-slate-600">(optional)</span></label>
              <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')}
                className="input-field" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-500 text-center">
            By creating an account, you agree to our{' '}
            <span className="text-slate-400 cursor-pointer hover:text-gold-400">Terms of Service</span>{' '}
            and{' '}
            <span className="text-slate-400 cursor-pointer hover:text-gold-400">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
