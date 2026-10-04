'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MapPin,
  Layers,
  Filter,
  Sliders,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Flame,
  Smartphone,
  Send,
  CreditCard,
  QrCode,
  Store,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'
import RealGoogleMap from '@/components/maps/real-google-map'

interface AdminMarker {
  id: string
  txnRef: string
  amount: number
  userId: string
  userName: string
  receiver: string
  city: string
  device: string
  deviceStatus: 'NEW' | 'VERIFIED' | 'SUSPECT'
  payeeStatus: 'NEW' | 'TRUSTED' | 'REPORTED'
  platformReports: number
  caseId: string
  layer: string
  risk: 'Normal' | 'Review' | 'High' | 'Critical'
  x: number
  y: number
  lat: number
  lng: number
}

const mockAdminMarkers: AdminMarker[] = [
  {
    id: '1',
    txnRef: 'TXN-42821',
    amount: 28500,
    userId: 'USR-382',
    userName: 'Karan Mehra',
    receiver: 'abc@upi',
    city: 'Delhi',
    device: 'DEV-A782',
    deviceStatus: 'NEW',
    payeeStatus: 'NEW',
    platformReports: 6,
    caseId: 'CASE-821',
    layer: 'Critical Cases',
    risk: 'Critical',
    x: 52,
    y: 26,
    lat: 28.6139,
    lng: 77.2090
  },
  {
    id: '2',
    txnRef: 'TXN-42822',
    amount: 1250,
    userId: 'USR-104',
    userName: 'Anjan Sharma',
    receiver: 'coffee.star@ybl',
    city: 'Bengaluru',
    device: 'DEV-A8219',
    deviceStatus: 'VERIFIED',
    payeeStatus: 'TRUSTED',
    platformReports: 0,
    caseId: 'None',
    layer: 'Transactions',
    risk: 'Normal',
    x: 48,
    y: 64,
    lat: 12.9716,
    lng: 77.5946
  },
  {
    id: '3',
    txnRef: 'TXN-42823',
    amount: 14200,
    userId: 'USR-291',
    userName: 'Rahul Nair',
    receiver: 'scammer.refund@okaxis',
    city: 'Mumbai',
    device: 'DEV-M9420',
    deviceStatus: 'VERIFIED',
    payeeStatus: 'REPORTED',
    platformReports: 12,
    caseId: 'CASE-792',
    layer: 'Fraud Reports',
    risk: 'High',
    x: 36,
    y: 48,
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: '4',
    txnRef: 'TXN-42824',
    amount: 450,
    userId: 'USR-502',
    userName: 'Pooja Iyer',
    receiver: 'mysurusilks@upi',
    city: 'Mysuru',
    device: 'DEV-P2019',
    deviceStatus: 'VERIFIED',
    payeeStatus: 'TRUSTED',
    platformReports: 0,
    caseId: 'None',
    layer: 'Transactions',
    risk: 'Normal',
    x: 44,
    y: 72,
    lat: 12.2958,
    lng: 76.6394
  },
  {
    id: '5',
    txnRef: 'TXN-42825',
    amount: 32000,
    userId: 'USR-819',
    userName: 'Vikram Joshi',
    receiver: 'global.qr.hub@icici',
    city: 'Delhi',
    device: 'DEV-A91821',
    deviceStatus: 'SUSPECT',
    payeeStatus: 'REPORTED',
    platformReports: 8,
    caseId: 'CASE-834',
    layer: 'Reported Merchants',
    risk: 'Critical',
    x: 56,
    y: 22,
    lat: 28.7041,
    lng: 77.1025
  }
]

export default function AdminPaymentMapPage() {
  const [layers, setLayers] = useState({
    transactions: true,
    fraudReports: true,
    criticalCases: true,
    devices: false,
    userLogins: false,
    qrScans: true,
    merchants: true,
    reportedUpi: true
  })

  const [timeFilter, setTimeFilter] = useState('Today')
  const [riskFilter, setRiskFilter] = useState('All')
  const [selectedMarker, setSelectedMarker] = useState<AdminMarker | null>(mockAdminMarkers[0])

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers({ ...layers, [key]: !layers[key] })
  }

  const filteredMarkers = mockAdminMarkers.filter((m) => {
    if (riskFilter !== 'All' && m.risk !== riskFilter) return false
    return true
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="ADMIN PLATFORM GEOGRAPHY · SPECIFICATION 27" variant="blue" />
            </div>
            <MotionWordReveal
              text="Live Platform Payment & Threat Map"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time multi-layer geospatial engine for live transactions, fraud reports, shared hardware devices & critical cases.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/fraud-map"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              <Flame className="size-3.5 text-rose-400" /> Fraud Heatmap
            </Link>
            <Link
              href="/admin/cases/board"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-semibold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              Investigation Board
            </Link>
          </div>
        </div>

        {/* Global Filter Bar (Prompt Spec 28) */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
              <Filter className="size-3.5 text-[#b8f55e]" /> Time Window:
            </span>
            {['15 Minutes', '1 Hour', 'Today', '7 Days', '30 Days'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  timeFilter === t
                    ? 'bg-[#b8f55e] text-[#071014] font-semibold'
                    : 'bg-[#071014] text-[#8fa9a6] hover:text-white border border-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8fa9a6]">Risk Tier:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-[#071014] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
            >
              <option value="All">All Risks</option>
              <option value="Normal">Normal</option>
              <option value="Review">Review</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* 3-Column Layout: Layer Toggles + Map Canvas + Marker Inspector (Prompt Spec 29 & 30) */}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr_320px]">
          {/* Column 1: Map Layers Control Panel (Prompt Spec 30) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Layers className="size-4 text-[#b8f55e]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">MAP LAYERS</h3>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'transactions', label: 'Transactions', state: layers.transactions },
                { key: 'fraudReports', label: 'Fraud Reports', state: layers.fraudReports },
                { key: 'criticalCases', label: 'Critical Cases', state: layers.criticalCases },
                { key: 'devices', label: 'Devices Activity', state: layers.devices },
                { key: 'userLogins', label: 'Login Locations', state: layers.userLogins },
                { key: 'qrScans', label: 'QR Scans', state: layers.qrScans },
                { key: 'merchants', label: 'Merchants', state: layers.merchants },
                { key: 'reportedUpi', label: 'Reported UPI IDs', state: layers.reportedUpi },
              ].map((layer) => (
                <div
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key as any)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5 cursor-pointer hover:border-white/20 transition"
                >
                  <span className="text-slate-300 font-medium">{layer.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    layer.state
                      ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    {layer.state ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[10px] text-slate-500 border-t border-white/10">
              Deterministic Layer Toggle · Client Isolation Active
            </div>
          </div>

          {/* Column 2: Interactive Geospatial Canvas */}
          <div className="relative rounded-2xl border border-white/10 bg-[#071014] p-6 min-h-[500px] flex flex-col justify-between overflow-hidden">
            {/* Background Grid */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#b8f55e 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#0a1718]/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  {filteredMarkers.length} Operations Markers Rendered
                </span>
              </div>

              <span className="text-[11px] font-mono text-slate-400 bg-[#0a1718]/80 px-2.5 py-1 rounded-lg border border-white/10">
                Live Feed: 18,420 Txns Scanned
              </span>
            </div>

            {/* Real Google Maps Operations Feed */}
            <div className="relative z-10 w-full rounded-2xl overflow-hidden border border-white/10 my-2">
              <RealGoogleMap
                height="380px"
                center={[20.5937, 78.9629]}
                zoom={4}
                markers={filteredMarkers.map((m) => ({
                  id: m.id,
                  title: `${m.txnRef} • ${m.userName}`,
                  subtitle: `Payee: ${m.receiver} • ₹${m.amount.toLocaleString()} • Device: ${m.device} (${m.deviceStatus})`,
                  lat: m.lat,
                  lng: m.lng,
                  risk: m.risk === 'Critical' ? 'critical' : m.risk === 'High' ? 'high' : 'low',
                  status: m.layer,
                  amount: m.amount,
                  category: m.device
                }))}
                onMarkerClick={(marker) => {
                  const found = filteredMarkers.find(m => m.id === marker.id)
                  if (found) setSelectedMarker(found)
                }}
              />
            </div>

            {/* Bottom Status */}
            <div className="relative z-10 flex items-center justify-between text-xs text-[#8fa9a6] bg-[#0a1718]/90 border border-white/10 px-4 py-2 rounded-xl">
              <span>Layers Active: Critical Cases, Fraud Reports, Merchants</span>
              <span className="text-[#b8f55e] font-semibold">Deterministic Zero-AI Guard</span>
            </div>
          </div>

          {/* Column 3: Admin Marker Details (Prompt Spec 29) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 flex flex-col justify-between space-y-4">
            {selectedMarker ? (
              <div className="space-y-4 text-xs">
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b8f55e]">
                      TRANSACTION INSPECTOR
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedMarker.risk === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {selectedMarker.risk}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1 font-mono">{selectedMarker.txnRef}</h3>
                  <p className="text-2xl font-bold text-white font-mono mt-1">₹{selectedMarker.amount.toLocaleString()}</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">User ID</span>
                    <span className="font-mono text-white">{selectedMarker.userId} ({selectedMarker.userName})</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Receiver VPA</span>
                    <span className="font-mono text-rose-400 truncate max-w-[160px]">{selectedMarker.receiver}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Location</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <MapPin className="size-3 text-[#b8f55e]" /> {selectedMarker.city}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Device ID</span>
                    <span className="font-mono text-white">{selectedMarker.device}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Device Status</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      selectedMarker.deviceStatus === 'NEW' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedMarker.deviceStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Payee Status</span>
                    <span className="font-bold text-rose-400">{selectedMarker.payeeStatus}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Platform Reports</span>
                    <span className="font-mono font-bold text-rose-400">{selectedMarker.platformReports} Reports</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-[#8fa9a6]">Linked Case</span>
                    <span className="font-mono text-[#b8f55e] font-bold">{selectedMarker.caseId}</span>
                  </div>
                </div>

                {/* 4 Quick Actions (Prompt Spec 29) */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href={`/admin/transactions`}
                    className="p-2 text-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition"
                  >
                    Open Txn
                  </Link>
                  <Link
                    href={`/admin/users`}
                    className="p-2 text-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition"
                  >
                    Open User
                  </Link>
                  <Link
                    href={`/admin/devices/${selectedMarker.device}`}
                    className="p-2 text-center rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition"
                  >
                    Open Device
                  </Link>
                  <Link
                    href={`/admin/cases`}
                    className="p-2 text-center rounded-xl bg-[#b8f55e] hover:bg-[#a6e848] text-[#071014] font-bold transition shadow-md shadow-[#b8f55e]/20"
                  >
                    Open Case
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#8fa9a6]">
                <MapPin className="size-8 mx-auto text-white/20 mb-2" />
                <p className="text-xs">Click a transaction marker to inspect platform telemetry.</p>
              </div>
            )}

            <div className="text-[10px] text-slate-500 text-center border-t border-white/10 pt-3">
              Admin Ops Center · Restricted Access Only
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
