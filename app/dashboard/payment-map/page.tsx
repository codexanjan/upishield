'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Filter,
  Shield,
  ShieldAlert,
  Smartphone,
  Calendar,
  CreditCard,
  Send,
  Eye,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

interface PaymentMarker {
  id: string
  title: string
  amount: number
  payment_type: 'UPI' | 'Card' | 'Cash' | 'Bank Transfer'
  date: string
  time: string
  city: string
  area: string
  accuracy: string
  transaction_ref: string
  receiver: string
  device: string
  status: 'Completed' | 'Pending' | 'Failed' | 'Reported' | 'Disputed'
  marker_type: 'green' | 'blue' | 'yellow' | 'orange' | 'red'
  marker_label: string
  x: number // percentage for interactive map
  y: number // percentage for interactive map
}

const mockMarkers: PaymentMarker[] = [
  {
    id: 'TXN-849210',
    title: 'STAR CAFE',
    amount: 850,
    payment_type: 'UPI',
    date: '25 Sep 2026',
    time: '8:35 PM',
    city: 'Bengaluru',
    area: 'Koramangala 4th Block',
    accuracy: 'Approx. 120 m',
    transaction_ref: 'TXN-849210',
    receiver: 'starcafe@upi',
    device: 'Samsung Galaxy S24',
    status: 'Completed',
    marker_type: 'green',
    marker_label: 'Normal payment',
    x: 48,
    y: 62
  },
  {
    id: 'TXN-849211',
    title: 'NATURES BASKET',
    amount: 2100,
    payment_type: 'Card',
    date: '25 Sep 2026',
    time: '5:12 PM',
    city: 'Bengaluru',
    area: 'Indiranagar 100ft Rd',
    accuracy: 'Approx. 95 m',
    transaction_ref: 'TXN-849211',
    receiver: 'naturesbasket@hdfcbank',
    device: 'Samsung Galaxy S24',
    status: 'Completed',
    marker_type: 'blue',
    marker_label: 'Trusted merchant',
    x: 52,
    y: 58
  },
  {
    id: 'TXN-849212',
    title: 'MYSURU SILKS & CRAFTS',
    amount: 1200,
    payment_type: 'UPI',
    date: '24 Sep 2026',
    time: '7:15 PM',
    city: 'Mysuru',
    area: 'Devaraja Market',
    accuracy: 'Approx. 180 m',
    transaction_ref: 'TXN-849212',
    receiver: 'mysurusilks@upi',
    device: 'Samsung Galaxy S24',
    status: 'Completed',
    marker_type: 'yellow',
    marker_label: 'New location',
    x: 42,
    y: 72
  },
  {
    id: 'TXN-849213',
    title: 'MANGALURU COASTAL HUB',
    amount: 1950,
    payment_type: 'UPI',
    date: '23 Sep 2026',
    time: '2:40 PM',
    city: 'Mangaluru',
    area: 'Hampankatta',
    accuracy: 'Approx. 140 m',
    transaction_ref: 'TXN-849213',
    receiver: 'mangaluruhub@icici',
    device: 'Samsung Galaxy S24',
    status: 'Completed',
    marker_type: 'yellow',
    marker_label: 'New location',
    x: 35,
    y: 65
  },
  {
    id: 'TXN-849214',
    title: 'DELHI METRO RECHARGE',
    amount: 400,
    payment_type: 'UPI',
    date: '22 Sep 2026',
    time: '11:20 AM',
    city: 'Delhi',
    area: 'Connaught Place',
    accuracy: 'Approx. 210 m',
    transaction_ref: 'TXN-849214',
    receiver: 'dmrcpay@paytm',
    device: 'Samsung Galaxy S24',
    status: 'Completed',
    marker_type: 'orange',
    marker_label: 'Location warning',
    x: 50,
    y: 28
  },
  {
    id: 'TXN-849215',
    title: 'UNKNOWN TECH SUPPORT',
    amount: 18500,
    payment_type: 'UPI',
    date: '25 Sep 2026',
    time: '10:38 AM',
    city: 'Delhi',
    area: 'Rohini Sector 7',
    accuracy: 'Approx. 350 m',
    transaction_ref: 'TXN-849215',
    receiver: 'techsupport.refund@ybl',
    device: 'Unknown Android DEV-A782',
    status: 'Reported',
    marker_type: 'red',
    marker_label: 'Reported transaction',
    x: 54,
    y: 24
  }
]

export default function UserPaymentMapPage() {
  const [timeFilter, setTimeFilter] = useState<'Today' | '7 Days' | '30 Days' | '3 Months'>('30 Days')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [selectedMarker, setSelectedMarker] = useState<PaymentMarker | null>(mockMarkers[0])

  const filteredMarkers = mockMarkers.filter((m) => {
    if (typeFilter !== 'All' && m.payment_type !== typeFilter) return false
    if (statusFilter !== 'All' && m.status !== statusFilter) return false
    return true
  })

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="PERSONAL LOCATION INTELLIGENCE" variant="lime" />
            </div>
            <MotionWordReveal
              text="My Payment Map"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Interactive geographic record containing only your personal payment activities. Zero silent tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/location-history"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              Location History
            </Link>
            <Link
              href="/dashboard/report"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-600/30 transition"
            >
              <ShieldAlert className="size-3.5 text-rose-400" /> Report Anomaly
            </Link>
          </div>
        </div>

        {/* Filters Bar (Prompt Spec 5) */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
              <Filter className="size-3.5 text-[#b8f55e]" /> Range:
            </span>
            {(['Today', '7 Days', '30 Days', '3 Months'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  timeFilter === r
                    ? 'bg-[#b8f55e] text-[#071014] font-semibold shadow-md shadow-[#b8f55e]/20'
                    : 'bg-[#071014] text-[#8fa9a6] hover:text-white border border-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Payment Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8fa9a6]">Method:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#071014] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
              >
                <option value="All">All Types</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Transaction State */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8fa9a6]">State:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#071014] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
              >
                <option value="All">All States</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Reported">Reported</option>
                <option value="Disputed">Disputed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Map Canvas + Selected Marker Detail Panel */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Visual Interactive Map Grid */}
          <div className="relative rounded-2xl border border-white/10 bg-[#071014] p-6 min-h-[460px] overflow-hidden flex flex-col justify-between">
            {/* Cartographic Coordinate Grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#b8f55e 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Simulated Region Outline & Range Circles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-[340px] rounded-full border border-dashed border-white/10 opacity-30" />
              <div className="absolute size-[220px] rounded-full border border-dashed border-[#b8f55e]/20 opacity-40 animate-spin" style={{ animationDuration: '60s' }} />
            </div>

            {/* Top Overlay Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#0a1718]/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span className="size-2 rounded-full bg-[#b8f55e] animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  {filteredMarkers.length} Active Payment Locations Plotted
                </span>
              </div>

              <span className="text-[11px] font-mono text-[#8fa9a6] bg-[#0a1718]/80 px-2.5 py-1 rounded-lg border border-white/10">
                Lat/Long: Approximate Protected
              </span>
            </div>

            {/* Interactive Pins */}
            <div className="relative z-10 w-full h-[320px] my-auto">
              {filteredMarkers.map((marker) => {
                const isSelected = selectedMarker?.id === marker.id
                let markerBg = 'bg-[#b8f55e] ring-[#b8f55e]/30'
                if (marker.marker_type === 'blue') markerBg = 'bg-sky-400 ring-sky-400/30'
                if (marker.marker_type === 'yellow') markerBg = 'bg-amber-400 ring-amber-400/30'
                if (marker.marker_type === 'orange') markerBg = 'bg-orange-500 ring-orange-500/30'
                if (marker.marker_type === 'red') markerBg = 'bg-rose-500 ring-rose-500/40 animate-pulse'

                return (
                  <div
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker)}
                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Pulse Ring */}
                      <span className={`size-4 rounded-full ${markerBg} ring-8 transition-transform duration-200 group-hover:scale-125 ${isSelected ? 'scale-125 ring-white/40' : ''}`} />
                      
                      {/* Floating City Tag */}
                      <span className="mt-1 bg-[#0a1718]/95 border border-white/15 px-2 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-lg">
                        {marker.city} · ₹{marker.amount}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Legend (Prompt Spec 4) */}
            <div className="relative z-10 flex flex-wrap items-center gap-4 bg-[#0a1718]/90 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-[#8fa9a6] backdrop-blur-md">
              <span className="font-semibold text-white">Markers:</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#b8f55e]" /> Green: Normal</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sky-400" /> Blue: Trusted Merchant</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> Yellow: New Location</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" /> Orange: Warning</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" /> Red: Reported</span>
            </div>
          </div>

          {/* Marker Details Card (Prompt Spec 6 & 7) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between">
            {selectedMarker ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b8f55e]">
                      TRANSACTION LOCATION RECORD
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">{selectedMarker.title}</h3>
                    <p className="text-xs text-[#8fa9a6] mt-0.5">
                      {selectedMarker.area}, {selectedMarker.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white font-mono">₹{selectedMarker.amount}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                      selectedMarker.status === 'Reported'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30'
                    }`}>
                      {selectedMarker.status}
                    </span>
                  </div>
                </div>

                {/* Structured Fields Table */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Payment Type</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Send className="size-3 text-[#b8f55e]" /> {selectedMarker.payment_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Timestamp</span>
                    <span className="font-medium text-white">{selectedMarker.date} · {selectedMarker.time}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Transaction ID</span>
                    <span className="font-mono text-white">{selectedMarker.transaction_ref}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Receiver VPA</span>
                    <span className="font-mono text-white">{selectedMarker.receiver}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Device</span>
                    <span className="font-medium text-white flex items-center gap-1">
                      <Smartphone className="size-3 text-[#b8f55e]" /> {selectedMarker.device}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Location Accuracy</span>
                    <span className="font-medium text-sky-400">{selectedMarker.accuracy}</span>
                  </div>
                </div>

                {/* Classification Note */}
                <div className="p-3.5 rounded-xl bg-white/[.03] border border-white/5 text-[11px] text-[#8fa9a6] flex items-center gap-2.5">
                  <Info className="size-4 text-[#b8f55e] shrink-0" />
                  <span>
                    Marker Tag: <strong className="text-white">{selectedMarker.marker_label}</strong>. Evaluated deterministically without telemetry leakage.
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href={`/dashboard/transactions`}
                    className="flex-1 text-center py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
                  >
                    View Transaction
                  </Link>
                  <Link
                    href={`/dashboard/report?txnId=${selectedMarker.id}`}
                    className="flex-1 text-center py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition shadow-lg shadow-rose-600/20"
                  >
                    Report Transaction
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#8fa9a6]">
                <MapPin className="size-8 mx-auto text-white/20 mb-2" />
                <p className="text-xs">Click any marker pin on the map to inspect location telemetry details.</p>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-white/10 text-[10px] text-[#617773] text-center">
              Deterministic Location Intelligence · Client-Side Consent Enabled
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
