'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Flame,
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Filter,
  Eye,
  Info,
  Calendar,
  Layers
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'
import RealGoogleMap from '@/components/maps/real-google-map'

interface Cluster {
  id: string
  city: string
  count: number
  amount: number
  risk: 'critical' | 'high' | 'medium'
  x: number
  y: number
  lat: number
  lng: number
}

const mockClusters: Cluster[] = [
  { id: '1', city: 'Bengaluru', count: 128, amount: 284000, risk: 'high', x: 48, y: 64, lat: 12.9716, lng: 77.5946 },
  { id: '2', city: 'Delhi NCR', count: 94, amount: 391500, risk: 'critical', x: 52, y: 26, lat: 28.6139, lng: 77.2090 },
  { id: '3', city: 'Mumbai', count: 78, amount: 198000, risk: 'high', x: 36, y: 48, lat: 19.0760, lng: 72.8777 },
  { id: '4', city: 'Hyderabad', count: 42, amount: 94000, risk: 'medium', x: 50, y: 56, lat: 17.3850, lng: 78.4867 },
  { id: '5', city: 'Kolkata', count: 31, amount: 72000, risk: 'medium', x: 68, y: 38, lat: 22.5726, lng: 88.3639 },
]

export default function AdminFraudMapPage() {
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(mockClusters[1])
  const [zoomLevel, setZoomLevel] = useState(1)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="FRAUD DENSITY & THREAT CLUSTERS · SPEC 31" variant="blue" />
            </div>
            <MotionWordReveal
              text="Platform Fraud Heatmap"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Cluster aggregation engine plotting report concentrations without overloading browser rendering.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
              Demo / Synthetic Data
            </span>
            <Link
              href="/admin/payment-map"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-semibold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              <MapPin className="size-3.5" /> Live Payment Map
            </Link>
          </div>
        </div>

        {/* Heatmap Overview Banner */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase">Top Incident City</span>
              <Flame className="size-4 text-rose-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white font-mono">Bengaluru (128 Reports)</p>
            <p className="mt-1 text-xs text-rose-300">₹2,84,000 Disputed Volume</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Highest Severity</span>
              <AlertTriangle className="size-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white font-mono">Delhi (94 Reports)</p>
            <p className="mt-1 text-xs text-amber-300">High Velocity + Unrecognized Devices</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#b8f55e] uppercase">Total Clustered Reports</span>
              <Layers className="size-4 text-[#b8f55e]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white font-mono">373 Reports</p>
            <p className="mt-1 text-xs text-slate-400">Aggregated into 5 Metro Clusters</p>
          </div>
        </div>

        {/* Heatmap Canvas + Live Alert Stream (Prompt Specs 32 & 33) */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Cluster Canvas */}
          <div className="relative rounded-2xl border border-white/10 bg-[#071014] p-6 min-h-[480px] flex flex-col justify-between overflow-hidden">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#ff5b6b 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#0a1718]/90 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">Aggregated Threat Clusters</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => prev === 1 ? 1.5 : 1)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10"
                >
                  Zoom: {zoomLevel}x
                </button>
              </div>
            </div>

            {/* Real Google Maps Threat Clusters */}
            <div className="relative z-10 w-full rounded-2xl overflow-hidden border border-white/10 my-2">
              <RealGoogleMap
                height="340px"
                center={[21.0, 78.0]}
                zoom={4}
                markers={mockClusters.map((c) => ({
                  id: c.id,
                  title: `${c.city} Threat Cluster`,
                  subtitle: `${c.count} platform fraud reports • ₹${c.amount.toLocaleString('en-IN')} volume`,
                  lat: c.lat,
                  lng: c.lng,
                  risk: c.risk,
                  status: `${c.count} Reports`,
                  amount: c.amount,
                  category: 'Fraud Cluster'
                }))}
                onMarkerClick={(marker) => {
                  const found = mockClusters.find(c => c.id === marker.id)
                  if (found) setSelectedCluster(found)
                }}
              />
            </div>

            {/* Bottom Status */}
            <div className="relative z-10 flex items-center justify-between text-xs text-[#8fa9a6] bg-[#0a1718]/90 border border-white/10 px-4 py-2 rounded-xl">
              <span>Click cluster to zoom & inspect local incidents</span>
              <span className="text-amber-400 font-mono">Demo / Synthetic Data</span>
            </div>
          </div>

          {/* Right Column: Live Location Alert Stream (Prompt Spec 33) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-rose-400 animate-pulse" />
                  <h3 className="text-base font-semibold text-white">LIVE LOCATION ALERTS</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">ACTIVE FEED</span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {/* 10:43 PM */}
                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#8fa9a6]">10:43 PM</span>
                    <span className="text-rose-400 font-bold">₹32,000</span>
                  </div>
                  <p className="font-bold text-white">New device + new city</p>
                  <p className="text-[#8fa9a6] text-[11px]">User initiating payment from Delhi terminal with unregistered Android ID.</p>
                </div>

                {/* 10:41 PM */}
                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#8fa9a6]">10:41 PM</span>
                    <span className="text-amber-400 font-bold">CRITICAL</span>
                  </div>
                  <p className="font-bold text-white">Impossible travel</p>
                  <p className="text-[#8fa9a6] text-[11px]">User 291: Bengaluru (09:02) ➔ Delhi (09:24), 22 min difference / ~1,700 km.</p>
                </div>

                {/* 10:38 PM */}
                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#8fa9a6]">10:38 PM</span>
                    <span className="text-rose-400 font-bold">Delhi</span>
                  </div>
                  <p className="font-bold text-white">Reported UPI scanned</p>
                  <p className="text-[#8fa9a6] text-[11px]">Receiver abc@upi previously flagged in 6 verified consumer cases.</p>
                </div>

                {/* 10:36 PM */}
                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#8fa9a6]">10:36 PM</span>
                    <span className="text-sky-400 font-bold">Device DEV-A91</span>
                  </div>
                  <p className="font-bold text-white">Multiple users at same device</p>
                  <p className="text-[#8fa9a6] text-[11px]">Hardware correlation engine discovered 3 accounts using same IMEI token.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[#8fa9a6]">Active Stream Protocol: WS/Longpoll</span>
              <span className="text-[#b8f55e] font-semibold">Deterministic Triggers</span>
            </div>
          </div>
        </div>

        {/* LOCATION TIME MATRIX (Prompt Spec 58) */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-semibold text-white">Location Time Matrix</h3>
              <p className="text-xs text-[#8fa9a6]">Deterministic temporal incident correlation across metro regions</p>
            </div>
            <span className="text-xs font-mono text-[#b8f55e]">Spec 58 Pattern Analysis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-[#071014]">
                  <th className="py-3 px-4 font-sans font-semibold">City Region</th>
                  <th className="py-3 px-4 text-center">Morning (6AM - 12PM)</th>
                  <th className="py-3 px-4 text-center">Afternoon (12PM - 6PM)</th>
                  <th className="py-3 px-4 text-center">Evening (6PM - 10PM)</th>
                  <th className="py-3 px-4 text-center">Night (10PM - 6AM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/[.02] transition">
                  <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                    <MapPin className="size-3.5 text-[#b8f55e]" /> Bengaluru
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-300">21</td>
                  <td className="py-3.5 px-4 text-center text-slate-300">42</td>
                  <td className="py-3.5 px-4 text-center text-amber-300 font-bold">84</td>
                  <td className="py-3.5 px-4 text-center text-slate-300">11</td>
                </tr>
                <tr className="hover:bg-white/[.02] transition">
                  <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                    <MapPin className="size-3.5 text-rose-400" /> Delhi
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-300">12</td>
                  <td className="py-3.5 px-4 text-center text-slate-300">30</td>
                  <td className="py-3.5 px-4 text-center text-slate-300">56</td>
                  <td className="py-3.5 px-4 text-center text-rose-400 font-bold">28 (Elevated Night)</td>
                </tr>
                <tr className="hover:bg-white/[.02] transition">
                  <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                    <MapPin className="size-3.5 text-amber-400" /> Mumbai
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-300">18</td>
                  <td className="py-3.5 px-4 text-center text-slate-300">41</td>
                  <td className="py-3.5 px-4 text-center text-amber-300 font-bold">67</td>
                  <td className="py-3.5 px-4 text-center text-slate-300">20</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
