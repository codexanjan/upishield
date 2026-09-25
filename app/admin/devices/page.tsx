'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Laptop,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle2
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

interface DeviceRecord {
  deviceId: string
  model: string
  usersCount: number
  trustedByCount: number
  firstSeen: string
  lastSeen: string
  locationsCount: number
  transactionsCount: number
  reportsCount: number
  riskLevel: 'critical' | 'high' | 'normal'
  cities: string[]
}

const mockDevices: DeviceRecord[] = [
  {
    deviceId: 'DEV-A91821',
    model: 'Samsung Galaxy Ultra',
    usersCount: 3,
    trustedByCount: 1,
    firstSeen: '12 Sep 2026',
    lastSeen: 'Today, 10:38 AM',
    locationsCount: 5,
    transactionsCount: 48,
    reportsCount: 2,
    riskLevel: 'critical',
    cities: ['Bengaluru', 'Mysuru', 'Delhi']
  },
  {
    deviceId: 'DEV-A782',
    model: 'Redmi Note Pro',
    usersCount: 1,
    trustedByCount: 0,
    firstSeen: '25 Sep 2026',
    lastSeen: 'Today, 10:38 AM',
    locationsCount: 2,
    transactionsCount: 3,
    reportsCount: 1,
    riskLevel: 'high',
    cities: ['Delhi', 'Gurugram']
  },
  {
    deviceId: 'DEV-A8219',
    model: 'Samsung Galaxy S24',
    usersCount: 1,
    trustedByCount: 1,
    firstSeen: '01 Aug 2026',
    lastSeen: 'Today, 9:10 PM',
    locationsCount: 3,
    transactionsCount: 43,
    reportsCount: 0,
    riskLevel: 'normal',
    cities: ['Bengaluru', 'Mysuru']
  },
  {
    deviceId: 'DEV-M9420',
    model: 'Apple MacBook Pro M2',
    usersCount: 1,
    trustedByCount: 1,
    firstSeen: '15 Aug 2026',
    lastSeen: 'Today, 11:05 AM',
    locationsCount: 1,
    transactionsCount: 18,
    reportsCount: 0,
    riskLevel: 'normal',
    cities: ['Bengaluru']
  }
]

export default function AdminDevicesPage() {
  const [search, setSearch] = useState('')

  const filtered = mockDevices.filter((d) =>
    d.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    d.model.toLowerCase().includes(search.toLowerCase()) ||
    d.cities.some(c => c.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="HARDWARE FINGERPRINT DIRECTORY · SPEC 34" variant="blue" />
            </div>
            <MotionWordReveal
              text="Device Intelligence & Hardware Links"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Audit physical devices used across platform accounts, identifying multi-user terminal sharing & spoofing anomalies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8fa9a6] font-mono">
              {mockDevices.length} Hardware Fingerprints Tracked
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4 flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Device ID (e.g. DEV-A91821), model, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 text-white text-xs placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Device Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filtered.map((device) => {
            const isCritical = device.riskLevel === 'critical'
            const isHigh = device.riskLevel === 'high'
            return (
              <div
                key={device.deviceId}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
                  isCritical
                    ? 'bg-[#0a1718] border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : isHigh
                    ? 'bg-[#0a1718] border-amber-500/30'
                    : 'bg-[#0a1718] border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-[#b8f55e]/20 text-[#b8f55e]'
                      }`}>
                        <Smartphone className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-mono">{device.deviceId}</h3>
                        <p className="text-xs text-[#8fa9a6]">{device.model}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isHigh
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {device.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  {/* Device Metrics (Prompt Spec 34) */}
                  <div className="grid grid-cols-3 gap-2 py-3 text-xs border-b border-white/5">
                    <div className="p-2 rounded-lg bg-[#071014] text-center">
                      <span className="text-[10px] text-[#8fa9a6]">Users Mapped</span>
                      <p className="font-bold text-white font-mono">{device.usersCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#071014] text-center">
                      <span className="text-[10px] text-[#8fa9a6]">Trusted By</span>
                      <p className="font-bold text-emerald-400 font-mono">{device.trustedByCount} user</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#071014] text-center">
                      <span className="text-[10px] text-[#8fa9a6]">Platform Reports</span>
                      <p className="font-bold text-rose-400 font-mono">{device.reportsCount}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8fa9a6]">Locations ({device.locationsCount}):</span>
                      <span className="font-medium text-white flex items-center gap-1">
                        <MapPin className="size-3 text-[#b8f55e]" /> {device.cities.join(' ➔ ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8fa9a6]">First Seen:</span>
                      <span className="text-slate-300">{device.firstSeen}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8fa9a6]">Last Seen:</span>
                      <span className="text-slate-300">{device.lastSeen}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8fa9a6]">Lifetime Transactions:</span>
                      <span className="font-mono text-white font-bold">{device.transactionsCount} txns</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">Hardware hash verified</span>
                  <Link
                    href={`/admin/devices/${device.deviceId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#b8f55e] transition"
                  >
                    View Device Profile & Timeline <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
