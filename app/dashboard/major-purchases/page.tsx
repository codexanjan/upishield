'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Laptop,
  GraduationCap,
  Building,
  Plane,
  Gem,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  MapPin,
  Smartphone,
  ExternalLink,
  Filter,
  X,
  PieChart,
  AlertTriangle
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { useUPIGuardStore, MajorPurchase } from '@/lib/upiguard-store'

export default function MajorPurchasesPage() {
  const { majorPurchases, transactions, accounts } = useUPIGuardStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedPurchase, setSelectedPurchase] = useState<MajorPurchase | null>(null)

  // Aggregate stats
  const stats = useMemo(() => {
    const all = majorPurchases
    const totalAmount = all.reduce((sum, p) => sum + (p.status === 'SUCCESSFUL' || p.status === 'SETTLED' ? p.amount : 0), 0)
    const count = all.filter((p) => p.status === 'SUCCESSFUL' || p.status === 'SETTLED').length
    const largest = all.reduce((max, p) => (p.amount > max ? p.amount : max), 0)
    const vehicleSpend = all
      .filter((p) => p.category.toLowerCase().includes('vehic') && (p.status === 'SUCCESSFUL' || p.status === 'SETTLED'))
      .reduce((sum, p) => sum + p.amount, 0)

    return { totalAmount, count, largest, vehicleSpend }
  }, [majorPurchases])

  const filteredPurchases = useMemo(() => {
    if (selectedCategory === 'ALL') return majorPurchases
    return majorPurchases.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()))
  }, [majorPurchases, selectedCategory])

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase()
    if (c.includes('vehic') || c.includes('car')) return <Sparkles className="size-5 text-amber-400" />
    if (c.includes('elec') || c.includes('laptop')) return <Laptop className="size-5 text-blue-400" />
    if (c.includes('edu')) return <GraduationCap className="size-5 text-purple-400" />
    if (c.includes('prop')) return <Building className="size-5 text-emerald-400" />
    if (c.includes('trav')) return <Plane className="size-5 text-cyan-400" />
    if (c.includes('jewel')) return <Gem className="size-5 text-rose-400" />
    return <Gem className="size-5 text-amber-400" />
  }

  return (
    <UserLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                PERSONAL FINANCE & HIGH-VALUE ASSETS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              MAJOR PURCHASES
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Closed-loop simulated capital purchases interconnected with Expenses, Budgets, and AI Risk Profiling
            </p>
          </div>

          <Link
            href="/dashboard/pay"
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="size-4" /> SIMULATE NEW MAJOR PURCHASE
          </Link>
        </div>

        {/* 4 Key Stat Cards (Section 35) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Major Purchases
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
              ₹{(stats.totalAmount / 100000).toFixed(1)}L
            </div>
            <p className="text-[11px] text-slate-400 mt-1">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Number of Purchases
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">
              {stats.count}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across 4 asset categories</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Largest Purchase
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">
              ₹{(stats.largest / 100000).toFixed(1)}L
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Hyundai Creta / Vehicle</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Vehicle Spend
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#5BD6FF] mt-1 font-mono">
              ₹{(stats.vehicleSpend / 100000).toFixed(1)}L
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ABC Motors closed-loop settlement</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'Vehicle', 'Electronics', 'Education', 'Property', 'Travel', 'Jewelry'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-[#06101D] shadow-md shadow-amber-400/20'
                  : 'bg-[#091726] border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Major Purchases List */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Asset Purchase Ledger
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredPurchases.length} Records
            </span>
          </div>

          <div className="space-y-3">
            {filteredPurchases.map((purchase) => {
              return (
                <div
                  key={purchase.id}
                  onClick={() => setSelectedPurchase(purchase)}
                  className="p-5 rounded-2xl bg-[#06101D] border border-white/5 hover:border-amber-400/30 transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      {getCategoryIcon(purchase.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{purchase.description}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {purchase.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Seller: <strong className="text-slate-300">{purchase.merchantName || purchase.merchantUpiId}</strong> · TXN: <span className="font-mono text-[#5BD6FF]">{purchase.transactionId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                    <div>
                      <div className="text-base font-black text-white font-mono">
                        ₹{purchase.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          purchase.status === 'SUCCESSFUL' || purchase.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {purchase.status}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 font-mono">
                        Risk: {purchase.riskScore}/100 ({purchase.riskLevel})
                      </span>
                    </div>

                    <ArrowRight className="size-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition hidden sm:block" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail Modal (Section 32) */}
        <AnimatePresence>
          {selectedPurchase && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-[#091726] border border-amber-400/30 text-white p-6 sm:p-8 shadow-2xl relative space-y-6"
              >
                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                      PAYMENT DETAILS · MAJOR PURCHASE
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      {selectedPurchase.description}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPurchase(null)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Amount */}
                <div className="p-4 rounded-2xl bg-[#06101D] border border-white/5 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Amount Settled</span>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                    ₹{selectedPurchase.amount.toLocaleString('en-IN')}.00
                  </div>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ✓ {selectedPurchase.status}
                  </span>
                </div>

                {/* Meta details list (Section 32) */}
                <div className="rounded-2xl bg-[#06101D] border border-white/5 p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seller / Merchant:</span>
                    <span className="text-white font-bold">{selectedPurchase.merchantName || selectedPurchase.merchantUpiId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seller UPI ID:</span>
                    <span className="text-[#5BD6FF]">{selectedPurchase.merchantUpiId || 'abcmotors@upiguard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="text-amber-400 font-bold">{selectedPurchase.riskScore} / 100 ({selectedPurchase.riskLevel})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Authentication:</span>
                    <span className="text-slate-200">
                      {selectedPurchase.authMethod ? selectedPurchase.authMethod.replace('_', ' ') + ' + OTP' : 'Face + OTP'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-200">Hubballi (Home Zone)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Device:</span>
                    <span className="text-slate-200">Anjan-Laptop (Trust: 94)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expense Linked:</span>
                    <span className="text-slate-200">{selectedPurchase.category} (Auto-recorded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget Impact:</span>
                    <span className="text-amber-300">Vehicle Budget (85% consumed)</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="text-slate-200 font-bold">{selectedPurchase.transactionId}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-200 text-center font-mono font-semibold">
                  SIMULATED SETTLEMENT · NO REAL MONEY MOVED
                </div>

                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase"
                >
                  Close Details
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  )
}
