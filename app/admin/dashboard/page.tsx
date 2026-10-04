'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  ArrowLeftRight,
  Send,
  CreditCard,
  FileWarning,
  Briefcase,
  CheckCircle2,
  ShieldAlert,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Store,
  Layers,
  Sliders,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  MapPin,
  Flame,
  Radio,
  Smartphone,
  Eye,
  KanbanSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import RealGoogleMap from '@/components/maps/real-google-map'

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { transactions, alerts } = useUPIGuardStore()

  // Section 53 Command Center KPIs
  const totalTransactions = 12482 + transactions.length
  const settledCount = transactions.filter((t) => t.status === 'SETTLED').length
  const blockedCount = transactions.filter((t) => t.status === 'BLOCKED').length
  const totalSuccessful = 11920 + settledCount
  const totalBlocked = 562 + blockedCount
  const fraudRate = ((totalBlocked / totalTransactions) * 100).toFixed(1)
  const blockedSum = transactions
    .filter((t) => t.status === 'BLOCKED')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const amountProtected = (1870000 + blockedSum) / 100000

  // Section 26 Stat Cards
  const stats = {
    active_users: 1248,
    transactions_today: totalTransactions,
    new_devices: 184 + (transactions.some((t) => t.deviceId?.includes('Unknown')) ? 1 : 0),
    new_locations: 297,
    location_alerts: 63 + (transactions.some((t) => t.location?.city === 'Mumbai') ? 1 : 0),
    fraud_reports: 38,
    critical_cases: 7 + blockedCount,
    open_investigations: 42
  }

  // Section 33 Live Alert Stream
  const dynamicLiveAlerts = [
    ...transactions.slice(0, 4).map((t) => ({
      time: new Date(t.timestamps.settled || t.timestamps.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `${t.riskLevel === 'CRITICAL' ? 'Critical Fraud Blocked' : 'Simulated Payment'}: ${t.senderUpiId}`,
      amount: `₹${t.amount.toLocaleString('en-IN')}`,
      detail: `${t.location.city} · ${t.receiverUpiId}`,
      severity: t.riskLevel === 'CRITICAL' ? 'critical' : t.riskLevel === 'HIGH' ? 'high' : 'normal'
    })),
    { time: '10:43 PM', title: 'New device + new city', amount: '₹32,000', detail: 'Delhi · Apple Pay Gateway', severity: 'high' },
    { time: '10:41 PM', title: 'Impossible travel detected', amount: 'USER-192', detail: 'Bengaluru ➔ Delhi (22 min)', severity: 'critical' },
  ]
  const liveAlerts = dynamicLiveAlerts

  // City reports distribution
  const cityTrends = [
    { city: 'Bengaluru', reports: 128, txns: 12480, status: 'Normal Velocity' },
    { city: 'Delhi', reports: 94, txns: 8940, status: 'Elevated Flags' },
    { city: 'Mumbai', reports: 78, txns: 7810, status: 'Normal Velocity' },
    { city: 'Hyderabad', reports: 42, txns: 4120, status: 'Low Risk' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge className="rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3 py-1 text-xs font-semibold text-[#b8f55e]">
                ADMIN COMMAND CENTER · REAL-TIME TRIAGE
              </MotionBadge>
            </div>
            <MotionWordReveal
              text="Security Command Center"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time platform monitoring, fraud locations, device tracking & deterministic investigation board.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Platform Engine
            </span>
            <Link
              href="/admin/payment-map"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-semibold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              <MapPin className="size-3.5" /> Live Map
            </Link>
          </div>
        </div>

        {/* UPIGuard AI Master Command Center Banner (Prompt Section 53) */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-gradient-to-r from-[#091726] to-[#0B1B2D] p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#5BD6FF] uppercase tracking-widest font-mono">
                TELEMETRY COMMAND DESK · LIVE SOCKET
              </span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                UPIGuard AI Real-Time Fraud Operations
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE TRANSACTIONS ● CONNECTED
              </span>
              <Link
                href="/admin/fraud/simulator"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] text-[#06101D] text-xs font-bold shadow-md hover:brightness-110 transition flex items-center gap-1.5"
              >
                <Flame className="size-3.5" /> Fraud Simulator
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[#06101D] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">TOTAL TRANSACTIONS</span>
              <div className="text-2xl font-black text-white font-mono">{totalTransactions.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-400">All channels</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#06101D] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">SUCCESSFUL</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">{totalSuccessful.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Settled cleanly</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#06101D] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">BLOCKED</span>
              <div className="text-2xl font-black text-rose-400 font-mono">{totalBlocked}</div>
              <span className="text-[10px] text-rose-400/80">Critical risk</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#06101D] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">FRAUD RATE</span>
              <div className="text-2xl font-black text-[#5BD6FF] font-mono">{fraudRate}%</div>
              <span className="text-[10px] text-slate-500">&lt; 5% target</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#06101D] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">AMOUNT PROTECTED</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">₹{amountProtected.toFixed(1)}L</div>
              <span className="text-[10px] text-emerald-400/80">Saved before debit</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#06101D] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">ACTIVE ALERTS</span>
              <div className="text-2xl font-black text-amber-400 font-mono">{24 + alerts.filter(a => a.status === 'OPEN').length}</div>
              <span className="text-[10px] text-amber-400/80">Triage queue</span>
            </div>
          </div>
        </div>

        {/* 8 COMMAND CENTER METRIC CARDS (Prompt Spec 26) */}
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Active Users</span>
            <p className="text-xl font-bold text-white font-mono">{stats.active_users.toLocaleString()}</p>
            <span className="text-[9px] text-[#b8f55e]">Online endpoints</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Txns Today</span>
            <p className="text-xl font-bold text-white font-mono">{stats.transactions_today.toLocaleString()}</p>
            <span className="text-[9px] text-emerald-400">100% evaluated</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">New Devices</span>
            <p className="text-xl font-bold text-amber-400 font-mono">{stats.new_devices}</p>
            <span className="text-[9px] text-amber-400/80">Pending profile</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">New Locations</span>
            <p className="text-xl font-bold text-sky-400 font-mono">{stats.new_locations}</p>
            <span className="text-[9px] text-sky-400/80">Geo-clusters</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Location Alerts</span>
            <p className="text-xl font-bold text-rose-400 font-mono">{stats.location_alerts}</p>
            <span className="text-[9px] text-rose-400/80">Velocity conflict</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Fraud Reports</span>
            <p className="text-xl font-bold text-white font-mono">{stats.fraud_reports}</p>
            <span className="text-[9px] text-[#8fa9a6]">Submitted</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Critical Cases</span>
            <p className="text-xl font-bold text-rose-500 font-mono">{stats.critical_cases}</p>
            <span className="text-[9px] text-rose-400 font-bold">Needs Action</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Open Invs</span>
            <p className="text-xl font-bold text-[#b8f55e] font-mono">{stats.open_investigations}</p>
            <span className="text-[9px] text-[#b8f55e]/80">On Kanban</span>
          </div>
        </div>

        {/* ROW 1: LIVE FRAUD MAP + ALERT STREAM (Prompt Spec 63) */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Live Fraud Map Preview */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#b8f55e]/15 text-[#b8f55e]">
                    <Flame className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Live Platform Fraud Map</h3>
                    <p className="text-xs text-[#8fa9a6]">Geographic density of reported incidents & travel conflicts</p>
                  </div>
                </div>

                <Link
                  href="/admin/fraud-map"
                  className="text-xs font-semibold text-[#b8f55e] hover:underline flex items-center gap-1"
                >
                  Full Map <ArrowRight className="size-3" />
                </Link>
              </div>

              {/* Real Google Maps Threat Clusters */}
              <div className="relative mt-5 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                <RealGoogleMap
                  height="260px"
                  zoom={4}
                  center={[20.5937, 78.9629]}
                  markers={[
                    {
                      id: 'c-blr',
                      title: 'Bengaluru Threat Cluster',
                      subtitle: '128 fraud reports • ₹8.4L volume',
                      lat: 12.9716,
                      lng: 77.5946,
                      risk: 'critical',
                      status: '128 Reports',
                      amount: 840000,
                      city: 'Bengaluru'
                    },
                    {
                      id: 'c-del',
                      title: 'Delhi High Anomaly Cluster',
                      subtitle: '94 fraud reports • ₹14.2L volume • Travel Conflicts',
                      lat: 28.6139,
                      lng: 77.2090,
                      risk: 'critical',
                      status: '94 Reports',
                      amount: 1420000,
                      city: 'Delhi'
                    },
                    {
                      id: 'c-mum',
                      title: 'Mumbai Financial Cluster',
                      subtitle: '78 fraud reports • ₹6.1L volume',
                      lat: 19.0760,
                      lng: 72.8777,
                      risk: 'high',
                      status: '78 Reports',
                      amount: 610000,
                      city: 'Mumbai'
                    },
                    {
                      id: 'c-kol',
                      title: 'Kolkata Node',
                      subtitle: '42 fraud reports • ₹2.9L volume',
                      lat: 22.5726,
                      lng: 88.3639,
                      risk: 'medium',
                      status: '42 Reports',
                      amount: 290000,
                      city: 'Kolkata'
                    }
                  ]}
                  showLayers={true}
                  showSearch={false}
                  showControls={true}
                  interactiveClick={true}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8fa9a6]">
              <span>Active Layer: Critical Cases & Reported VPAs</span>
              <Link href="/admin/payment-map" className="text-[#b8f55e] hover:underline">
                Layer Control Panel →
              </Link>
            </div>
          </div>

          {/* Live Location Alert Stream (Prompt Spec 33) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-rose-400 animate-pulse" />
                  <h3 className="text-base font-semibold text-white">Live Location Alert Stream</h3>
                </div>
                <span className="text-[10px] font-mono text-[#8fa9a6]">STREAMING</span>
              </div>

              <div className="mt-4 space-y-3">
                {liveAlerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">{alert.time}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {alert.amount}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">{alert.title}</p>
                    <p className="text-[11px] text-[#8fa9a6]">{alert.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/admin/alerts"
              className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#b8f55e] font-semibold hover:underline"
            >
              <span>Manage Velocity & Impossible Travel Rules</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ROW 2: CASE STATUS & REPORTED ENTITY (Prompt Spec 63) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Investigation Board Snapshot */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KanbanSquare className="size-4 text-[#b8f55e]" />
                <h3 className="text-base font-semibold text-white">Investigation Board Pipeline</h3>
              </div>
              <Link href="/admin/cases/board" className="text-xs text-[#b8f55e] hover:underline">
                Full Board →
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6] text-[10px]">NEW</span>
                <p className="text-lg font-bold text-white font-mono">14</p>
                <span className="text-[9px] text-slate-500">Unassigned</span>
              </div>
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6] text-[10px]">UNDER REVIEW</span>
                <p className="text-lg font-bold text-amber-400 font-mono">19</p>
                <span className="text-[9px] text-amber-400/80">Active</span>
              </div>
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6] text-[10px]">EVIDENCE REQ</span>
                <p className="text-lg font-bold text-sky-400 font-mono">6</p>
                <span className="text-[9px] text-sky-400/80">Waiting user</span>
              </div>
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6] text-[10px]">ESCALATED</span>
                <p className="text-lg font-bold text-rose-400 font-mono">7</p>
                <span className="text-[9px] text-rose-400/80">Cross-account</span>
              </div>
            </div>
          </div>

          {/* Reported Entity Directory Preview */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-[#b8f55e]" />
                <h3 className="text-base font-semibold text-white">Reported Entity Intelligence</h3>
              </div>
              <Link href="/admin/reported-upi" className="text-xs text-[#b8f55e] hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {[
                { vpa: 'scammer.refund@okaxis', reports: 12, cases: 5, cities: 3 },
                { vpa: 'fast.lottery@ybl', reports: 7, cases: 3, cities: 2 },
                { vpa: 'quickloan.agent@icici', reports: 4, cases: 2, cities: 1 },
              ].map((item) => (
                <div key={item.vpa} className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5 text-xs">
                  <div>
                    <p className="font-mono font-medium text-white">{item.vpa}</p>
                    <span className="text-[10px] text-[#8fa9a6]">{item.cities} cities flagged · {item.cases} linked cases</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold font-mono">
                    {item.reports} reports
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: LOCATION TRENDS & DEVICE ACTIVITY (Prompt Spec 63) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Location Trends */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-3">
            <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3">
              Location Trends by City
            </h3>
            <div className="space-y-2 text-xs">
              {cityTrends.map((city) => (
                <div key={city.city} className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-[#b8f55e]" />
                    <span className="font-bold text-white">{city.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8fa9a6] font-mono">{city.txns.toLocaleString()} txns</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 font-mono font-semibold">
                      {city.reports} reports
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Activity Correlation */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-3">
            <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3">
              High-Risk Device Activity
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { id: 'DEV-A91821', users: 3, locations: 5, reports: 2, lastCity: 'Delhi' },
                { id: 'DEV-A782', users: 1, locations: 2, reports: 1, lastCity: 'Delhi' },
                { id: 'DEV-X3091', users: 4, locations: 7, reports: 6, lastCity: 'Mumbai' },
              ].map((dev) => (
                <div key={dev.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#071014] border border-white/5">
                  <div>
                    <p className="font-mono font-bold text-white">{dev.id}</p>
                    <span className="text-[10px] text-[#8fa9a6]">Shared by {dev.users} users · Seen in {dev.locations} cities</span>
                  </div>
                  <Link
                    href={`/admin/devices/${dev.id}`}
                    className="text-xs text-[#b8f55e] hover:underline"
                  >
                    Inspect Profile →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
