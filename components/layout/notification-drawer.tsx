'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckCheck, ShieldAlert, FileText, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useUPIGuardStore, AppNotification } from '@/lib/upiguard-store'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

interface NotificationItem {
  id: string | number
  title: string
  message: string
  notification_type: string
  reference_id?: string
  is_read: boolean
  created_at: string
  link?: string
}

export function NotificationDrawer({ admin = false }: { admin?: boolean }) {
  const { notificationOpen, setNotificationOpen, setUnreadCount } = useAppStore()
  const storeNotifications = useUPIGuardStore((s) => s.notifications)
  const markAllInStore = useUPIGuardStore((s) => s.markAllNotificationsRead)

  // Filter store notifications for user vs admin
  const relevantStoreNotifs: NotificationItem[] = (storeNotifications || [])
    .filter((n) => admin ? (n.recipientRole === 'ADMIN' || n.recipientRole === 'ALL') : (n.recipientRole === 'USER' || n.recipientRole === 'ALL'))
    .map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      notification_type: n.type,
      reference_id: n.referenceId,
      is_read: n.isRead,
      created_at: n.createdAt,
      link: n.link
    }))

  const [apiNotifications, setApiNotifications] = useState<NotificationItem[]>([])

  // Combined notifications prioritizing latest store events
  const notifications = useMemo(() => {
    const combined = [...relevantStoreNotifs]
    apiNotifications.forEach((an) => {
      if (!combined.some((cn) => cn.id.toString() === an.id.toString() || cn.reference_id === an.reference_id)) {
        combined.push(an)
      }
    })
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [relevantStoreNotifs, apiNotifications])

  useEffect(() => {
    const unread = notifications.filter((n) => !n.is_read).length
    setUnreadCount(unread)
  }, [notifications, setUnreadCount])

  useEffect(() => {
    async function loadNotifs() {
      try {
        const data = await apiRequest<any[]>('/notifications')
        if (data && Array.isArray(data) && data.length > 0) {
          setApiNotifications(data.map((d: any) => ({
            id: d.id,
            title: d.title,
            message: d.message,
            notification_type: d.notification_type || 'system',
            reference_id: d.reference_id,
            is_read: d.is_read,
            created_at: d.created_at || new Date().toISOString(),
            link: d.link
          })))
        }
      } catch (err) {
        // Fallback to local demo
      }
    }
    if (notificationOpen) {
      loadNotifs()
    }
  }, [notificationOpen])

  const handleMarkAllRead = async () => {
    markAllInStore(admin ? 'ADMIN' : 'USER')
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' })
    } catch {
      // Offline fallback
    }
    setApiNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <AnimatePresence>
      {notificationOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/10 bg-[#0a1718] p-6 shadow-2xl flex flex-col text-[#eef8f7]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-[#b8f55e]/15 text-[#b8f55e]">
                  <Bell className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Notifications</h3>
                  <p className="text-xs text-[#8fa9a6]">Platform alerts and updates</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="rounded-lg p-2 text-xs text-[#8fa9a6] hover:bg-white/5 hover:text-white"
                >
                  <CheckCheck className="size-4" />
                </button>
                <button
                  onClick={() => setNotificationOpen(false)}
                  className="rounded-lg p-2 text-[#8fa9a6] hover:bg-white/5 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {!notifications || notifications.length === 0 ? (
                <div className="py-16 text-center text-[#8fa9a6] text-sm">
                  No notifications yet
                </div>
              ) : (
                (notifications || []).map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-4 transition ${
                      n.is_read
                        ? 'border-white/5 bg-white/[0.015] text-[#8fa9a6]'
                        : 'border-[#b8f55e]/25 bg-[#b8f55e]/[0.04] text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-white/5 p-2 text-[#b8f55e]">
                        {n.notification_type === 'transaction_flagged' ? (
                          <ShieldAlert className="size-4 text-amber-400" />
                        ) : (
                          <FileText className="size-4 text-[#b8f55e]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-200 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{n.message}</p>
                        {n.reference_id && (
                          <div className="mt-2">
                            <Link
                              href={
                                admin
                                  ? `/admin/cases`
                                  : n.reference_id.startsWith('CASE')
                                  ? `/dashboard/cases`
                                  : `/dashboard/transactions`
                              }
                              onClick={() => setNotificationOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00C2FF] hover:underline"
                            >
                              View details <ArrowRight className="size-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/10 pt-4 text-center">
              <span className="text-[11px] text-slate-500">
                Deterministic Alert Engine · Real-time Rule Telemetry
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
