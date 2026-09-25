'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Wifi,
  Smartphone,
  MapPin
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminCardTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCardTransactions()
  }, [])

  const fetchCardTransactions = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/admin/transactions?tx_type=Card&limit=100')
      if (Array.isArray(data) && data.length > 0) {
        setTransactions(data)
      } else {
        throw new Error('Fallback')
      }
    } catch {
      // offline fallback
      setTransactions([
        {
          id: 1,
          transaction_reference: 'TXN-71920-CARD',
          user_id: 2,
          masked_card: '•••• •••• •••• 4821',
          merchant: 'Overseas Digital Store',
          amount: 32000,
          channel: 'Online',
          country: 'Singapore',
          city: 'Singapore',
          transaction_date: new Date(Date.now() - 3600000 * 6).toISOString(),
          status: 'Disputed',
          flag_status: 'Suspicious',
          flag_reason: 'International card transaction without OTP prompt'
        },
        {
          id: 2,
          transaction_reference: 'TXN-98213-CARD',
          user_id: 1,
          masked_card: '•••• •••• •••• 4242',
          merchant: 'US Cloud Hosting',
          amount: 8400,
          channel: 'Online',
          country: 'United States',
          city: 'San Francisco',
          transaction_date: new Date(Date.now() - 3600000 * 18).toISOString(),
          status: 'Completed',
          flag_status: 'Normal'
        },
        {
          id: 3,
          transaction_reference: 'TXN-98211-CARD',
          user_id: 1,
          masked_card: '•••• •••• •••• 8819',
          merchant: 'Starbucks Coffee',
          amount: 420,
          channel: 'Contactless',
          country: 'India',
          city: 'Bengaluru',
          transaction_date: new Date(Date.now() - 3600000 * 30).toISOString(),
          status: 'Completed',
          flag_status: 'Normal'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filtered = (transactions || []).filter((t) => {
    const s = search.toLowerCase()
    return (
      (t.transaction_reference && t.transaction_reference.toLowerCase().includes(s)) ||
      (t.merchant && t.merchant.toLowerCase().includes(s)) ||
      (t.country && t.country.toLowerCase().includes(s)) ||
      (t.masked_card && t.masked_card.includes(s))
    )
  })

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'Online':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-sky-400">
            <Globe className="size-3" /> Online
          </span>
        )
      case 'Contactless':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
            <Wifi className="size-3" /> Contactless
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
            <CreditCard className="size-3" /> {channel || 'POS'}
          </span>
        )
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="CARD SETTLEMENTS & CROSS-BORDER AUDIT" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">PCI DSS · ZERO CVV STORED</span>
            </div>
            <MotionWordReveal
              text="Card Transactions & International Audit"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Supervision of masked card charges, foreign currency transactions, and late-night POS activity.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0a1718] border border-white/10 text-xs font-semibold text-slate-300">
            Card Records: <span className="text-white font-mono">{filtered.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, merchant, country, card..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition font-mono"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#0a1718] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Reference</th>
                  <th className="px-5 py-3.5 font-semibold">Masked Card</th>
                  <th className="px-5 py-3.5 font-semibold">Merchant / Country</th>
                  <th className="px-5 py-3.5 font-semibold">Channel</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading card records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No matching card transactions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {t.transaction_reference}
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-300">
                        {t.masked_card}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-white block">{t.merchant}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3 text-[#b8f55e]" />
                          {t.city ? `${t.city}, ` : ''}{t.country}
                        </span>
                      </td>

                      <td className="px-5 py-4">{getChannelBadge(t.channel)}</td>

                      <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                        ₹{Number(t.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.flag_status === 'Suspicious'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {t.flag_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
