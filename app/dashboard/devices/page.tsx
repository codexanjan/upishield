'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Clock,
  ArrowRight,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'
import { SecurityActionModal } from '@/components/security/security-action-modal'

interface DeviceItem {
  id: string
  name: string
  deviceId: string
  type: 'phone' | 'laptop'
  trusted: boolean
  lastLocation: string
  lastUsed: string
  transactionsCount: number
  ipAddress: string
}

export default function UserDevicesPage() {
  const [securityModalOpen, setSecurityModalOpen] = useState(false)
  const [deviceAlertDismissed, setDeviceAlertDismissed] = useState(false)
  const [deviceAcknowledged, setDeviceAcknowledged] = useState(false)
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: '1',
      name: 'Samsung Galaxy S24',
      deviceId: 'DEV-A8219',
      type: 'phone',
      trusted: true,
      lastLocation: 'Bengaluru',
      lastUsed: 'Today, 9:10 PM',
      transactionsCount: 43,
      ipAddress: '157.48.21.90'
    },
    {
      id: '2',
      name: 'MacBook Pro M2 (macOS)',
      deviceId: 'DEV-M9420',
      type: 'laptop',
      trusted: true,
      lastLocation: 'Bengaluru',
      lastUsed: 'Today, 11:05 AM',
      transactionsCount: 18,
      ipAddress: '157.48.21.90'
    },
    {
      id: '3',
      name: 'Generic Android 14',
      deviceId: 'DEV-A782',
      type: 'phone',
      trusted: false,
      lastLocation: 'Delhi (Unrecognized)',
      lastUsed: 'Today, 10:38 AM',
      transactionsCount: 1,
      ipAddress: '49.36.182.14'
    }
  ])

  const [loginHistory, setLoginHistory] = useState([
    { id: 1, browser: 'Windows Chrome', city: 'Bengaluru', time: 'Today, 11:05 AM', status: 'Safe', recognized: true },
    { id: 2, browser: 'Samsung Internet / Android', city: 'Mysuru', time: 'Yesterday, 8:15 PM', status: 'Safe', recognized: true },
    { id: 3, browser: 'Chrome Mobile / Android', city: 'Delhi', time: 'Today, 10:38 AM', status: 'Suspicious', recognized: false }
  ])

  const handleRevoke = (deviceId: string) => {
    setDevices(devices.filter(d => d.deviceId !== deviceId))
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="DEVICE HARDWARE & TELEMETRY VAULT" variant="lime" />
            </div>
            <MotionWordReveal
              text="Authorized Devices & Logins"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Manage hardware fingerprinted endpoints and audit login locations for security enforcement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment-map"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              <MapPin className="size-3.5 text-[#b8f55e]" /> Payment Map
            </Link>
            <Link
              href="/dashboard/report"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-600/30 transition"
            >
              <ShieldAlert className="size-3.5" /> Report Device Fraud
            </Link>
          </div>
        </div>

        {/* UNKNOWN LOGIN ALERT BANNER (Prompt Spec 20) */}
        {!deviceAlertDismissed && !deviceAcknowledged ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    UNKNOWN LOCATION & DEVICE LOGIN
                  </span>
                  <p className="text-sm font-semibold text-white mt-1">
                    Was this you? A new device transacted from Delhi while your registered phone was active in Bengaluru.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono text-amber-200">
                    <span className="bg-black/40 px-2.5 py-1 rounded border border-white/10">Delhi · Today 10:38 AM</span>
                    <span className="bg-black/40 px-2.5 py-1 rounded border border-white/10">Device DEV-A782</span>
                    <span className="bg-black/40 px-2.5 py-1 rounded border border-white/10">IP: 49.36.128.91</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => {
                    setDeviceAlertDismissed(true)
                    setSecurityModalOpen(true)
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition shadow-lg shadow-rose-600/25 flex items-center gap-1.5"
                >
                  <Lock className="size-3.5" />
                  No, Secure Account
                </button>
                <button
                  onClick={() => setDeviceAcknowledged(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition"
                >
                  Yes, It Was Me
                </button>
              </div>
            </div>
          </motion.div>
        ) : deviceAlertDismissed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Threat Contained: Device DEV-A782 Session Terminated
                </h4>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  Unauthorized endpoint revoked. Account firewall locked and password challenge queued.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSecurityModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition shrink-0"
            >
              Further Security Actions →
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 flex items-center gap-3 text-xs text-slate-300"
          >
            <CheckCircle2 className="size-4 text-[#b8f55e]" />
            <span>Device DEV-A782 acknowledged as authorized endpoint and added to trusted devices.</span>
          </motion.div>
        )}

        {/* REGISTERED DEVICES LIST (Prompt Spec 19) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-semibold text-white">Registered Endpoints & Hardware Keys</h3>
            <span className="text-xs text-[#8fa9a6]">{devices.length} Devices Linked</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => {
              const isTrusted = device.trusted
              return (
                <div
                  key={device.deviceId}
                  className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
                    isTrusted
                      ? 'bg-[#0a1718] border-white/10'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${isTrusted ? 'bg-[#b8f55e]/15 text-[#b8f55e]' : 'bg-rose-500/20 text-rose-400'}`}>
                          {device.type === 'phone' ? <Smartphone className="size-5" /> : <Laptop className="size-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{device.name}</h4>
                          <span className="text-[11px] font-mono text-[#8fa9a6]">{device.deviceId}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isTrusted
                          ? 'bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isTrusted ? 'TRUSTED' : 'UNVERIFIED'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8fa9a6]">Last Location:</span>
                        <span className="font-medium text-white flex items-center gap-1">
                          <MapPin className="size-3 text-[#b8f55e]" /> {device.lastLocation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8fa9a6]">Last Used:</span>
                        <span className="font-medium text-white">{device.lastUsed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8fa9a6]">Transactions:</span>
                        <span className="font-mono text-[#b8f55e] font-bold">{device.transactionsCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">IP: {device.ipAddress}</span>
                    <button
                      onClick={() => handleRevoke(device.deviceId)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                    >
                      <Trash2 className="size-3" /> Revoke
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* LOGIN LOCATION HISTORY TABLE (Prompt Spec 20) */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-semibold text-white">Login Location Audit Stream</h3>
              <p className="text-xs text-[#8fa9a6]">Immutable log of web & mobile authentication events</p>
            </div>
            <span className="text-xs text-[#8fa9a6]">Zero AI Rule Verification</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-[#071014]">
                  <th className="py-3 px-4">Client / Platform</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loginHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[.02] transition">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      <Smartphone className="size-3.5 text-[#b8f55e]" />
                      {item.browser}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-[#b8f55e]" /> {item.city}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8fa9a6]">{item.time}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'Safe'
                          ? 'bg-[#b8f55e]/15 text-[#b8f55e]'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.recognized ? (
                        <span className="text-[#b8f55e] flex items-center gap-1 justify-end">
                          <CheckCircle2 className="size-3.5" /> Recognized
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1 justify-end">
                          <AlertTriangle className="size-3.5" /> Flagged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Security Action Modal with Further Defensive Actions */}
      <SecurityActionModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        type="device_lockdown"
        data={{
          deviceId: 'DEV-A782',
          location: 'Delhi, India',
          ip: '49.36.128.91',
          time: 'Today 10:38 AM',
          reason: 'Concurrent session anomaly: Transacted from Delhi while registered phone was in Bengaluru',
          amount: '28,000'
        }}
      />
    </UserLayout>
  )
}
