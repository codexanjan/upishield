'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  Search,
  MapPin,
  Users,
  Smartphone,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Info,
  X,
  ExternalLink,
  Layers
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminQRIntelligencePage() {
  const [qrs, setQrs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedQR, setSelectedQR] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')

  useEffect(() => {
    // mock QR intelligence directory per Sections 44 & 45
    setQrs([
      {
        id: 1,
        qr_hash: 'QRF-81291',
        fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        upi_id: 'unknown@upi',
        merchant_name: 'Quick Pay Services Delhi',
        scans_count: 84,
        users_count: 31,
        cities_count: 5,
        reports_count: 7,
        first_scanned: '12 Sep 2026',
        last_scanned: 'Today, 2:13 AM',
        locations: [
          { city: 'Delhi', scans: 42, reports: 5 },
          { city: 'Bengaluru', scans: 22, reports: 1 },
          { city: 'Mumbai', scans: 12, reports: 1 },
          { city: 'Pune', scans: 5, reports: 0 },
          { city: 'Hyderabad', scans: 3, reports: 0 }
        ]
      },
      {
        id: 2,
        qr_hash: 'QRF-92144',
        fingerprint: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        upi_id: 'starcafe@upi',
        merchant_name: 'Star Cafe Koramangala',
        scans_count: 1420,
        users_count: 620,
        cities_count: 1,
        reports_count: 0,
        first_scanned: '01 Aug 2026',
        last_scanned: 'Today, 8:35 PM',
        locations: [
          { city: 'Bengaluru', scans: 1420, reports: 0 }
        ]
      },
      {
        id: 3,
        qr_hash: 'QRF-30192',
        fingerprint: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        upi_id: 'rewards.cashback@upi',
        merchant_name: 'Instant Cash Rewards',
        scans_count: 156,
        users_count: 89,
        cities_count: 3,
        reports_count: 6,
        first_scanned: '18 Sep 2026',
        last_scanned: 'Yesterday',
        locations: [
          { city: 'Mumbai', scans: 94, reports: 4 },
          { city: 'Delhi', scans: 42, reports: 2 },
          { city: 'Kolkata', scans: 20, reports: 0 }
        ]
      }
    ])
  }, [])

  const filtered = (qrs || []).filter(
    (q) =>
      q.qr_hash?.toLowerCase().includes(search.toLowerCase()) ||
      q.upi_id?.toLowerCase().includes(search.toLowerCase()) ||
      q.merchant_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="QR LOCATION INTELLIGENCE" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">SECTIONS 44 & 45</span>
            </div>
            <MotionWordReveal
              text="QR Payload Directory & Dispersal Map"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Identify repeated QR payload usage across cities, correlate scanning devices, and isolate duplicate stickers.
            </p>
          </div>

          <div className="flex bg-[#071014] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'table' ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
              }`}
            >
              QR Directory
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'map' ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
              }`}
            >
              QR Map (Section 45)
            </button>
          </div>
        </div>

        {/* SECTION 45: QR MAP */}
        {viewMode === 'map' ? (
          <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-[#b8f55e]" />
                <h3 className="text-sm font-semibold text-white">Cross-City QR Scan Distribution Map</h3>
              </div>
              <span className="text-[10px] font-mono text-purple-400 font-semibold uppercase">
                DETECTING DUPLICATE SCAMS
              </span>
            </div>

            <div className="relative h-96 rounded-2xl bg-[#071014] border border-white/10 overflow-hidden p-6 flex flex-col justify-between">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b8f55e_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto">
                {filtered.map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => setSelectedQR(qr)}
                    className="p-4 rounded-xl bg-[#0a1718]/90 border border-purple-500/30 text-left transition hover:scale-[1.02] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{qr.qr_hash}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                        {qr.cities_count} Cities
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-semibold truncate">{qr.merchant_name}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">{qr.upi_id}</p>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{qr.scans_count} Scans</span>
                      <span className="text-rose-400 font-mono font-bold">{qr.reports_count} Reports</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                <span>Plotting verified scan coordinates where users allowed browser/device permission</span>
                <span className="font-mono text-[#b8f55e]">FINGERPRINT LEDGER</span>
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
                placeholder="Search by QR Hash, VPA, Merchant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#071014] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e] font-mono"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">QR Hash / VPA</th>
                    <th className="px-5 py-3.5 font-semibold">Merchant</th>
                    <th className="px-5 py-3.5 font-semibold">Scans / Users</th>
                    <th className="px-5 py-3.5 font-semibold">Cities Active</th>
                    <th className="px-5 py-3.5 font-semibold">Platform Reports</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {filtered.map((qr) => (
                    <tr key={qr.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-white block">{qr.qr_hash}</span>
                        <span className="text-[11px] font-mono text-slate-400">{qr.upi_id}</span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-white">{qr.merchant_name}</td>

                      <td className="px-5 py-4 font-mono">
                        <span className="text-white font-bold">{qr.scans_count}</span> scans ·{' '}
                        <span className="text-slate-400">{qr.users_count} users</span>
                      </td>

                      <td className="px-5 py-4 font-mono text-[#b8f55e] font-semibold">
                        {qr.cities_count} {qr.cities_count === 1 ? 'City' : 'Cities'}
                      </td>

                      <td className="px-5 py-4 font-mono">
                        <span className="text-rose-400 font-bold">{qr.reports_count}</span> reports
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedQR(qr)}
                          className="px-3 py-1.5 rounded-lg bg-[#b8f55e]/15 hover:bg-[#b8f55e]/25 border border-[#b8f55e]/30 text-xs font-semibold text-[#b8f55e] transition"
                        >
                          Section 44 Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 44: ADMIN QR PROFILE MODAL */}
        <AnimatePresence>
          {selectedQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1 }}
                className="w-full max-w-2xl rounded-3xl bg-[#0a1718] border border-[#b8f55e]/30 p-6 space-y-6 shadow-2xl"
              >
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-bold text-white">{selectedQR.qr_hash}</span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 font-mono">
                        NORMALIZED PAYLOAD
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{selectedQR.upi_id} · {selectedQR.merchant_name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedQR(null)}
                    className="p-2 rounded-xl bg-[#071014] border border-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Section 44 Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Scans</span>
                    <span className="text-white font-bold text-base font-mono block mt-1">
                      {selectedQR.scans_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Users</span>
                    <span className="text-white font-bold text-base font-mono block mt-1">
                      {selectedQR.users_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Cities</span>
                    <span className="text-[#b8f55e] font-bold text-base font-mono block mt-1">
                      {selectedQR.cities_count}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-slate-500 block text-[10px] uppercase">Reports</span>
                    <span className="text-rose-400 font-bold text-base font-mono block mt-1">
                      {selectedQR.reports_count}
                    </span>
                  </div>
                </div>

                {/* Locations Breakdown */}
                <div className="p-4 rounded-xl bg-[#071014] border border-white/5 space-y-2">
                  <span className="text-xs font-bold text-white block">Observed Scan Locations</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(selectedQR.locations || []).map((loc: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#0a1718] border border-white/5 text-xs">
                        <span className="font-semibold text-white block">{loc.city}</span>
                        <span className="text-[11px] text-slate-400">{loc.scans} scans · {loc.reports} reports</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#071014] border border-white/5 text-[11px] font-mono text-slate-400 truncate">
                  SHA-256 Fingerprint: {selectedQR.fingerprint}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
