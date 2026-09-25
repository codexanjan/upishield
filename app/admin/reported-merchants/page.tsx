'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  MapPin,
  ExternalLink,
  QrCode,
  Users,
  Briefcase,
  X,
  CreditCard
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminReportedMerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')

  useEffect(() => {
    fetchReportedMerchants()
  }, [])

  const fetchReportedMerchants = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/admin/reported-merchants')
      if (Array.isArray(data) && data.length > 0) {
        setMerchants(data)
      } else {
        throw new Error('Fallback')
      }
    } catch {
      // offline fallback
      setMerchants([
        {
          id: 1,
          merchant_name: 'ABC STORE',
          city: 'Bengaluru',
          area: 'Indiranagar',
          upi_ids_count: 2,
          transactions_count: 892,
          users_count: 314,
          report_count: 9,
          verified_count: 3,
          qr_fingerprints_count: 2,
          cases_count: 4,
          categories: ['Card Fraud', 'Phishing'],
          last_reported_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          status: 'Frequently Reported'
        },
        {
          id: 2,
          merchant_name: 'Tech Support Live Ltd',
          city: 'Delhi',
          area: 'Connaught Place',
          upi_ids_count: 3,
          transactions_count: 412,
          users_count: 180,
          report_count: 5,
          verified_count: 4,
          qr_fingerprints_count: 1,
          cases_count: 3,
          categories: ['Fake Customer Support', 'UPI Scam'],
          last_reported_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          status: 'Under Review'
        },
        {
          id: 3,
          merchant_name: 'Star Cafe Koramangala',
          city: 'Bengaluru',
          area: 'Koramangala',
          upi_ids_count: 1,
          transactions_count: 1420,
          users_count: 620,
          report_count: 0,
          verified_count: 0,
          qr_fingerprints_count: 1,
          cases_count: 0,
          categories: ['Dining'],
          last_reported_at: null,
          status: 'Trusted'
        },
        {
          id: 4,
          merchant_name: 'Instant Cash Rewards',
          city: 'Mumbai',
          area: 'Andheri',
          upi_ids_count: 1,
          transactions_count: 154,
          users_count: 98,
          report_count: 4,
          verified_count: 2,
          qr_fingerprints_count: 2,
          cases_count: 2,
          categories: ['Job Scam', 'Collect Request Scam'],
          last_reported_at: new Date(Date.now() - 3600000 * 40).toISOString(),
          status: 'Normal'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filtered = (merchants || []).filter((m) =>
    m.merchant_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.city?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Trusted':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            TRUSTED
          </span>
        )
      case 'Frequently Reported':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            FREQUENTLY REPORTED
          </span>
        )
      case 'Under Review':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            UNDER REVIEW
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            NORMAL
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
              <MotionBadge text="MERCHANT INTELLIGENCE" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">LOCATION & REPUTATION DIRECTORY</span>
            </div>
            <MotionWordReveal
              text="Reported Merchants & Location Map"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Monitor merchant locations, linked UPI IDs, QR fingerprints, and cross-user fraud cases.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#071014] p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'table' ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Table Directory
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'map' ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Merchant Map
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <Info className="size-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-semibold block mb-0.5">UPI Shield Platform Reports Notice</span>
            <p className="text-amber-300/80 leading-relaxed">
              These records represent user fraud reports and platform telemetry compiled within UPI Shield. They do not constitute official NPCI or banking authority blacklists.
            </p>
          </div>
        </div>

        {/* SECTION 41: ADMIN MERCHANT MAP */}
        {viewMode === 'map' ? (
          <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-[#b8f55e]" />
                <h3 className="text-sm font-semibold text-white">Geographic Merchant Reputation Map</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="size-2 rounded-full bg-emerald-400" /> Trusted
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <span className="size-2 rounded-full bg-slate-400" /> Normal
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <span className="size-2 rounded-full bg-amber-400" /> Under Review
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="size-2 rounded-full bg-rose-400" /> Frequently Reported
                </span>
              </div>
            </div>

            {/* Simulated Vector Map Grid */}
            <div className="relative h-96 rounded-2xl bg-[#071014] border border-white/10 overflow-hidden p-6 flex flex-col justify-between">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b8f55e_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto">
                {filtered.map((m) => {
                  const borderCol =
                    m.status === 'Trusted'
                      ? 'border-emerald-500/40 text-emerald-400'
                      : m.status === 'Frequently Reported'
                      ? 'border-rose-500/40 text-rose-400'
                      : m.status === 'Under Review'
                      ? 'border-amber-500/40 text-amber-400'
                      : 'border-slate-500/40 text-slate-300'

                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMerchant(m)}
                      className={`p-4 rounded-xl bg-[#0a1718]/90 border text-left transition hover:scale-[1.02] ${borderCol}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{m.merchant_name}</span>
                        {getStatusBadge(m.status)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="size-3 text-slate-400" />
                        {m.area}, {m.city}
                      </p>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{m.transactions_count} Txns</span>
                        <span className="font-mono text-rose-400">{m.report_count} Reports</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                <span>Click any merchant card to inspect complete location profile (Section 42)</span>
                <span className="font-mono text-[#b8f55e]">GEOCODED PLATFORM LEDGER</span>
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="rounded-2xl bg-[#0a1718] border border-white/10 overflow-hidden space-y-4 p-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchant or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#071014] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Merchant / Location</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Reports (Verified)</th>
                    <th className="px-5 py-3.5 font-semibold">Transactions / Users</th>
                    <th className="px-5 py-3.5 font-semibold">QR Fingerprints</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        Loading merchant directory...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No merchants found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-5 py-4">
                          <span className="font-bold text-white block">{m.merchant_name}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 text-[#b8f55e]" />
                            {m.area ? `${m.area}, ` : ''}{m.city}
                          </span>
                        </td>

                        <td className="px-5 py-4">{getStatusBadge(m.status)}</td>

                        <td className="px-5 py-4 font-mono">
                          <span className="text-rose-400 font-bold">{m.report_count}</span>{' '}
                          <span className="text-slate-500">({m.verified_count} verified)</span>
                        </td>

                        <td className="px-5 py-4 font-mono">
                          <span className="text-white font-semibold">{m.transactions_count}</span> txns ·{' '}
                          <span className="text-slate-400">{m.users_count} users</span>
                        </td>

                        <td className="px-5 py-4 font-mono">
                          <span className="text-purple-400 font-bold">{m.qr_fingerprints_count}</span> QR IDs
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedMerchant(m)}
                            className="px-3 py-1.5 rounded-lg bg-[#b8f55e]/15 hover:bg-[#b8f55e]/25 border border-[#b8f55e]/30 text-xs font-semibold text-[#b8f55e] transition"
                          >
                            Inspect Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 42: MERCHANT LOCATION PROFILE MODAL */}
        <AnimatePresence>
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl rounded-3xl bg-[#0a1718] border border-[#b8f55e]/30 p-6 space-y-6 shadow-2xl"
              >
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{selectedMerchant.merchant_name}</h3>
                      {getStatusBadge(selectedMerchant.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-[#b8f55e]" />
                      Location: {selectedMerchant.area ? `${selectedMerchant.area}, ` : ''}{selectedMerchant.city}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-2 rounded-xl bg-[#071014] border border-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Section 42 Schema Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">City</span>
                    <span className="text-white font-bold text-sm block mt-1">{selectedMerchant.city}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">UPI IDs</span>
                    <span className="text-[#b8f55e] font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.upi_ids_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Transactions</span>
                    <span className="text-white font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.transactions_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Users</span>
                    <span className="text-white font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.users_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Reports</span>
                    <span className="text-rose-400 font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.report_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Verified Reports</span>
                    <span className="text-rose-400 font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.verified_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">QR Fingerprints</span>
                    <span className="text-purple-400 font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.qr_fingerprints_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Associated Cases</span>
                    <span className="text-amber-400 font-bold text-sm font-mono block mt-1">
                      {selectedMerchant.cases_count}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#071014] border border-white/5 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-white block">Administrative Risk Recommendation</span>
                  <p className="text-slate-400 leading-relaxed">
                    Merchant demonstrates multi-user activity across {selectedMerchant.city}. Deterministic platform rules flag transactions when new QR payloads or mismatched VPAs are presented.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
