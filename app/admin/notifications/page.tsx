'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  MessageSquare,
  ShieldAlert,
  CheckCheck,
  ExternalLink,
  MapPin
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/notifications')
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data)
      } else {
        throw new Error('Fallback')
      }
    } catch {
      // offline fallback
      setNotifications([
        {
          id: 1,
          title: 'Impossible Travel Velocity Flagged',
          message: 'User Anjan Sharma transacted in Bengaluru at 09:02 and Delhi at 09:24 (~1,700 km in 22 mins).',
          type: 'Location Conflict',
          link: '/admin/alerts',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 1).toISOString()
        },
        {
          id: 2,
          title: 'New High Priority Fraud Report',
          message: 'User Anjan Sharma filed an incident report REP-2026-000012 for ₹18,500.',
          type: 'New Fraud Report',
          link: '/admin/cases?id=1',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 3,
          title: 'Suspect VPA Threshold Warning',
          message: 'VPA scammer.refund@okaxis has reached 12 reports, surpassing threshold (3).',
          type: 'Reported UPI reaches threshold',
          link: '/admin/reported-upi',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 6).toISOString()
        },
        {
          id: 4,
          title: 'Evidence Uploaded by Complainant',
          message: 'Debit SMS screenshot uploaded on case CASE-2026-00421. SHA-256 integrity verified.',
          type: 'New Evidence',
          link: '/admin/cases?id=1',
          is_read: true,
          created_at: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = () => {
    setNotifications((prev) => (prev || []).map((n) => ({ ...n, is_read: true })))
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="OPERATIONS DISPATCH QUEUE" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">INCIDENT STREAM</span>
            </div>
            <MotionWordReveal
              text="Operations Center Notifications"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Administrative alerts for impossible travel conflicts, evidence additions, and platform threshold breaches.
            </p>
          </div>
          <button
            onClick={markAllRead}
            className="px-4 py-2 rounded-xl bg-[#0a1718] border border-white/10 hover:bg-white/10 text-white text-xs font-semibold transition flex items-center gap-1.5 w-fit"
          >
            <CheckCheck className="size-4 text-emerald-400" />
            Mark All Read
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading operational alerts...</div>
          ) : (notifications || []).length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0a1718] border border-white/10 text-center space-y-2">
              <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
              <p className="text-white font-semibold text-sm">No Pending Notifications</p>
              <p className="text-slate-400 text-xs">Operations dispatch queue is clear.</p>
            </div>
          ) : (
            (notifications || []).map((n) => {
              const isUnread = !n.is_read
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-[#0a1718] border-[#b8f55e]/40 shadow-lg shadow-[#b8f55e]/5'
                      : 'bg-[#0a1718] border-white/5 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#071014] border border-white/5 mt-0.5">
                      {n.type?.includes('Location') ? (
                        <MapPin className="size-4 text-rose-400" />
                      ) : n.type?.includes('Report') ? (
                        <FileWarning className="size-4 text-amber-400" />
                      ) : n.type?.includes('Evidence') ? (
                        <CheckCircle2 className="size-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="size-4 text-[#b8f55e]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{n.title}</span>
                        {isUnread && (
                          <span className="size-2 rounded-full bg-[#b8f55e]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                        {new Date(n.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {n.link && (
                    <Link
                      href={n.link}
                      className="px-3 py-1.5 rounded-lg bg-[#071014] hover:bg-white/5 border border-white/10 text-xs font-semibold text-[#b8f55e] transition flex items-center gap-1 shrink-0"
                    >
                      Inspect <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
