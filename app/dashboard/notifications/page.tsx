'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  Trash2,
  CheckCheck,
  ExternalLink
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { fadeUp } from '@/components/motion/presets'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const { decrementNotifications } = useAuthStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/notifications')
      if (Array.isArray(data)) {
        setNotifications(data)
      }
    } catch {
      // offline fallback sample
      setNotifications([
        {
          id: 1,
          title: 'Case Under Review',
          message: 'Case CASE-2026-000001 status changed to Under Review by Lead Investigator.',
          type: 'Case Status Changed',
          link: '/dashboard/cases?id=1',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 2,
          title: 'New Investigator Message',
          message: 'Admin added a message to your incident report CASE-2026-000001.',
          type: 'Admin Message',
          link: '/dashboard/cases?id=1',
          is_read: false,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: 3,
          title: 'Budget Alert (Shopping)',
          message: 'Shopping category has reached 88% of your configured monthly threshold.',
          type: 'Budget Warning',
          link: '/dashboard/budgets',
          is_read: true,
          created_at: new Date(Date.now() - 3600000 * 36).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // offline fallback
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    decrementNotifications()
  }

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' })
    } catch {
      // offline fallback
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Case Status Changed':
      case 'Case Created':
        return <FolderKanban className="w-5 h-5 text-sky-400" />
      case 'Admin Message':
      case 'Evidence Requested':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />
      case 'Budget Warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />
      case 'Transaction Flagged':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />
      default:
        return <Bell className="w-5 h-5 text-primary" />
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read
    return true
  })

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications & Platform Alerts
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time administrative updates, rule warnings, and case communications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-[#b8f55e] text-[#071014]'
                : 'text-slate-400 hover:text-white bg-[#071014]'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'UNREAD'
                ? 'bg-[#b8f55e] text-[#071014]'
                : 'text-slate-400 hover:text-white bg-[#071014]'
            }`}
          >
            Unread ({notifications.filter((n) => !n.is_read).length})
          </button>
        </div>

        {/* Notification Feed */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading alerts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0a1718] border border-white/10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#b8f55e] mx-auto" />
            <h3 className="text-base font-semibold text-white">All caught up!</h3>
            <p className="text-xs text-slate-400">
              No {filter === 'UNREAD' ? 'unread ' : ''}notifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(filtered || []).map((item) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  !item.is_read
                    ? 'bg-[#0a1718] border-[#b8f55e]/30 shadow-lg shadow-[#b8f55e]/5'
                    : 'bg-[#0a1718]/60 border-white/5'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#071014] border border-white/5 shrink-0 mt-0.5 text-[#b8f55e]">
                    {getIcon(item.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#b8f55e] animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span>
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{item.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={() => !item.is_read && markAsRead(item.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#b8f55e] transition text-xs font-semibold flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Inspect</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!item.is_read && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition text-xs"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  )
}
