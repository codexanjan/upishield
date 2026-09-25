'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Smartphone,
  ArrowLeft,
  MapPin,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Navigation
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

export default function AdminDeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = (params?.id as string) || 'DEV-A91821'

  const [selectedTxn, setSelectedTxn] = useState<any | null>(null)

  const timelineEvents = [
    { date: '25 Sep 2026', city: 'Delhi', amount: 28500, time: '10:38 AM', merchant: 'abc@upi', ref: 'TXN-42821', flagged: true },
    { date: '24 Sep 2026', city: 'Bengaluru', amount: 1200, time: '7:15 PM', merchant: 'Blue Tokai', ref: 'TXN-42810', flagged: false },
    { date: '24 Sep 2026', city: 'Bengaluru', amount: 850, time: '1:45 PM', merchant: 'Star Cafe', ref: 'TXN-42795', flagged: false },
    { date: '21 Sep 2026', city: 'Mysuru', amount: 3200, time: '3:20 PM', merchant: 'Mysuru Silks', ref: 'TXN-42512', flagged: false },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <MotionBadge text="HARDWARE PROFILE AUDIT · SPEC 34" variant="blue" />
            </div>
            <h1 className="text-2xl font-bold text-white font-mono mt-0.5">{deviceId}</h1>
            <p className="text-xs text-[#8fa9a6]">Hardware fingerprint details, cross-user correlation & route history.</p>
          </div>
        </div>

        {/* DEVICE STATS SUMMARY (Prompt Spec 34) */}
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Associated Users</span>
            <p className="text-xl font-bold text-white font-mono">3</p>
            <span className="text-[9px] text-[#b8f55e]">USR-382, USR-104, USR-291</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Trusted By</span>
            <p className="text-xl font-bold text-emerald-400 font-mono">1 user</p>
            <span className="text-[9px] text-emerald-400/80">Primary phone</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">First Seen</span>
            <p className="text-base font-bold text-white">12 Sep</p>
            <span className="text-[9px] text-slate-400">14 days ago</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Last Seen</span>
            <p className="text-base font-bold text-white">Today</p>
            <span className="text-[9px] text-slate-400">10:38 AM</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Locations</span>
            <p className="text-xl font-bold text-sky-400 font-mono">5</p>
            <span className="text-[9px] text-sky-400/80">Distinct Cities</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1718] p-3.5 space-y-1">
            <span className="text-[10px] text-[#8fa9a6] uppercase font-semibold">Transactions</span>
            <p className="text-xl font-bold text-white font-mono">48</p>
            <span className="text-[9px] text-slate-400">Total Volume</span>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-1">
            <span className="text-[10px] text-rose-400 uppercase font-semibold">Fraud Reports</span>
            <p className="text-xl font-bold text-rose-400 font-mono">2</p>
            <span className="text-[9px] text-rose-300 font-bold">Investigated</span>
          </div>
        </div>

        {/* DEVICE TIMELINE & DEVICE ROUTE MAP (Prompt Specs 35 & 36) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Device Location Timeline (Prompt Spec 35) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#b8f55e]" />
                <h3 className="text-base font-semibold text-white">Device Location Timeline</h3>
              </div>
              <span className="text-xs text-[#8fa9a6]">Click row for details</span>
            </div>

            <div className="space-y-3">
              {timelineEvents.map((evt, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedTxn(evt)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    evt.flagged
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                      : 'bg-[#071014] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      evt.flagged ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-slate-400'
                    }`}>
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{evt.city}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{evt.time}</span>
                      </div>
                      <p className="text-[11px] text-[#8fa9a6]">{evt.merchant} · {evt.date}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white font-mono">₹{evt.amount.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold ${
                      evt.flagged ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {evt.flagged ? 'REPORTED' : 'NORMAL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedTxn && (
              <div className="p-3 rounded-xl bg-white/[.03] border border-white/10 text-xs text-slate-300 space-y-1">
                <span className="text-[#b8f55e] font-bold uppercase tracking-wider text-[10px]">SELECTED EVENT</span>
                <p>Transaction: <strong className="font-mono text-white">{selectedTxn.ref}</strong></p>
                <p>Receiver: <strong className="font-mono text-white">{selectedTxn.merchant}</strong> ({selectedTxn.city})</p>
              </div>
            )}
          </div>

          {/* Device Map Route (Prompt Spec 36) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="size-4 text-[#b8f55e]" />
                  <h3 className="text-base font-semibold text-white">Device Route Vector</h3>
                </div>
                <span className="text-xs font-mono text-[#b8f55e]">3 Stop Trajectory</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">1. Bengaluru</span>
                    <span className="text-xs text-emerald-400 font-mono">24 Sep · Home</span>
                  </div>
                  <p className="text-[11px] text-[#8fa9a6] mt-1">2 payments (₹2,050 total)</p>
                </div>

                <div className="flex justify-center text-[#b8f55e] text-sm">↓</div>

                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">2. Mysuru</span>
                    <span className="text-xs text-sky-400 font-mono">21 Sep · Trip</span>
                  </div>
                  <p className="text-[11px] text-[#8fa9a6] mt-1">1 payment (₹3,200 total)</p>
                </div>

                <div className="flex justify-center text-rose-400 text-sm">↓</div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">3. Delhi (Velocity Conflict)</span>
                    <span className="text-xs text-rose-400 font-mono font-bold">25 Sep · Incident</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 mt-1">1 payment (₹28,500 disputed · CASE-821)</p>
                </div>
              </div>
            </div>

            {/* LOCATION + DEVICE CORRELATION (Prompt Spec 50) */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#b8f55e]">
                Cross-Account Correlation Summary
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="p-2 rounded-lg bg-[#071014]">
                  <span className="text-[10px] text-[#8fa9a6]">Users</span>
                  <p className="font-bold text-white font-mono">4</p>
                </div>
                <div className="p-2 rounded-lg bg-[#071014]">
                  <span className="text-[10px] text-[#8fa9a6]">Cases</span>
                  <p className="font-bold text-rose-400 font-mono">3</p>
                </div>
                <div className="p-2 rounded-lg bg-[#071014]">
                  <span className="text-[10px] text-[#8fa9a6]">Reported Txns</span>
                  <p className="font-bold text-rose-400 font-mono">6</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
