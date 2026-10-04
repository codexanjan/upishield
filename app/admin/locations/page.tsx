'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  MapPin,
  Flame,
  ShieldAlert,
  CreditCard,
  Send,
  Gem,
  Smartphone,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  Info
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import RealGoogleMap, { MapMarker } from '@/components/maps/real-google-map'

interface UnifiedLocationEvent {
  id: string
  source: 'UPI' | 'CARD' | 'MAJOR_PURCHASE' | 'LOGIN' | 'DEVICE'
  userId: string
  merchant: string
  amount?: number
  city: string
  country: string
  coordinates: [number, number] // [lat, lng]
  xPercent: number // for local canvas visual map
  yPercent: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'APPROVED' | 'BLOCKED' | 'FLAGGED'
  device: string
  timestamp: string
  anomalyReason?: string
}

export default function AdminUnifiedLocationsPage() {
  const { transactions, cardTransactions, majorPurchases, alerts } = useUPIGuardStore()

  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [riskFilter, setRiskFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<UnifiedLocationEvent | null>(null)

  // Assemble unified location telemetry combining UPI, Cards, and Major Purchases (Section 68)
  const unifiedEvents: UnifiedLocationEvent[] = useMemo(() => {
    const list: UnifiedLocationEvent[] = []

    // 1. Virtual Card Swipes
    cardTransactions.forEach((ct) => {
      const isDelhi = ct.location.city.toLowerCase().includes('delhi')
      const isMumbai = ct.location.city.toLowerCase().includes('mumbai')
      const isSingapore = ct.location.city.toLowerCase().includes('singapore')
      
      const xPercent = isDelhi ? 48 : isMumbai ? 34 : isSingapore ? 88 : 42
      const yPercent = isDelhi ? 25 : isMumbai ? 54 : isSingapore ? 76 : 66

      list.push({
        id: ct.transactionId,
        source: 'CARD',
        userId: ct.userId,
        merchant: ct.merchantName,
        amount: ct.amount,
        city: ct.location.city,
        country: ct.location.country,
        coordinates: isDelhi ? [28.5562, 77.1] : isMumbai ? [18.9986, 72.8258] : [15.3647, 75.124],
        xPercent,
        yPercent,
        riskScore: ct.riskScore,
        riskLevel: ct.riskLevel,
        status: ct.status === 'SETTLED' || ct.status === 'AUTHORIZED' ? 'APPROVED' : 'BLOCKED',
        device: ct.device?.deviceName || ct.device?.deviceId || 'Card Terminal',
        timestamp: ct.createdAt,
        anomalyReason: ct.riskLevel === 'CRITICAL' ? 'Impossible Travel Anomaly or Critical Risk Deviation' : undefined
      })
    })

    // 2. UPI Payments
    transactions.slice(0, 10).forEach((ut) => {
      list.push({
        id: ut.id,
        source: 'UPI',
        userId: ut.senderUpiId || 'anjan@upiguard',
        merchant: ut.receiverName || ut.receiverUpiId || 'Merchant',
        amount: ut.amount,
        city: ut.location?.city || 'Hubballi',
        country: ut.location?.country || 'India',
        coordinates: [15.3647, 75.124],
        xPercent: 42,
        yPercent: 66,
        riskScore: ut.riskScore || 15,
        riskLevel: (ut.riskLevel as any) || 'LOW',
        status: ut.status === 'APPROVED' || ut.status === 'SETTLED' ? 'APPROVED' : 'BLOCKED',
        device: ut.deviceId || 'Mobile UPI Intent',
        timestamp: ut.timestamps?.created || new Date().toISOString()
      })
    })

    // 3. Major Purchases
    majorPurchases.forEach((mp) => {
      list.push({
        id: mp.purchaseId,
        source: 'MAJOR_PURCHASE',
        userId: mp.userId,
        merchant: mp.merchantName,
        amount: mp.amount,
        city: mp.location.city,
        country: mp.location.country,
        coordinates: [15.3647, 75.124],
        xPercent: 42,
        yPercent: 66,
        riskScore: mp.riskScore,
        riskLevel: mp.riskLevel,
        status: mp.status === 'SUCCESSFUL' ? 'APPROVED' : 'BLOCKED',
        device: mp.deviceId,
        timestamp: mp.createdAt
      })
    })

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [cardTransactions, transactions, majorPurchases])

  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((ev) => {
      const q = search.toLowerCase()
      const matchesSearch =
        ev.merchant.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q) ||
        ev.id.toLowerCase().includes(q) ||
        ev.userId.toLowerCase().includes(q)

      const matchesSource = sourceFilter === 'ALL' || ev.source === sourceFilter
      const matchesRisk = riskFilter === 'ALL' || ev.riskLevel === riskFilter

      return matchesSearch && matchesSource && matchesRisk
    })
  }, [unifiedEvents, search, sourceFilter, riskFilter])

  // Select first critical or top event
  const currentInspect = selectedEvent || filteredEvents[0] || null

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                UNIFIED GEOGRAPHIC INTELLIGENCE
              </span>
              <span className="text-xs text-slate-400 font-mono">CROSS-CHANNEL CORRELATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Admin Unified Location Radar
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlated geographic telemetry uniting UPI, Virtual Credit Cards, Major Purchases, and Impossible Travel Velocity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-400">
              {unifiedEvents.length} Telemetry Events
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant, city, transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'CARD', 'UPI', 'MAJOR_PURCHASE'].map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  sourceFilter === src
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {src.replace('_', ' ')}
              </button>
            ))}
            <div className="h-4 w-px bg-white/10 mx-1" />
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRiskFilter(rf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  riskFilter === rf
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {rf}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Layout: Visual Map Canvas on Left, Details & Timeline on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Visual Geographic Radar Canvas (Section 32, 67) */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#091726]/90 p-5 backdrop-blur-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Compass className="size-4 text-cyan-400" /> Real Google Maps Intelligence & Travel Velocity
              </span>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                Interactive Coordinates Enabled
              </span>
            </div>

            {/* Real Google Map Container */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/20">
              <RealGoogleMap
                height="460px"
                center={[15.3647, 75.124]}
                zoom={5}
                markers={filteredEvents.map(ev => ({
                  id: ev.id,
                  title: `${ev.merchant} (${ev.city})`,
                  subtitle: `Source: ${ev.source} • ₹${ev.amount?.toLocaleString('en-IN') || 0} • Risk: ${ev.riskScore}/100`,
                  lat: ev.coordinates[0],
                  lng: ev.coordinates[1],
                  risk: ev.riskLevel === 'CRITICAL' ? 'critical' : ev.riskLevel === 'HIGH' ? 'high' : 'low',
                  status: ev.status === 'APPROVED' ? 'Active' : 'Blocked',
                  amount: ev.amount,
                  category: ev.source,
                  timestamp: ev.timestamp
                }))}
                onMarkerClick={(marker) => {
                  const ev = filteredEvents.find(e => e.id === marker.id)
                  if (ev) setSelectedEvent(ev)
                }}
              />
            </div>

            {/* Radar Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-400" /> Safe Baseline
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-400" /> Location Anomaly
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-rose-400" /> Impossible Velocity
                </span>
              </div>
              <span className="font-mono text-cyan-400">Click any coordinate or point to probe GPS</span>
            </div>
          </div>

          {/* Right Column: Selected Event Inspector & Unified Timeline (Section 68, 69) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Inspector Box */}
            {currentInspect && (
              <div className="rounded-2xl border border-cyan-500/30 bg-[#091726] p-5 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                  <span className="font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="size-4" /> Telemetry Inspector
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    currentInspect.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                    currentInspect.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {currentInspect.riskLevel} ({currentInspect.riskScore}/100)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-mono font-bold text-white">{currentInspect.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Rail:</span>
                    <span className="font-bold text-cyan-400">{currentInspect.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Merchant / Payee:</span>
                    <span className="font-bold text-white">{currentInspect.merchant}</span>
                  </div>
                  {currentInspect.amount && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-mono font-bold text-white">₹{currentInspect.amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-bold text-white">{currentInspect.city}, {currentInspect.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Terminal / Device:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{currentInspect.device}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-300 font-mono text-[10px]">{new Date(currentInspect.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {currentInspect.anomalyReason && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    ⚠️ {currentInspect.anomalyReason}
                  </div>
                )}
              </div>
            )}

            {/* Unified User Behavior Timeline (Section 95) */}
            <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="size-4 text-cyan-400" /> Unified Multi-Channel Timeline (Section 95)
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                {filteredEvents.map((ev, i) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/5"
                  >
                    <div className="mt-0.5 size-2 rounded-full bg-cyan-400 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{ev.merchant}</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {ev.amount ? `₹${ev.amount.toLocaleString('en-IN')}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span>{ev.source} • {ev.city}</span>
                        <span className={ev.riskLevel === 'CRITICAL' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
