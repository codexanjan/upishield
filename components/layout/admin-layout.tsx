'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Send,
  CreditCard,
  FileWarning,
  Briefcase,
  Sliders,
  ShieldAlert,
  Store,
  Bell,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Lock,
  ShieldCheck,
  Sparkles,
  MapPin,
  Flame,
  Smartphone,
  Radio,
  KanbanSquare,
  QrCode,
  BarChart3,
  FileCode,
  Cpu,
  Share2,
  SlidersHorizontal
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { NotificationDrawer } from './notification-drawer'

const adminNavItems = [
  { label: 'Command Center', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'AI Model Center', href: '/admin/models', icon: Cpu },
  { label: 'Fraud Network Graph', href: '/admin/network-graph', icon: Share2 },
  { label: 'Adaptive Thresholds', href: '/admin/adaptive-thresholds', icon: SlidersHorizontal },
  { label: 'Live Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { label: 'Payment Map', href: '/admin/payment-map', icon: MapPin },
  { label: 'Fraud Map', href: '/admin/fraud-map', icon: Flame },
  { label: 'Devices', href: '/admin/devices', icon: Smartphone },
  { label: 'Live Alerts', href: '/admin/alerts', icon: Radio },
  { label: 'Investigation Board', href: '/admin/cases/board', icon: KanbanSquare },
  { label: 'Fraud Reports', href: '/admin/reports', icon: FileWarning },
  { label: 'Cases', href: '/admin/cases', icon: Briefcase },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'UPI Intelligence', href: '/admin/reported-upi', icon: ShieldAlert },
  { label: 'QR Intelligence', href: '/admin/qr', icon: QrCode },
  { label: 'Merchants', href: '/admin/reported-merchants', icon: Store },
  { label: 'Location Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Fraud Rules', href: '/admin/fraud-rules', icon: Sliders },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, adminLogout, setNotificationOpen, unreadCount } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    adminLogout()
    router.push('/admin/login')
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
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f]">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold tracking-wider text-white">ADMIN PORTAL</span>
                    <p className="text-[10px] text-[#b8f55e]">UPI SHIELD AI</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
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
                <p className="text-[10px] text-[#b8f55e]">Admin Command Center</p>
              </div>
            </Link>
          </div>

          {/* Admin Profile Card */}
          <div className="mt-4 rounded-xl border border-white/8 bg-white/[.03] p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-full bg-[#b8f55e]/15 text-xs font-bold text-[#b8f55e]">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{admin?.name || 'Administrator'}</p>
                <p className="text-[10px] text-[#819694] truncate">{admin?.email || 'admin@upishield.ai'}</p>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    active
                      ? 'bg-[#b8f55e]/15 text-[#b8f55e] font-semibold'
                      : 'text-[#819694] hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <Icon className={`size-4 transition-transform group-hover:scale-110 ${active ? 'text-[#b8f55e]' : 'text-[#819694]'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="adminActivePill"
                      className="absolute right-2 size-1.5 rounded-full bg-[#b8f55e]"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-white/10 space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#b8f55e] hover:bg-[#b8f55e]/10 transition font-medium"
            >
              <Sparkles className="size-3.5 text-[#b8f55e]" />
              <span>User Portal</span>
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
                  FRAUD OPERATIONS
                </span>
                <p className="text-xs text-white font-medium">Compliance & Verification Desk</p>
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
                href="/admin/fraud-rules"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#b8f55e] px-3.5 py-2 text-xs font-semibold text-[#09110f] hover:brightness-110 transition shadow-md shadow-[#b8f55e]/20"
              >
                <Sliders className="size-3.5" />
                <span>Configure Rules</span>
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
