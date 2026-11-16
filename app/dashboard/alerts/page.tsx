'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertOctagon,
  AlertTriangle,
  Globe,
  Smartphone,
  Send,
  CreditCard,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Lock,
  ArrowRight,
  Info,
  Radio,
  Activity,
  Radar,
  Eye,
  Crosshair
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'
import { SecurityActionModal, SecurityModalType } from '@/components/security/security-action-modal'
import { RealGoogleMap, MapMarkerItem } from '@/components/maps/real-google-map'
import { useLanguage } from '@/lib/i18n/language-context'

const FRAUD_MAP_MARKERS: MapMarkerItem[] = [
  {
    id: 'ALERT-101',
    title: 'Delhi Concurrent Transfer (DEV-A782)',
    subtitle: 'Velocity conflict: 1,740 km/h impossible travel speed',
    lat: 28.6139,
    lng: 77.2090,
    city: 'Delhi',
    country: 'India',
    amount: 28000,
    riskScore: 92,
    riskLevel: 'CRITICAL',
    source: 'UPI',
    status: 'Blocked by Firewall',
    device: 'New Android (DEV-A782)',
    timestamp: 'Today · 2:18 AM',
    anomalyReason: 'NEW_PAYEE_GUARD, NIGHT_SAFETY_WINDOW, FOREIGN_DEVICE_TRIGGER'
  },
  {
    id: 'ALERT-102',
    title: 'Singapore Foreign POS Terminal',
    subtitle: 'Cross-border card attempt without 3D Secure OTP',
    lat: 1.3521,
    lng: 103.8198,
    city: 'Singapore',
    country: 'Singapore',
    amount: 32000,
    riskScore: 84,
    riskLevel: 'HIGH',
    source: 'CARD',
    status: 'Pending Authorization',
    device: 'Apple Pay Virtual Gateway',
    timestamp: 'Today · 11:42 AM',
    anomalyReason: 'CROSS_BORDER_CARD_WARNING, NON_RESIDENT_POS'
  },
  {
    id: 'SAFE-HOME',
    title: 'Home Resident Node (Primary)',
    subtitle: 'Enrolled primary device & biometric anchor',
    lat: 12.9716,
    lng: 77.5946,
    city: 'Bengaluru',
    country: 'India',
    riskScore: 6,
    riskLevel: 'LOW',
    source: 'DEVICE',
    status: 'Authorized Safe Device',
    device: 'Samsung Galaxy S24 (Enrolled)',
    timestamp: 'Active Now'
  }
]

export default function UserAlertsPage() {
  const { t } = useLanguage()
  const [resolvedIds, setResolvedIds] = useState<string[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('ALERT-101')
  const [modalConfig, setModalConfig] = useState<{
    open: boolean
    type: SecurityModalType
    data: any
  }>({
    open: false,
    type: 'account_freeze',
    data: {}
  })
  const [inAppToast, setInAppToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setInAppToast(msg)
    setTimeout(() => setInAppToast(null), 3500)
  }

  const handleAction = (id: string, actionName: string) => {
    setResolvedIds((prev) => [...prev, id])

    if (actionName === 'Account Frozen') {
      setModalConfig({
        open: true,
        type: 'account_freeze',
        data: {
          entityTitle: 'ALERT-101 (Delhi Concurrent Transfer)',
          location: 'Delhi, India',
          time: '2:18 AM',
          amount: '28,000',
          deviceId: 'New Android (DEV-A782)',
          ip: '49.36.128.91',
          reason: 'Deterministic firewall: 3 checks triggered (NEW_PAYEE_GUARD, NIGHT_SAFETY_WINDOW, FOREIGN_DEVICE_TRIGGER)'
        }
      })
    } else if (actionName === 'Card Frozen') {
      setModalConfig({
        open: true,
        type: 'card_freeze',
        data: {
          entityTitle: 'HDFC Regalia Visa (**** 4821)',
          location: 'Singapore (SG)',
          cardLast4: '4821',
          time: 'Today 11:42 AM',
          amount: '32,000',
          reason: 'Cross-Border foreign POS payment from Singapore without 3D Secure OTP'
        }
      })
    } else if (actionName === 'Account Frozen' || actionName.includes('Secure')) {
      setModalConfig({
        open: true,
        type: 'account_freeze',
        data: {
          entityTitle: 'UPI Shield Primary Account (demo@upishield.ai)',
          location: 'Delhi, India (Unauthorized Concurrent Node)',
          time: 'Just now',
          amount: '28,000',
          reason: 'Emergency account lockdown triggered by user. All active UPI credentials and device tokens frozen.'
        }
      })
    } else {
      showToast(`✓ Alert ${id} processed: ${actionName}`)
    }
  }

  // Active markers on map filter out resolved
  const activeMarkers = FRAUD_MAP_MARKERS.filter(m => m.id === 'SAFE-HOME' || !resolvedIds.includes(m.id))

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="ACTIVE ANOMALY DETECTIONS" variant="lime" />
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                LIVE SPATIAL RADAR ACTIVE
              </span>
            </div>
            <MotionWordReveal
              text="Fraud Alerts & Spatial Warnings"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time alerts generated by deterministic security rules (Velocity, Odd Hours, Unseen Payee, Cross-Border).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/report"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-rose-600/20"
            >
              <ShieldAlert className="size-3.5" /> File New Dispute
            </Link>
          </div>
        </div>

        {/* LIVE THREAT STREAM TICKER */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3.5 flex items-center justify-between gap-4 overflow-hidden">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="size-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="size-3.5 animate-pulse" /> LIVE THREAT STREAM
            </span>
          </div>

          <div className="text-xs font-mono text-rose-200/90 truncate">
            {resolvedIds.includes('ALERT-101') ? (
              <span className="text-emerald-400">ALERT-101 (Delhi Transfer) Neutralized · Node Isolated</span>
            ) : (
              <span>CRITICAL: 1,740 km/h impossible velocity between Bengaluru & Delhi · Debit Request ₹28,000 Intercepted</span>
            )}
          </div>

          <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden sm:inline">
            Active Latency: &lt; 8ms
          </span>
        </div>

        {/* EMBEDDED GEOSPATIAL MAP HUD */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Radar className="size-4 text-[#b8f55e]" />
              <h4 className="text-sm font-bold text-white">Geospatial Telemetry & Threat Vectors</h4>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                Watermark-Free Canvas
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#8fa9a6]">
              Click any pin on the map or select an alert card below to sync coordinates
            </p>
          </div>

          {/* Interactive Map */}
          <div className="rounded-2xl overflow-hidden border border-white/10 relative">
            <RealGoogleMap
              markers={activeMarkers}
              selectedMarkerId={selectedAlertId}
              onSelectMarker={(m) => setSelectedAlertId(m?.id || null)}
              height="340px"
              initialCenter={[20.5937, 78.9629]}
              initialZoom={4}
            />
          </div>
        </div>

        {/* ALERT 1: LOCATION + DEVICE ALERT (Delhi Concurrent Transfer) */}
        {!resolvedIds.includes('ALERT-101') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 space-y-5 shadow-xl transition cursor-pointer ${
              selectedAlertId === 'ALERT-101'
                ? 'border-rose-500 bg-rose-950/20 shadow-rose-950/40 ring-1 ring-rose-500'
                : 'border-rose-500/30 bg-[#0a1718] hover:border-rose-500/60 shadow-rose-950/20'
            }`}
            onClick={() => setSelectedAlertId('ALERT-101')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                  <AlertOctagon className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                    CRITICAL WARNING · 3 DETERMINISTIC CHECKS TRIGGERED
                  </span>
                  <h3 className="text-lg font-bold text-white">LOCATION + DEVICE ANOMALY</h3>
                </div>
              </div>

              <div className="text-right sm:self-center">
                <p className="text-2xl font-bold text-white font-mono">₹28,000</p>
                <span className="text-[11px] text-[#8fa9a6]">UPI Payment Request</span>
              </div>
            </div>

            {/* Alert Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Receiver VPA</span>
                <p className="font-mono text-white truncate">unknown@upi</p>
                <span className="text-[10px] text-amber-400">New Payee Flag</span>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Attempt Location</span>
                <p className="font-medium text-white flex items-center gap-1">
                  <MapPin className="size-3 text-rose-400" /> Delhi, India
                </p>
                <span className="text-[10px] text-rose-400 font-mono">1,740 km from Home Node</span>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Device ID</span>
                <p className="font-medium text-white flex items-center gap-1">
                  <Smartphone className="size-3 text-amber-400" /> New Android (DEV-A782)
                </p>
                <span className="text-[10px] text-amber-400">Unfingerprinted Hardware</span>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Time of Attempt</span>
                <p className="font-medium text-white flex items-center gap-1">
                  <Clock className="size-3 text-slate-400" /> 2:18 AM
                </p>
                <span className="text-[10px] text-rose-400 font-mono">Night Safety Window</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <Info className="size-4 shrink-0" />
              <span>
                Deterministic rules: <strong>NEW_PAYEE_GUARD</strong>, <strong>NIGHT_SAFETY_WINDOW</strong>, and <strong>FOREIGN_DEVICE_TRIGGER</strong> all activated.
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleAction('ALERT-101', 'Reviewed')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
              >
                Review Details
              </button>
              <button
                onClick={() => handleAction('ALERT-101', 'Marked Safe')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#b8f55e] transition"
              >
                Mark Safe
              </button>
              <Link
                href="/dashboard/report?upi=unknown@upi&amount=28000"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition shadow-lg shadow-rose-600/20"
              >
                Report & Dispute
              </Link>
              <button
                onClick={() => handleAction('ALERT-101', 'Account Frozen')}
                className="px-4 py-2 rounded-xl bg-red-950 border border-red-500/40 text-xs font-semibold text-red-200 hover:bg-red-900 transition flex items-center gap-1.5"
              >
                <Lock className="size-3 text-rose-400" /> Secure & Freeze Account
              </button>
            </div>
          </motion.div>
        )}

        {/* ALERT 2: INTERNATIONAL LOCATION WARNING (Singapore POS Terminal) */}
        {!resolvedIds.includes('ALERT-102') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 space-y-5 shadow-xl transition cursor-pointer ${
              selectedAlertId === 'ALERT-102'
                ? 'border-amber-500 bg-amber-950/20 shadow-amber-950/40 ring-1 ring-amber-500'
                : 'border-amber-500/30 bg-[#0a1718] hover:border-amber-500/60 shadow-amber-950/20'
            }`}
            onClick={() => setSelectedAlertId('ALERT-102')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Globe className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    CROSS-BORDER CARD TRANSACTION WARNING
                  </span>
                  <h3 className="text-lg font-bold text-white">INTERNATIONAL PAYMENT LOCATION</h3>
                </div>
              </div>

              <div className="text-right sm:self-center">
                <p className="text-2xl font-bold text-white font-mono">₹32,000</p>
                <span className="text-[11px] text-[#8fa9a6]">Foreign POS Terminal</span>
              </div>
            </div>

            {/* Alert Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Country</span>
                <p className="font-bold text-white">Singapore (SG)</p>
                <span className="text-[10px] text-amber-400">Non-Resident Terminal</span>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Card Used</span>
                <p className="font-mono text-white flex items-center gap-1">
                  <CreditCard className="size-3 text-sky-400" /> **** 4821
                </p>
                <span className="text-[10px] text-sky-400">HDFC Regalia Visa</span>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Origin Device</span>
                <p className="font-medium text-white flex items-center gap-1">
                  <Smartphone className="size-3 text-slate-400" /> New / Virtual
                </p>
                <span className="text-[10px] text-slate-400">Apple Pay Gateway</span>
              </div>

              <div className="p-3 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[#8fa9a6]">Status</span>
                <p className="font-bold text-amber-400">Pending Authorization</p>
                <span className="text-[10px] text-slate-500">Requires Confirmation</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleAction('ALERT-102', 'Recognized')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#b8f55e] transition"
              >
                Recognize
              </button>
              <Link
                href="/dashboard/report?card=4821&amount=32000"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition shadow-lg shadow-rose-600/20"
              >
                Report Unrecognized
              </Link>
              <button
                onClick={() => handleAction('ALERT-102', 'Card Frozen')}
                className="px-4 py-2 rounded-xl bg-red-950 border border-red-500/40 text-xs font-semibold text-red-200 hover:bg-red-900 transition flex items-center gap-1.5"
              >
                <Lock className="size-3 text-rose-400" /> Freeze Card
              </button>
            </div>
          </motion.div>
        )}

        {resolvedIds.length >= 2 && (
          <div className="text-center py-16 rounded-2xl border border-white/10 bg-[#0a1718] p-8">
            <CheckCircle2 className="size-12 text-[#b8f55e] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">All Security Alerts Acknowledged</h3>
            <p className="text-xs text-[#8fa9a6] mt-1">
              Your account status is currently nominal. Zero active deterministic flags.
            </p>
          </div>
        )}
      </div>

      <SecurityActionModal
        isOpen={modalConfig.open}
        onClose={() => setModalConfig((prev) => ({ ...prev, open: false }))}
        type={modalConfig.type}
        data={modalConfig.data}
        onConfirm={(details) => {
          showToast(`✓ Action completed successfully`)
          setModalConfig((prev) => ({ ...prev, open: false }))
        }}
      />

      {inAppToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#091726] border border-white/10 p-4 text-xs font-bold text-white shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#b8f55e]" />
          <span>{inAppToast}</span>
        </div>
      )}
    </UserLayout>
  )
}
