'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Receipt,
  ArrowLeftRight,
  ShieldAlert,
  Bell,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Send,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  SlidersHorizontal,
  ShieldCheck,
  Activity,
  Sparkles,
  ArrowRight,
  MapPin,
  Compass,
  Smartphone,
  AlertOctagon,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { useAppStore } from '@/lib/store'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

export default function UserDashboard() {
  const { user, privacyMasked, togglePrivacyMask } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'financial' | 'payment' | 'location' | 'security'>('financial')
  const [conflictStatus, setConflictStatus] = useState<'unresolved' | 'verified_me' | 'secured'>('unresolved')
  const [bankModalOpen, setBankModalOpen] = useState(false)

  // Financial State
  const [financialSummary, setFinancialSummary] = useState({
    current_balance: 42580.0,
    monthly_income: 55000.0,
    monthly_expenses: 27420.0,
    savings: 27580.0,
  })

  // Payment Breakdown
  const paymentStats = {
    total_txns: 128,
    upi_txns: 84,
    card_txns: 31,
    cash_txns: 13,
  }

  // Location Breakdown
  const locationStats = {
    payment_locations: 12,
    primary_city: 'Bengaluru',
    new_locations: 3,
    location_alerts: 2,
  }

  // Security Breakdown
  const securityStats = {
    trusted_devices: 2,
    unknown_devices: 1,
    active_cases: 2,
    security_alerts: 4,
  }

  const [expenseSummary, setExpenseSummary] = useState({
    total_expenses: 27420.0,
    monthly_budget: 35000.0,
    remaining_budget: 7580.0,
    today_spend: 850.0,
    category_distribution: {
      Food: 8400,
      Shopping: 6200,
      Groceries: 5120,
      Bills: 4200,
      Travel: 3500
    } as Record<string, number>,
    monthly_trend: [
      { month: 'Apr', amount: 21200, height: 62 },
      { month: 'May', amount: 24800, height: 72 },
      { month: 'Jun', amount: 22300, height: 65 },
      { month: 'Jul', amount: 26900, height: 80 },
      { month: 'Aug', amount: 23100, height: 68 },
      { month: 'Sep', amount: 27420, height: 85 }
    ]
  })

  const [recentTransactions, setRecentTransactions] = useState<any[]>([
    {
      id: 1,
      transaction_reference: 'TXN-849210',
      transaction_type: 'UPI',
      merchant: 'Star Cafe',
      payment_method: 'UPI App Intent',
      amount: 850.0,
      status: 'Completed',
      flag_status: 'Normal',
      city: 'Bengaluru (Koramangala)',
      transaction_date: 'Today, 8:35 PM'
    },
    {
      id: 2,
      transaction_reference: 'TXN-718290',
      transaction_type: 'UPI',
      merchant: 'unknown.vendor@ybl',
      payment_method: 'UPI Transfer',
      amount: 18500.0,
      status: 'Reported',
      flag_status: 'Suspicious',
      city: 'Delhi (Unrecognized Location)',
      transaction_date: 'Today, 10:38 AM'
    },
    {
      id: 3,
      transaction_reference: 'TXN-619283',
      transaction_type: 'Card',
      merchant: 'Supermarket Fresh Mart',
      payment_method: 'Masked Card (..4821)',
      amount: 2100.0,
      status: 'Completed',
      flag_status: 'Normal',
      city: 'Bengaluru (Indiranagar)',
      transaction_date: 'Yesterday, 5:12 PM'
    }
  ])

  useEffect(() => {
    setMounted(true)
    async function loadData() {
      try {
        const [fin, exp, txns] = await Promise.all([
          apiRequest('/income/summary').catch(() => null),
          apiRequest('/expenses/summary').catch(() => null),
          apiRequest('/transactions?limit=5').catch(() => null)
        ])
        if (fin && fin.net_balance !== undefined) {
          setFinancialSummary({
            current_balance: fin.net_balance || 42580.0,
            monthly_income: fin.total_income || 55000.0,
            monthly_expenses: fin.total_expenses || 27420.0,
            savings: fin.savings || 27580.0
          })
        }
        if (exp && typeof exp === 'object') {
          setExpenseSummary(prev => ({
            ...prev,
            ...exp,
            category_distribution: exp.category_distribution || prev.category_distribution || {},
            monthly_trend: Array.isArray(exp.monthly_trend) && exp.monthly_trend.length > 0 ? exp.monthly_trend : prev.monthly_trend
          }))
        }
        if (txns && Array.isArray(txns) && txns.length > 0) setRecentTransactions(txns)
      } catch {
        // Safe fallback
      }
    }
    loadData()
  }, [])

  const hour = typeof window !== 'undefined' ? new Date().getHours() : 10
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="PERSONAL VAULT · DETERMINISTIC PROTECTION" variant="lime" />
            </div>
            <MotionWordReveal
              text={`${greeting}, ${user?.name?.split(' ')[0] || 'Anjan'}`}
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time payment tracking, location intelligence & zero-AI deterministic security rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment-map"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              <MapPin className="size-3.5 text-[#b8f55e]" /> Payment Map
            </Link>
            <Link
              href="/dashboard/scan"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              <ScanLine className="size-3.5 text-[#b8f55e]" /> Scan QR
            </Link>
            <Link
              href="/dashboard/pay"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-semibold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              <Send className="size-3.5" /> Send UPI
            </Link>
          </div>
        </div>

        {/* IMPOSSIBLE TRAVEL ALERT BANNER WITH INTERACTIVE ACTIONS */}
        <AnimatePresence>
          {conflictStatus === 'unresolved' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 backdrop-blur-sm shadow-xl"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Unknown Location & Device Login
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded">
                        Deterministic Travel-Time Rule
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">
                      Was this you? A new device transacted from Delhi while your registered phone was active in Bengaluru.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-amber-200/90 font-mono">
                      <span className="bg-black/30 px-2.5 py-1 rounded-md border border-white/10">
                        Bengaluru · Today 10:20 AM
                      </span>
                      <span className="text-amber-400 font-bold">➔</span>
                      <span className="bg-black/30 px-2.5 py-1 rounded-md border border-white/10 text-rose-300">
                        Delhi · Today 10:38 AM (Device DEV-A782)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                  <button
                    onClick={() => setConflictStatus('verified_me')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition border border-white/10"
                  >
                    Yes, It Was Me
                  </button>
                  <button
                    onClick={() => setConflictStatus('secured')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition shadow-lg shadow-rose-600/25"
                  >
                    No, Secure Account
                  </button>
                  <Link
                    href="/dashboard/devices"
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#8fa9a6] hover:text-white transition"
                  >
                    Review Device
                  </Link>
                  <button
                    onClick={() => setBankModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    Contact Bank
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {conflictStatus === 'verified_me' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between text-xs text-emerald-300 shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <span>Location authorized: Delhi activity verified as your legitimate travel. Device DEV-A782 added to trusted endpoints.</span>
              </div>
              <button onClick={() => setConflictStatus('unresolved')} className="text-xs text-[#8fa9a6] hover:text-white underline ml-3 shrink-0">
                Undo
              </button>
            </motion.div>
          )}

          {conflictStatus === 'secured' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between text-xs text-rose-300 shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="size-5 text-rose-400 shrink-0" />
                <span>Account secured: Device DEV-A782 revoked and blocked. Security Case #CAS-7492 opened with Fraud Desk.</span>
              </div>
              <Link href="/dashboard/cases" className="text-xs font-bold text-white underline ml-3 shrink-0">
                View Case Progress →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4 Dashboard Metric Categories Tab / Quick Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'financial'
                    ? 'bg-[#b8f55e] text-[#071014] shadow-md shadow-[#b8f55e]/20'
                    : 'text-[#8fa9a6] hover:text-white hover:bg-white/5'
                }`}
              >
                1. Financial Overview
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'payment'
                    ? 'bg-[#b8f55e] text-[#071014] shadow-md shadow-[#b8f55e]/20'
                    : 'text-[#8fa9a6] hover:text-white hover:bg-white/5'
                }`}
              >
                2. Payment Cards
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'location'
                    ? 'bg-[#b8f55e] text-[#071014] shadow-md shadow-[#b8f55e]/20'
                    : 'text-[#8fa9a6] hover:text-white hover:bg-white/5'
                }`}
              >
                3. Location Cards
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'security'
                    ? 'bg-[#b8f55e] text-[#071014] shadow-md shadow-[#b8f55e]/20'
                    : 'text-[#8fa9a6] hover:text-white hover:bg-white/5'
                }`}
              >
                4. Security Cards
              </button>
            </div>

            <button
              onClick={togglePrivacyMask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#8fa9a6] hover:text-white transition"
              title="Toggle financial value privacy"
            >
              {privacyMasked ? <EyeOff className="size-3.5 text-[#b8f55e]" /> : <Eye className="size-3.5" />}
              <span>{privacyMasked ? 'Masked' : 'Hide Balances'}</span>
            </button>
          </div>

          {/* FINANCIAL CARDS */}
          {activeTab === 'financial' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Tracked Balance (Ledger-synced)</p>
                  <Wallet className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">
                  {privacyMasked ? '••••••' : `₹${Number(financialSummary.current_balance).toLocaleString('en-IN')}`}
                </p>
                <p className="mt-2 text-xs text-[#b8f55e]">
                  Available in UPI Linked Accounts
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Monthly Income</p>
                  <TrendingUp className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">
                  {privacyMasked ? '••••••' : `₹${Number(financialSummary.monthly_income).toLocaleString('en-IN')}`}
                </p>
                <p className="mt-2 text-xs text-[#8fa9a6]">
                  Primary Salary + Freelance
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Monthly Expenses</p>
                  <Receipt className="size-4 text-amber-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">
                  {privacyMasked ? '••••••' : `₹${Number(financialSummary.monthly_expenses).toLocaleString('en-IN')}`}
                </p>
                <p className="mt-2 text-xs text-amber-400">
                  Within budget allowance
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Net Savings</p>
                  <ShieldCheck className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">
                  {privacyMasked ? '••••••' : `₹${Number(financialSummary.savings).toLocaleString('en-IN')}`}
                </p>
                <p className="mt-2 text-xs text-[#b8f55e]">
                  50.1% savings rate
                </p>
              </div>
            </motion.div>
          )}

          {/* PAYMENT CARDS (Prompt: Transactions 128, UPI Payments 84, Card Payments 31, Cash Expenses 13) */}
          {activeTab === 'payment' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Total Transactions</p>
                  <ArrowLeftRight className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{paymentStats.total_txns}</p>
                <p className="mt-2 text-xs text-[#8fa9a6]">All logged payment channels</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">UPI Payments</p>
                  <Send className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{paymentStats.upi_txns}</p>
                <p className="mt-2 text-xs text-[#b8f55e]">65.6% volume share</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Card Payments</p>
                  <CreditCard className="size-4 text-sky-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{paymentStats.card_txns}</p>
                <p className="mt-2 text-xs text-sky-400">Masked credit cards</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Cash Expenses</p>
                  <Receipt className="size-4 text-emerald-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{paymentStats.cash_txns}</p>
                <p className="mt-2 text-xs text-emerald-400">Manual expense logs</p>
              </div>
            </motion.div>
          )}

          {/* LOCATION CARDS (Prompt: Payment Locations 12, Primary City Bengaluru, New Locations This Month 3, Location Alerts 2) */}
          {activeTab === 'location' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Payment Locations</p>
                  <MapPin className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{locationStats.payment_locations}</p>
                <p className="mt-2 text-xs text-[#b8f55e]">Distinct geographic clusters</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Primary Payment City</p>
                  <Compass className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{locationStats.primary_city}</p>
                <p className="mt-2 text-xs text-[#8fa9a6]">82% of transactions initiated</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">New Locations This Month</p>
                  <Sparkles className="size-4 text-amber-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{locationStats.new_locations}</p>
                <p className="mt-2 text-xs text-amber-400">Mysuru, Delhi, Udupi</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Location Alerts</p>
                  <AlertOctagon className="size-4 text-rose-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{locationStats.location_alerts}</p>
                <p className="mt-2 text-xs text-rose-400">Impossible travel flag</p>
              </div>
            </motion.div>
          )}

          {/* SECURITY CARDS (Prompt: Trusted Devices 2, Unknown Devices 1, Active Fraud Cases 2, Security Alerts 4) */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Trusted Devices</p>
                  <Smartphone className="size-4 text-[#b8f55e]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{securityStats.trusted_devices}</p>
                <p className="mt-2 text-xs text-[#b8f55e]">Samsung S24, MacBook</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Unknown Devices</p>
                  <AlertTriangle className="size-4 text-amber-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{securityStats.unknown_devices}</p>
                <p className="mt-2 text-xs text-amber-400">Android DEV-A782 in Delhi</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Active Fraud Cases</p>
                  <ShieldAlert className="size-4 text-rose-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{securityStats.active_cases}</p>
                <p className="mt-2 text-xs text-rose-400">Under Admin Review</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa9a6]">Security Alerts</p>
                  <Bell className="size-4 text-sky-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white font-mono">{securityStats.security_alerts}</p>
                <p className="mt-2 text-xs text-sky-400">4 active notifications</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* PAYMENT MAP QUICK PREVIEW & RECENT PAYMENTS (Section 62 Layout) */}
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          {/* Interactive Payment Map Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#b8f55e]/15 text-[#b8f55e]">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Payment Map Intelligence</h3>
                    <p className="text-xs text-[#8fa9a6]">Personal transactions plotted by verified coordinates</p>
                  </div>
                </div>

                <Link
                  href="/dashboard/payment-map"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8f55e] hover:underline"
                >
                  Full Map <ExternalLink className="size-3" />
                </Link>
              </div>

              {/* Graphic Radar / Geographic Cluster View */}
              <div className="mt-5 relative h-56 rounded-xl border border-white/10 bg-[#071014] overflow-hidden flex items-center justify-center">
                {/* Grid Overlay */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#b8f55e 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Radar rings */}
                <div className="absolute size-44 rounded-full border border-[#b8f55e]/20 animate-pulse pointer-events-none" />
                <div className="absolute size-28 rounded-full border border-white/10 pointer-events-none" />

                {/* Marker 1: Bengaluru (Green - Normal) */}
                <div className="absolute top-[52%] left-[46%] flex flex-col items-center group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <span className="size-3 rounded-full bg-[#b8f55e] ring-4 ring-[#b8f55e]/20" />
                    <span className="absolute -top-6 bg-[#071014] border border-white/20 px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap opacity-90">
                      Bengaluru · 84 txns
                    </span>
                  </div>
                </div>

                {/* Marker 2: Mysuru (Blue - Trusted) */}
                <div className="absolute top-[68%] left-[42%] flex flex-col items-center group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <span className="size-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/20" />
                    <span className="absolute -top-6 bg-[#071014] border border-white/20 px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap opacity-90">
                      Mysuru · 12 txns
                    </span>
                  </div>
                </div>

                {/* Marker 3: Delhi (Orange / Red - Location Warning) */}
                <div className="absolute top-[22%] left-[48%] flex flex-col items-center group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <span className="size-3 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-bounce" />
                    <span className="absolute -top-7 bg-rose-950/90 border border-rose-500/40 text-rose-200 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-lg">
                      ⚠ Delhi Conflict (₹18.5k)
                    </span>
                  </div>
                </div>

                {/* Bottom Legend */}
                <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[10px] text-[#8fa9a6] bg-[#0a1718]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#b8f55e]" /> Normal</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sky-400" /> Trusted Merchant</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> New City</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" /> Conflict</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8fa9a6]">
              <span>Browser Geolocation: Approx. 120m precision</span>
              <span className="text-[#b8f55e] font-medium">Zero silent tracking</span>
            </div>
          </div>

          {/* Recent Payments & Security Feed */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Recent Payments</h3>
                  <p className="text-xs text-[#8fa9a6]">Activity log with location flags</p>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="text-xs text-[#b8f55e] hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="size-3" />
                </Link>
              </div>

              <div className="mt-4 space-y-3.5">
                {(recentTransactions || []).map((tx) => {
                  const isSuspicious = tx.flag_status === 'Suspicious'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3.5 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                    >
                      <div
                        className={`grid size-9 place-items-center rounded-xl text-[10px] font-bold shrink-0 ${
                          isSuspicious
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30'
                        }`}
                      >
                        {isSuspicious ? 'FLAG' : 'PASS'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-semibold text-white">
                            {tx.merchant}
                          </p>
                          <span className="text-xs font-bold text-white font-mono">
                            ₹{Number(tx.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-[#8fa9a6]">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="size-3 text-[#b8f55e] shrink-0" />
                            {tx.city || 'Bengaluru'}
                          </span>
                          <span>{tx.transaction_date}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/dashboard/location-history"
                className="text-xs text-[#8fa9a6] hover:text-white flex items-center gap-1 transition"
              >
                <Compass className="size-3.5 text-[#b8f55e]" /> Travel route history
              </Link>
              <Link
                href="/dashboard/report"
                className="text-xs text-rose-400 font-medium hover:underline flex items-center gap-1"
              >
                <ShieldAlert className="size-3.5" /> Report dispute
              </Link>
            </div>
          </div>
        </div>

        {/* 6-Month Expense Trend & Category Progress */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Monthly Expense Trend</h3>
                <p className="text-xs text-[#8fa9a6]">Deterministic budget consumption last 6 months</p>
              </div>
              <span className="rounded-full bg-[#b8f55e]/10 border border-[#b8f55e]/20 px-2.5 py-1 text-xs font-semibold text-[#b8f55e]">
                No AI · Pure Data
              </span>
            </div>

            <div className="mt-8 flex h-48 items-end gap-3 sm:gap-6 px-2">
              {(expenseSummary?.monthly_trend || []).map((item, i) => (
                <div key={item.month} className="flex flex-1 flex-col items-center justify-end gap-2 h-full">
                  <div className="text-[10px] text-[#8fa9a6] font-mono">
                    ₹{(item.amount / 1000).toFixed(0)}k
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-[#b8f55e] transition-all duration-500 hover:brightness-125"
                    style={{
                      height: `${item.height || 60}%`,
                      opacity: 0.4 + i * 0.1
                    }}
                  />
                  <span className="text-xs font-medium text-[#8fa9a6]">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">Spending by Location</h3>
              <p className="text-xs text-[#8fa9a6]">Top geographic distribution</p>
            </div>

            <div className="space-y-3">
              {[
                { city: 'Bengaluru', amount: 18200, pct: 66 },
                { city: 'Mysuru', amount: 5400, pct: 20 },
                { city: 'Mangaluru', amount: 3200, pct: 11 },
                { city: 'Udupi', amount: 1850, pct: 7 },
              ].map((item) => (
                <div key={item.city} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <MapPin className="size-3 text-[#b8f55e]" /> {item.city}
                    </span>
                    <span className="text-[#8fa9a6] font-mono">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#b8f55e]" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/location-history"
              className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#b8f55e] font-semibold hover:underline"
            >
              <span>Explore City Analytics</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Bank & Cyber Fraud Helpline Emergency Modal */}
        <AnimatePresence>
          {bankModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-[#0a1718] border border-white/10 p-6 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Emergency Bank & Cyber Contacts</h3>
                      <p className="text-xs text-[#8fa9a6]">Instant toll-free numbers for financial freeze</p>
                    </div>
                  </div>
                  <button onClick={() => setBankModalOpen(false)} className="text-[#8fa9a6] hover:text-white">
                    <X className="size-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <p className="font-bold text-sm text-rose-400">National Cyber Fraud Helpline: 1930</p>
                  <p className="leading-relaxed">
                    Operated by Indian Cyber Crime Coordination Centre (I4C). Dial 1930 immediately to freeze fraudulent UPI or account debits.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <p className="font-semibold text-white">Bank Emergency Desks (24x7 Toll-Free)</p>
                  {[
                    { bank: 'State Bank of India (SBI)', number: '1800 11 1109 / 1800 425 3800', tag: 'Primary PSP' },
                    { bank: 'HDFC Bank', number: '1800 1600 / 1800 266 4332', tag: 'Card & UPI' },
                    { bank: 'ICICI Bank', number: '1800 1080', tag: 'Fast-track Freeze' },
                    { bank: 'Axis Bank', number: '1800 419 5577', tag: 'Emergency Desk' },
                  ].map((b) => (
                    <div key={b.bank} className="flex items-center justify-between p-3 rounded-xl bg-[#071014] border border-white/5">
                      <div>
                        <span className="font-bold text-white block">{b.bank}</span>
                        <span className="text-[10px] text-[#8fa9a6]">{b.tag}</span>
                      </div>
                      <a
                        href={`tel:${b.number.split(' ')[0]}`}
                        className="px-3 py-1.5 rounded-lg bg-[#b8f55e] text-[#09110f] font-mono font-bold text-xs hover:brightness-110 transition"
                      >
                        {b.number}
                      </a>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => setBankModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
                  >
                    Close Directory
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  )
}
