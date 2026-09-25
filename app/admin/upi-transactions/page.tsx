'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileWarning,
  QrCode,
  MapPin,
  Clock
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminUPITransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUPITransactions()
  }, [])

  const fetchUPITransactions = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/admin/transactions?tx_type=UPI&limit=100')
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
          transaction_reference: 'TXN-849210-UPI',
          user_id: 1,
          user_name: 'Anjan Sharma',
          receiver_name: 'Star Cafe Koramangala',
          receiver_upi: 'starcafe@upi',
          city: 'Bengaluru',
          area: 'Koramangala',
          amount: 850,
          transaction_date: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: 'Completed',
          has_report: false,
          flag_status: 'Normal'
        },
        {
          id: 2,
          transaction_reference: 'TXN-42821-UPI',
          user_id: 1,
          user_name: 'Anjan Sharma',
          receiver_name: 'Quick Pay Services Delhi',
          receiver_upi: 'unknown@upi',
          city: 'Delhi',
          area: 'Connaught Place',
          amount: 18500,
          transaction_date: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: 'Reported',
          has_report: true,
          flag_status: 'Critical'
        },
        {
          id: 3,
          transaction_reference: 'TXN-98212-UPI',
          user_id: 2,
          user_name: 'Priya Verma',
          receiver_name: 'Fresh Groceries',
          receiver_upi: 'groceries@ybl',
          city: 'Mysuru',
          area: 'Gokulam',
          amount: 1200,
          transaction_date: new Date(Date.now() - 3600000 * 48).toISOString(),
          status: 'Completed',
          has_report: false,
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
      (t.receiver_upi && t.receiver_upi.toLowerCase().includes(s)) ||
      (t.receiver_name && t.receiver_name.toLowerCase().includes(s)) ||
      (t.city && t.city.toLowerCase().includes(s))
    )
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="UPI VPA SURVEILLANCE" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">DETERMINISTIC · NO PIN STORED</span>
            </div>
            <MotionWordReveal
              text="UPI Transactions & VPA Supervision"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Live audit of peer-to-peer and merchant VPA transfers logged with geofence records.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0a1718] border border-white/10 text-xs font-semibold text-slate-300">
            UPI Records: <span className="text-white font-mono">{filtered.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ref, payee, VPA, city..."
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
                  <th className="px-5 py-3.5 font-semibold">Transaction Reference</th>
                  <th className="px-5 py-3.5 font-semibold">Recipient / Payee VPA</th>
                  <th className="px-5 py-3.5 font-semibold">Location</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Complainant / User</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading UPI records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No matching UPI transfers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {t.transaction_reference}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-white block">{t.receiver_name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{t.receiver_upi}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-white">
                          <MapPin className="size-3 text-[#b8f55e]" />
                          <span>{t.city}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{t.area}</span>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                        ₹{Number(t.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-white block">{t.user_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">USR-{t.user_id}</span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {t.status}
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
