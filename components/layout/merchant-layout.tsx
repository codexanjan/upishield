'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  QrCode,
  ArrowLeftRight,
  TrendingUp,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Laptop
} from 'lucide-react'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { accounts, activeMerchantUpi, setActiveMerchant, resetDemoEnvironment } = useUPIGuardStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null)

  const merchant = accounts[activeMerchantUpi] || accounts['abc@upiguard']

  // Listen to realtime payment events
  useEffect(() => {
    const handleEvent = (e: any) => {
      const { type, payload } = e.detail || {}
      if (type === 'payment:settled' && payload?.receiverUpi === activeMerchantUpi) {
        setNotificationBanner(`✓ Received ₹${payload.transaction?.amount?.toLocaleString('en-IN')} from ${payload.transaction?.senderName}!`)
        setTimeout(() => setNotificationBanner(null), 8000)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('upiguard_event', handleEvent)
      return () => window.removeEventListener('upiguard_event', handleEvent)
    }
  }, [activeMerchantUpi])

  const navItems = [
    { label: 'Merchant Dashboard', href: '/merchant/dashboard', icon: Store },
    { label: 'Create QR', href: '/merchant/qr', icon: QrCode },
    { label: 'Settlement History', href: '/merchant/payments', icon: ArrowLeftRight },
    { label: 'Risk & Analytics', href: '/merchant/analytics', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-[#06101D] text-[#EEF8F7] selection:bg-[#5BD6FF]/30">
      {/* Realtime Notification Banner */}
      <AnimatePresence>
        {notificationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 className="size-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold">{notificationBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#0B1B2D]/80 bg-[#091726]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <Link href="/merchant/dashboard" className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-[#438EFF] to-[#5BD6FF] flex items-center justify-center shadow-lg shadow-[#5BD6FF]/20">
                <Store className="size-5 text-[#06101D]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white font-mono">UPIGuard</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#438EFF]/20 border border-[#438EFF]/40 text-[#5BD6FF]">
                    MERCHANT
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">Closed-Loop UPI Payment Terminal</p>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/merchant/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#438EFF]/20 text-[#5BD6FF] border border-[#438EFF]/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: Balance & Portal Switcher */}
          <div className="flex items-center gap-3">
            {/* Merchant Account Switcher */}
            <select
              value={activeMerchantUpi}
              onChange={(e) => setActiveMerchant(e.target.value)}
              className="hidden sm:block text-xs bg-[#0B1B2D] border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-[#5BD6FF]"
            >
              <option value="abc@upiguard">ABC Electronics (₹{accounts['abc@upiguard']?.balance?.toLocaleString('en-IN')})</option>
              <option value="coffee@upiguard">UPIGuard Coffee (₹{accounts['coffee@upiguard']?.balance?.toLocaleString('en-IN')})</option>
            </select>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1B2D] border border-white/10">
              <span className="text-[11px] text-slate-400">Balance:</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                ₹{merchant?.balance?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Quick Switch to User / Admin Portal */}
            <div className="flex items-center gap-1 border-l border-white/10 pl-2">
              <Link
                href="/dashboard/pay"
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition"
                title="Switch to User Payment Screen"
              >
                User App →
              </Link>
              <Link
                href="/admin/command-center"
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[#7759E8]/20 hover:bg-[#7759E8]/30 border border-[#7759E8]/40 text-purple-300 transition"
                title="Open Admin SOC Command Center"
              >
                Admin SOC →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Simulation Network Disclaimer Footer */}
      <footer className="mt-12 border-t border-[#0B1B2D] py-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          UPIGuard AI Demo Network — Closed-Loop UPI Simulation · No real money moved.
        </p>
      </footer>
    </div>
  )
}
