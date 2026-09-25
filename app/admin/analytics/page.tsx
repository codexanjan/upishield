'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Globe,
  MapPin,
  Clock,
  TrendingUp,
  ShieldAlert,
  Smartphone,
  PieChart as PieIcon,
  Layers,
  Calendar
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminLocationAnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState('30d')

  // Section 56: Payments by Country
  const countryBreakdown = [
    { country: 'India', percentage: 98.3, txns: 18107, volume: '₹4,12,80,000' },
    { country: 'Singapore', percentage: 0.7, txns: 129, volume: '₹3,20,000' },
    { country: 'UAE', percentage: 0.4, txns: 74, volume: '₹1,85,000' },
    { country: 'US', percentage: 0.3, txns: 55, volume: '₹1,40,000' },
    { country: 'Others', percentage: 0.3, txns: 55, volume: '₹1,15,000' }
  ]

  // Section 57: City & Region Analytics
  const cityAnalytics = [
    { city: 'Bengaluru', txns: 8420, reports: 128, amount: '₹18,20,000', newDevices: 84, cases: 14 },
    { city: 'Delhi', txns: 5120, reports: 94, amount: '₹12,40,000', newDevices: 52, cases: 11 },
    { city: 'Mumbai', txns: 4890, reports: 78, amount: '₹9,80,000', newDevices: 41, cases: 9 },
    { city: 'Hyderabad', txns: 2150, reports: 34, amount: '₹4,10,000', newDevices: 18, cases: 4 },
    { city: 'Chennai', txns: 1840, reports: 22, amount: '₹2,90,000', newDevices: 12, cases: 2 }
  ]

  // Section 58: Location Time Matrix
  const timeMatrix = [
    { city: 'Bengaluru', morning: 21, afternoon: 42, evening: 84, night: 11 },
    { city: 'Delhi', morning: 12, afternoon: 30, evening: 56, night: 28 },
    { city: 'Mumbai', morning: 18, afternoon: 41, evening: 67, night: 20 }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="TELEMETRIC MACRO INSIGHTS" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">SECTIONS 56, 57 & 58</span>
            </div>
            <MotionWordReveal
              text="Location Analytics & Time Matrix"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Deterministic macro trends, international dispersal vectors, and diurnal transaction densities.
            </p>
          </div>

          <div className="flex gap-2 bg-[#071014] p-1 rounded-xl border border-white/10 text-xs">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase ${
                  selectedRange === r ? 'bg-[#b8f55e] text-[#071014]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 56: ADMIN COUNTRY VIEW */}
        <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-[#b8f55e]" />
              <h3 className="text-sm font-semibold text-white">Section 56: Payments by Country</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">98.3% DOMESTIC · 1.7% CROSS-BORDER</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {countryBreakdown.map((c) => (
              <div key={c.country} className="p-4 rounded-xl bg-[#071014] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{c.country}</span>
                  <span className="font-mono text-xs font-bold text-[#b8f55e]">{c.percentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#b8f55e]"
                    style={{ width: `${Math.min(100, c.percentage * 1.5 + 4)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{c.txns.toLocaleString()} txns</span>
                  <span className="font-mono text-slate-300">{c.volume}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 57: LOCATION ANALYTICS TABLES & CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* City Breakdown Table (8 Cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[#b8f55e]" />
                <h3 className="text-sm font-semibold text-white">Section 57: City Intelligence Breakdown</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">NORMALIZED CITY CODES</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Transactions</th>
                    <th className="px-4 py-3 font-semibold">Reports Filed</th>
                    <th className="px-4 py-3 font-semibold">Reported Amount</th>
                    <th className="px-4 py-3 font-semibold">New Devices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {cityAnalytics.map((c) => (
                    <tr key={c.city} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 font-bold text-white flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-[#b8f55e]" />
                        {c.city}
                      </td>
                      <td className="px-4 py-3.5 font-mono">{c.txns.toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono text-rose-400 font-semibold">{c.reports}</td>
                      <td className="px-4 py-3.5 font-mono text-white">{c.amount}</td>
                      <td className="px-4 py-3.5 font-mono text-amber-400">{c.newDevices}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Risk Factors (4 Cols) */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Fraud Categories by Region</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <div className="flex justify-between font-semibold text-white">
                  <span>North (Delhi NCR)</span>
                  <span className="text-rose-400 font-mono">42% UPI Collect</span>
                </div>
                <p className="text-[11px] text-slate-400">High concentration of electricity refund scams.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <div className="flex justify-between font-semibold text-white">
                  <span>South (Bengaluru)</span>
                  <span className="text-amber-400 font-mono">31% QR Spoofing</span>
                </div>
                <p className="text-[11px] text-slate-400">Duplicate merchant QR stickers in cafes.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <div className="flex justify-between font-semibold text-white">
                  <span>West (Mumbai)</span>
                  <span className="text-[#b8f55e] font-mono">27% International POS</span>
                </div>
                <p className="text-[11px] text-slate-400">Cross-border card payment discrepancies.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 58: LOCATION TIME MATRIX */}
        <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#b8f55e]" />
              <h3 className="text-sm font-semibold text-white">Section 58: Diurnal Location Time Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">INCIDENT OCCURRENCE FREQUENCY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5 font-mono">
                <tr>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold text-center">Morning (06:00 - 12:00)</th>
                  <th className="px-5 py-3 font-semibold text-center">Afternoon (12:00 - 18:00)</th>
                  <th className="px-5 py-3 font-semibold text-center">Evening (18:00 - 23:00)</th>
                  <th className="px-5 py-3 font-semibold text-center text-rose-400">Night (23:00 - 06:00)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {timeMatrix.map((row) => (
                  <tr key={row.city} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-bold text-white font-sans">{row.city}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded bg-[#071014] border border-white/5 text-slate-200">
                        {row.morning}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded bg-[#071014] border border-white/5 text-slate-200">
                        {row.afternoon}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded bg-[#071014] border border-white/5 text-[#b8f55e] font-bold">
                        {row.evening}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                        {row.night}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
