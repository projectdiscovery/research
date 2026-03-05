import { useState } from 'react'
import {
  User, Lock, Bell, Shield, ChevronRight,
  CheckCircle, AlertCircle, Eye, EyeOff, Save
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import clsx from 'clsx'

const tierColors = {
  basic: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
  silver: 'text-slate-200 bg-slate-200/10 border-slate-200/20',
  gold: 'text-gold-400 bg-gold-400/10 border-gold-400/20',
  platinum: 'text-gold-300 bg-gold-300/10 border-gold-300/20',
}

const kycColors = {
  verified: 'badge-verified',
  pending: 'badge-pending',
  rejected: 'badge-rejected',
}

function Section({ title, description, children }) {
  return (
    <div className="card space-y-5">
      <div className="pb-4 border-b border-navy-400">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    address: user?.address || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState(false)

  const [notifications, setNotifications] = useState({
    transactions: true, security: true, marketing: false, statements: true,
  })

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'account', icon: Shield, label: 'Account' },
  ]

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess(false)
    try {
      await authApi.updateMe(profile)
      await refreshUser()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 border border-navy-400 rounded-xl p-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              activeTab === id
                ? 'bg-gold-400 text-navy-900'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-600'
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Section title="Personal Information" description="Update your personal details">
          {profileSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-emerald-400" />
              <p className="text-sm text-emerald-400">Profile updated successfully</p>
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-sm text-red-400">{profileError}</p>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Last name</label>
                <input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="input-field" required />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone number</label>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000" className="input-field" />
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input type="date" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  className="input-field" />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Enter your address" rows={3}
                className="input-field resize-none" />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={profileLoading} className="btn-primary flex items-center gap-2">
                {profileLoading ? (
                  <span className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                ) : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </Section>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <Section title="Change Password" description="Use a strong, unique password">
            <div className="space-y-4">
              <div>
                <label className="label">Current password</label>
                <div className="relative">
                  <input type={showPasswords ? 'text' : 'password'} value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    placeholder="••••••••" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">New password</label>
                <input type={showPasswords ? 'text' : 'password'} value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  placeholder="Min. 8 characters" className="input-field" />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type={showPasswords ? 'text' : 'password'} value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  placeholder="Repeat new password" className="input-field" />
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Lock size={16} /> Update Password
              </button>
            </div>
          </Section>

          <Section title="Two-Factor Authentication" description="Add an extra layer of security">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-200">Authenticator App</p>
                <p className="text-xs text-slate-500 mt-0.5">Use Google Authenticator or similar</p>
              </div>
              <button className="btn-secondary text-sm py-2">Enable</button>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-200">SMS Verification</p>
                <p className="text-xs text-slate-500 mt-0.5">Verify logins via text message</p>
              </div>
              <button className="btn-secondary text-sm py-2">Enable</button>
            </div>
          </Section>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Section title="Notification Preferences" description="Choose what you want to be notified about">
          <div className="space-y-4">
            {[
              { key: 'transactions', label: 'Transaction Alerts', desc: 'Notify on every debit/credit activity' },
              { key: 'security', label: 'Security Alerts', desc: 'Login attempts, password changes' },
              { key: 'statements', label: 'Monthly Statements', desc: 'Receive your monthly account statement' },
              { key: 'marketing', label: 'Product Updates', desc: 'New features and promotional offers' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    notifications[key] ? 'bg-gold-400' : 'bg-navy-400'
                  )}
                >
                  <span className={clsx(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                    notifications[key] ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <Section title="Account Overview">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Account Status</span>
                <span className={user?.is_active ? 'badge-verified' : 'badge-rejected'}>
                  {user?.is_active ? '● Active' : '● Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">KYC Status</span>
                <span className={kycColors[user?.kyc_status] || 'badge-pending'}>
                  {user?.kyc_status?.charAt(0).toUpperCase() + user?.kyc_status?.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Account Tier</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${tierColors[user?.account_tier] || ''}`}>
                  {user?.account_tier}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Member Since</span>
                <span className="text-sm text-slate-300">
                  {user?.created_at && new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.created_at))}
                </span>
              </div>
            </div>
          </Section>

          <Section title="KYC Verification" description="Complete identity verification to unlock all features">
            {user?.kyc_status === 'verified' ? (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <CheckCircle size={20} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Identity Verified</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">Your account is fully verified and all features are available.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">Upload your government-issued ID and a selfie to complete verification.</p>
                <button className="btn-primary flex items-center gap-2">
                  <Shield size={16} /> Start Verification
                </button>
              </div>
            )}
          </Section>

          <Section title="Danger Zone">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-200">Close Account</p>
                  <p className="text-xs text-slate-500 mt-0.5">Permanently delete your VaultBank account and all data</p>
                </div>
                <button className="text-sm text-red-400 hover:text-red-300 font-medium border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors">
                  Close Account
                </button>
              </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
