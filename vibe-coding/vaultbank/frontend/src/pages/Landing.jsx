import { Link } from 'react-router-dom'
import {
  Shield, Zap, Globe, Lock, TrendingUp, CreditCard,
  ChevronRight, CheckCircle, Star, ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    desc: '256-bit AES encryption, biometric auth, and real-time fraud monitoring protect every transaction.',
  },
  {
    icon: Zap,
    title: 'Instant Transfers',
    desc: 'Send money domestically or internationally in seconds with zero hidden fees.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Savings',
    desc: 'High-yield savings accounts with competitive APY and automated savings goals.',
  },
  {
    icon: Globe,
    title: 'Global Access',
    desc: 'Access your accounts from anywhere. 24/7 support across 150+ countries.',
  },
  {
    icon: CreditCard,
    title: 'Premium Cards',
    desc: 'Visa Infinite cards with unlimited cashback, travel insurance, and concierge service.',
  },
  {
    icon: Lock,
    title: 'KYC Verified',
    desc: 'Fully regulated with AML compliance and FDIC-insured deposits up to $250,000.',
  },
]

const stats = [
  { value: '2.4M+', label: 'Active Customers' },
  { value: '$12B+', label: 'Assets Under Management' },
  { value: '99.99%', label: 'Uptime Guarantee' },
  { value: '150+', label: 'Countries Supported' },
]

const testimonials = [
  {
    name: 'James Richardson',
    role: 'Entrepreneur',
    quote: "VaultBank transformed how I manage business finances. The platinum tier benefits are unmatched.",
    stars: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Software Engineer',
    quote: "Instant transfers and zero fees? I've saved hundreds switching from my old bank.",
    stars: 5,
  },
  {
    name: 'Marcus Webb',
    role: 'Investor',
    quote: "The real-time analytics and savings tools helped me grow my wealth 3x in two years.",
    stars: 5,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900 overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-navy-400/50 sticky top-0 z-50 bg-navy-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-navy-900" size={18} />
            </div>
            <span className="text-lg font-bold text-slate-100">VaultBank</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold-400/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
              FDIC Insured · 256-bit Encryption · 24/7 Support
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-100 leading-[1.08] tracking-tight mb-6">
              Banking Redefined
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">
                for the Future
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              VaultBank delivers institutional-grade security, instant global transfers,
              and intelligent financial tools — all in one seamless platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
                Open Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5">
                Demo Login <ChevronRight size={18} />
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              No monthly fees · No minimum balance · 2-minute setup
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-navy-400/50 bg-navy-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-gold-400">{value}</p>
              <p className="text-sm text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Powerful tools built for individuals and businesses who demand more from their bank.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card group hover:border-gold-400/30 hover:bg-navy-600/50 transition-all duration-200"
            >
              <div className="w-11 h-11 bg-gold-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-400/20 transition-colors">
                <Icon className="text-gold-400" size={22} />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-navy-800/50 border-y border-navy-400/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
              Account Tiers
            </h2>
            <p className="text-slate-400">Choose the tier that fits your financial journey.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                tier: 'Basic', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20',
                price: 'Free', features: ['1 Checking account', 'Mobile banking', 'Debit card', 'Basic transfers']
              },
              {
                tier: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-400/20',
                price: '$4.99/mo', features: ['Checking + Savings', 'Priority support', 'No foreign fees', '1.5% cashback']
              },
              {
                tier: 'Gold', color: 'text-gold-400', bg: 'bg-gold-400/10', border: 'border-gold-400/30',
                price: '$14.99/mo', features: ['All Silver benefits', 'Investment access', '3% cashback', 'Personal advisor'],
                highlight: true
              },
              {
                tier: 'Platinum', color: 'text-gold-300', bg: 'bg-gold-300/10', border: 'border-gold-300/30',
                price: '$29.99/mo', features: ['All Gold benefits', 'Dedicated banker', '5% cashback', 'Concierge service']
              },
            ].map(({ tier, color, bg, border, price, features, highlight }) => (
              <div
                key={tier}
                className={`card border ${border} ${highlight ? 'ring-1 ring-gold-400/30' : ''} flex flex-col`}
              >
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-4`}>
                  <Shield className={color} size={20} />
                </div>
                <h3 className={`text-lg font-bold ${color} mb-1`}>{tier}</h3>
                <p className="text-2xl font-extrabold text-slate-100 mb-4">{price}</p>
                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                      <CheckCircle size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {highlight && (
                  <span className="mt-4 text-xs text-gold-400 font-semibold uppercase tracking-wider">Most Popular</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
            Trusted by millions
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map(({ name, role, quote, stars }) => (
            <div key={name} className="card">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-gold-400 fill-gold-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">"{quote}"</p>
              <div>
                <p className="text-sm font-semibold text-slate-100">{name}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-800/50 border-y border-navy-400/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
            Ready to upgrade your banking?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join over 2.4 million customers who trust VaultBank with their finances.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
            Open Your Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-400/50 bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gold-400 rounded-md flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-navy-900" size={14} />
            </div>
            <span className="text-sm font-bold text-slate-300">VaultBank</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            © 2025 VaultBank. FDIC Insured. Member FDIC. Equal Housing Lender.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms</span>
            <span className="hover:text-slate-300 cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
