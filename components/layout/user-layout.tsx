'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Send,
  ScanLine,
  QrCode,
  Receipt,
  Wallet,
  PieChart,
  CreditCard,
  ShieldAlert,
  FileText,
  Briefcase,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  MapPin,
  Compass,
  Smartphone,
  AlertOctagon,
  FileCode,
  Cpu
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { NotificationDrawer } from './notification-drawer'

const navGroups = [
  {
    title: 'PAYMENTS',
    items: [
      { label: 'Send UPI', href: '/dashboard/pay', icon: Send },
      { label: 'Scan QR', href: '/dashboard/scan', icon: ScanLine },
      { label: 'Payment Map', href: '/dashboard/payment-map', icon: MapPin },
    ],
  },
  {
    title: 'MONEY MANAGEMENT',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
      { label: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
      { label: 'Cards', href: '/dashboard/cards', icon: CreditCard },
      { label: 'Budgets', href: '/dashboard/budgets', icon: PieChart },
      { label: 'Income', href: '/dashboard/income', icon: Wallet },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { label: 'AI Risk & Behaviour', href: '/dashboard/risk-profile', icon: Cpu },
      { label: 'Location History', href: '/dashboard/location-history', icon: Compass },
      { label: 'Devices', href: '/dashboard/devices', icon: Smartphone },
      { label: 'Fraud Alerts', href: '/dashboard/alerts', icon: AlertOctagon },
    ],
  },
  {
    title: 'REPORTS & SUPPORT',
    items: [
      { label: 'Report Fraud', href: '/dashboard/report', icon: ShieldAlert },
      { label: 'My Reports', href: '/dashboard/reports', icon: FileText },
      { label: 'My Cases', href: '/dashboard/cases', icon: Briefcase },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    ],
  },
  {
    title: 'ACCOUNT SETTINGS',
    items: [
      { label: 'Profile & My QR', href: '/dashboard/profile', icon: User },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

export function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, setNotificationOpen, unreadCount } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#071014] text-[#eef8f7] selection:bg-[#b8f55e]/30">
      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#0a1718] p-5 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f]">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="text-sm font-bold tracking-wider text-white">
                    UPI SHIELD <span className="text-[#b8f55e]">AI</span>
                  </span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 text-[#819694] hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-4">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#556d6a]">
                      {group.title}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
                            active
                              ? 'bg-[#b8f55e]/15 text-[#b8f55e] font-semibold'
                              : 'text-[#819694] hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#ff7a82] hover:bg-[#ff7a82]/10 transition"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-[#0a1718] p-5 shrink-0">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-md shadow-[#b8f55e]/20">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-wider text-white">UPI SHIELD</span>
                <p className="text-[10px] text-[#b8f55e]">Personal Vault</p>
              </div>
            </Link>
          </div>

          {/* User Profile Card */}
          <div className="mt-4 rounded-xl border border-white/8 bg-white/[.03] p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-full bg-[#b8f55e]/15 text-xs font-bold text-[#b8f55e]">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AS'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Anjan Sharma'}</p>
                <p className="text-[10px] text-[#819694] truncate">{user?.email || 'demo@upishield.ai'}</p>
              </div>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#556d6a]">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'bg-[#b8f55e]/15 text-[#b8f55e] font-semibold'
                          : 'text-[#819694] hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <Icon className={`size-3.5 transition-transform group-hover:scale-110 ${active ? 'text-[#b8f55e]' : 'text-[#819694]'}`} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <motion.span
                          layoutId="activePill"
                          className="absolute right-2 size-1.5 rounded-full bg-[#b8f55e]"
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#b8f55e] hover:bg-[#b8f55e]/10 transition font-medium"
            >
              <Sparkles className="size-3.5 text-[#b8f55e]" />
              <span>Admin Portal</span>
            </Link>

            <Link
              href="/docs"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#819694] hover:text-[#b8f55e] hover:bg-white/5 transition font-medium"
            >
              <FileCode className="size-3.5 text-[#b8f55e]" />
              <span>API Documentation</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#819694] hover:text-[#ff7a82] hover:bg-[#ff7a82]/10 transition"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#071014]/90 px-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-[#819694] hover:text-white lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </button>

              <div className="hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#78908d]">
                  PERSONAL FINANCE
                </span>
                <p className="text-xs text-white font-medium">Deterministic Rule Safety Active</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setNotificationOpen(true)}
                className="relative rounded-xl border border-white/10 bg-white/[.04] p-2.5 text-[#819694] hover:text-white hover:bg-white/[.08] transition"
                aria-label="Open notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#b8f55e] text-[9px] font-bold text-[#09110f]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Link
                href="/dashboard/pay"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#b8f55e] px-3.5 py-2 text-xs font-semibold text-[#09110f] hover:brightness-110 transition shadow-md shadow-[#b8f55e]/20"
              >
                <Send className="size-3.5" />
                <span>Pay via UPI</span>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationDrawer />
    </div>
  )
}
