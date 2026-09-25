'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Radio,
  AlertTriangle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  User,
  CheckCircle2,
  XCircle,
  Briefcase,
  Layers,
  ArrowLeftRight
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

interface TravelConflict {
  id: string
  userId: string
  userName: string
  loc1: string
  time1: string
  loc2: string
  time2: string
  timeDiff: string
  distance: string
  status: 'Review' | 'Case Created' | 'Dismissed'
  amount: number
}

export default function AdminAlertsPage() {
  const [conflicts, setConflicts] = useState<TravelConflict[]>([
    {
      id: 'TC-101',
      userId: 'USER-192',
      userName: 'Suresh Patel',
      loc1: 'Bengaluru',
      time1: '09:02 AM',
      loc2: 'Delhi',
      time2: '09:24 AM',
      timeDiff: '22 minutes',
      distance: '~1,700 km',
      status: 'Review',
      amount: 18500
    },
    {
      id: 'TC-102',
      userId: 'USER-382',
      userName: 'Karan Mehra',
      loc1: 'Bengaluru',
      time1: '10:20 AM',
      loc2: 'Delhi',
      time2: '10:38 AM',
      timeDiff: '18 minutes',
      distance: '~1,700 km',
      status: 'Review',
      amount: 28500
    },
    {
      id: 'TC-103',
      userId: 'USER-405',
      userName: 'Deepa Varma',
      loc1: 'Mumbai',
      time1: '02:15 PM',
      loc2: 'Kolkata',
      time2: '02:40 PM',
      timeDiff: '25 minutes',
      distance: '~1,650 km',
      status: 'Review',
      amount: 45000
    }
  ])

  const handleAction = (id: string, newStatus: 'Case Created' | 'Dismissed') => {
    setConflicts(conflicts.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="IMPOSSIBLE TRAVEL ENGINE · SPEC 39" variant="blue" />
            </div>
            <MotionWordReveal
              text="Live Anomaly & Travel Conflict Alerts"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Deterministic velocity calculation based on geographic coordinates, time differences and physical flight limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400">
              3 Active Conflicts Flagged
            </span>
          </div>
        </div>

        {/* IMPOSSIBLE TRAVEL PANEL (Prompt Spec 39) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-semibold text-white">Velocity & Impossible Travel Queue</h3>
            <span className="text-xs text-[#8fa9a6]">Zero AI Rule: speed &gt; 800 km/h</span>
          </div>

          <div className="grid gap-4">
            {conflicts.map((conflict) => {
              const isResolved = conflict.status !== 'Review'
              return (
                <div
                  key={conflict.id}
                  className={`rounded-2xl border p-5 transition ${
                    isResolved
                      ? 'bg-[#0a1718]/60 border-white/5 opacity-70'
                      : 'bg-[#0a1718] border-rose-500/30 shadow-lg shadow-rose-950/20'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: User & Summary */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-base">{conflict.userId}</span>
                        <span className="text-xs text-[#8fa9a6]">({conflict.userName})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          conflict.status === 'Case Created'
                            ? 'bg-rose-500/20 text-rose-300'
                            : conflict.status === 'Dismissed'
                            ? 'bg-white/10 text-slate-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {conflict.status}
                        </span>
                      </div>

                      {/* Travel Vector */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="p-2 rounded-lg bg-[#071014] border border-white/5 text-white flex items-center gap-1.5">
                          <MapPin className="size-3 text-[#b8f55e]" /> {conflict.loc1} ({conflict.time1})
                        </span>
                        <span className="text-rose-400 font-bold">➔</span>
                        <span className="p-2 rounded-lg bg-[#071014] border border-rose-500/30 text-rose-300 flex items-center gap-1.5">
                          <MapPin className="size-3 text-rose-400" /> {conflict.loc2} ({conflict.time2})
                        </span>
                      </div>
                    </div>

                    {/* Middle: Math details */}
                    <div className="grid grid-cols-3 gap-3 text-xs bg-[#071014] p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-[#8fa9a6]">Time Difference</span>
                        <p className="font-bold text-amber-400 font-mono">{conflict.timeDiff}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8fa9a6]">Distance</span>
                        <p className="font-bold text-white font-mono">{conflict.distance}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8fa9a6]">Amount</span>
                        <p className="font-bold text-rose-400 font-mono">₹{conflict.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Right: Actions (Prompt Spec 39) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/admin/users"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition"
                      >
                        Open User
                      </Link>
                      <Link
                        href="/admin/transactions"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition"
                      >
                        Open Txns
                      </Link>
                      <button
                        onClick={() => handleAction(conflict.id, 'Case Created')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition shadow-md shadow-rose-600/20"
                      >
                        Create Case
                      </button>
                      <button
                        onClick={() => handleAction(conflict.id, 'Dismissed')}
                        className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
