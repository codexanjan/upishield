'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  CreditCard,
  Send,
  Plus
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

function mapSimulationTxnToTableRow(simTxn: any) {
  const isSuspicious = (simTxn.riskScore && simTxn.riskScore >= 60) || simTxn.riskLevel === 'HIGH' || simTxn.riskLevel === 'CRITICAL' || simTxn.flag_status === 'Suspicious'
  const isReview = (simTxn.riskScore && simTxn.riskScore >= 30 && simTxn.riskScore < 60) || simTxn.flag_status === 'Review'
  const flag_status = isSuspicious ? 'Suspicious' : isReview ? 'Review' : 'Normal'
  const reasons: string[] = []
  if (simTxn.xaiReason) reasons.push(simTxn.xaiReason)
  if (Array.isArray(simTxn.factors)) reasons.push(...simTxn.factors)
  if (Array.isArray(simTxn.flag_reasons)) reasons.push(...simTxn.flag_reasons)
  if (reasons.length === 0 && isSuspicious) {
    reasons.push('Elevated AI risk indicator detected')
  }

  return {
    id: simTxn.transactionId || simTxn.id || `sim-${Date.now()}`,
    transaction_reference: simTxn.transactionId || simTxn.transaction_reference || `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
    transaction_type: simTxn.transaction_type || 'UPI',
    merchant: simTxn.receiverName || simTxn.merchant || 'UPI Transfer',
    payment_method: simTxn.payment_method || 'UPI',
    amount: Number(simTxn.amount) || 0,
    status: simTxn.status === 'SETTLED' ? 'Completed' : simTxn.status === 'BLOCKED' ? 'Blocked' : simTxn.status || 'Completed',
    flag_status,
    flag_reasons: reasons,
    transaction_date: simTxn.timestamps?.settled || simTxn.timestamps?.created || simTxn.transaction_date || new Date().toISOString(),
    upi_details: {
      receiver_name: simTxn.receiverName || simTxn.merchant,
      receiver_upi: simTxn.receiverUpiId || simTxn.upi_details?.receiver_upi || 'receiver@upi'
    }
  }
}

export default function TransactionsPage() {
  const storeTransactions = useUPIGuardStore((s) => s.transactions)
  const [apiTransactions, setApiTransactions] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [flagFilter, setFlagFilter] = useState('All')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchTxns() {
      setLoading(true)
      try {
        const data = await apiRequest('/transactions?limit=100')
        if (Array.isArray(data) && data.length > 0) {
          setApiTransactions(data)
        } else {
          // Default initial transactions
          setApiTransactions([
            {
              id: 1,
              transaction_reference: 'TXN-2026-A101',
              transaction_type: 'UPI',
              merchant: 'Blue Tokai Coffee',
              payment_method: 'UPI',
              amount: 450.0,
              status: 'Completed',
              flag_status: 'Normal',
              flag_reasons: [],
              transaction_date: new Date().toISOString()
            },
            {
              id: 2,
              transaction_reference: 'TXN-2026-B202',
              transaction_type: 'UPI',
              merchant: 'quickcash.refund@fakeicici',
              payment_method: 'UPI',
              amount: 12500.0,
              status: 'Completed',
              flag_status: 'Suspicious',
              flag_reasons: ['Reported recipient UPI ID (2 verified cases on platform)'],
              transaction_date: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: 3,
              transaction_reference: 'TXN-2026-C303',
              transaction_type: 'Card',
              merchant: "Nature's Basket",
              payment_method: 'Visa (..4892)',
              amount: 3420.0,
              status: 'Completed',
              flag_status: 'Normal',
              flag_reasons: [],
              transaction_date: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: 4,
              transaction_reference: 'TXN-2026-D404',
              transaction_type: 'Card',
              merchant: 'CryptoWealth Express',
              payment_method: 'Mastercard (..1024)',
              amount: 62000.0,
              status: 'Completed',
              flag_status: 'Suspicious',
              flag_reasons: ['High Card Amount (>₹50,000)', 'Reported Merchant (Investment Scam)'],
              transaction_date: new Date(Date.now() - 259200000).toISOString()
            }
          ])
        }
      } catch {
        // Fallback demo transactions
      } finally {
        setLoading(false)
      }
    }
    fetchTxns()
  }, [])

  // Merge store transactions and api transactions (dedup by transaction_reference)
  const mappedStore = (storeTransactions || []).map(mapSimulationTxnToTableRow)
  const seenRefs = new Set<string>()
  const mergedTransactions: any[] = []

  // Add store transactions first (most recent Send UPI transactions)
  mappedStore.forEach((tx) => {
    const ref = tx.transaction_reference || String(tx.id)
    if (!seenRefs.has(ref)) {
      seenRefs.add(ref)
      mergedTransactions.push(tx)
    }
  })

  // Add API transactions
  ;(apiTransactions || []).forEach((tx) => {
    const ref = tx.transaction_reference || String(tx.id)
    if (!seenRefs.has(ref)) {
      seenRefs.add(ref)
      mergedTransactions.push(tx)
    }
  })

  const filtered = (mergedTransactions || []).filter((t) => {
    const matchesSearch =
      t.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      t.transaction_reference?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All' || t.transaction_type === typeFilter
    const matchesFlag = flagFilter === 'All' || t.flag_status === flagFilter
    return matchesSearch && matchesType && matchesFlag
  })

  return (
    <UserLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <MotionFadeUp delay={0.05}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b8f55e]">TRANSACTION LOG</span>
          </MotionFadeUp>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#eef8f7]">
            <MotionWordReveal text="All Transactions" delay={0.1} />
          </h1>
          <MotionFadeUp delay={0.2}>
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Search, filter, and review deterministic fraud rule flags on all payments.
            </p>
          </MotionFadeUp>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pay"
            className="flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition"
          >
            <Send className="size-3.5" /> New UPI Payment
          </Link>
          <Link
            href="/dashboard/cards"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1718] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/5 transition"
          >
            <CreditCard className="size-3.5 text-[#b8f55e]" /> Add Card Payment
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-white/8 bg-[#0a1718] p-4 mb-6">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search by merchant, UPI ID, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 size-4 text-slate-500" />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
            >
              <option value="All">All Types (UPI & Card)</option>
              <option value="UPI">UPI Payments</option>
              <option value="Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
            >
              <option value="All">All Flags</option>
              <option value="Normal">Normal</option>
              <option value="Review">Review Recommended</option>
              <option value="Suspicious">Suspicious</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Reference</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Merchant / Receiver</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Rule Assessment</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 font-mono text-slate-400">{t.transaction_reference}</td>
                    <td className="py-3.5 text-slate-400">
                      {new Date(t.transaction_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-white">{t.merchant}</p>
                      {t.upi_details?.receiver_upi && (
                        <p className="text-[10px] text-slate-400 font-mono">{t.upi_details.receiver_upi}</p>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-300">{t.payment_method}</td>
                    <td className="py-3.5 font-bold text-white">₹{t.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-3.5">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {t.flag_status === 'Suspicious' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="size-3" /> Suspicious
                          </span>
                          {t.flag_reasons?.length > 0 && (
                            <p className="text-[10px] text-rose-300/80 mt-1 max-w-xs truncate" title={t.flag_reasons[0]}>
                              {t.flag_reasons[0]}
                            </p>
                          )}
                        </div>
                      ) : t.flag_status === 'Review' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <CheckCircle2 className="size-3" /> Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/dashboard/report?transaction_id=${t.id}&merchant=${encodeURIComponent(t.merchant)}&amount=${t.amount}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 transition"
                      >
                        <ShieldAlert className="size-3" /> Report
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </UserLayout>
  )
}
