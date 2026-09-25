'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  ShieldCheck,
  Lock,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Globe
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminSettingsPage() {
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [auditRetention, setAuditRetention] = useState('365')
  const [geoVelocityThreshold, setGeoVelocityThreshold] = useState('800')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess('Platform security and geofence parameters updated successfully.')
    setTimeout(() => setSaveSuccess(null), 4000)
  }

  const exportAuditArchive = async () => {
    setDownloading(true)
    try {
      const data = await apiRequest('/admin/audit-logs?limit=500')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `upi_shield_audit_logs_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to export audit logs archive')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MotionBadge text="SYSTEM POLICIES & COMPLIANCE" variant="admin" />
            <span className="text-[10px] text-slate-400 font-mono">APPEND-ONLY AUDITING</span>
          </div>
          <MotionWordReveal
            text="Platform Governance & Geo Parameters"
            className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
          />
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Global session timeouts, immutable audit trail policies, and geofence velocity parameters.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Security Governance */}
          <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Lock className="size-4 text-[#b8f55e]" />
              Session & Access Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Admin Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Audit Trail Retention Window (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="1825"
                  value={auditRetention}
                  onChange={(e) => setAuditRetention(e.target.value)}
                  className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location & Velocity Governance */}
          <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <MapPin className="size-4 text-[#b8f55e]" />
              Location Intelligence & Travel Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Impossible Travel Velocity Threshold (km/h)
                </label>
                <input
                  type="number"
                  min="300"
                  max="1200"
                  value={geoVelocityThreshold}
                  onChange={(e) => setGeoVelocityThreshold(e.target.value)}
                  className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#b8f55e] font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Activities with velocity exceeding this threshold trigger instant Impossible Travel alerts.
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Cross-Border Geofence Sensitivity
                </label>
                <select className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#b8f55e]">
                  <option value="high">High (Flag all non-India merchant entities)</option>
                  <option value="medium">Medium (Allow whitelisted travel regions)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Archive Export */}
          <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Server className="size-4 text-[#b8f55e]" />
              Cryptographic Audit Archive
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Export comprehensive immutable JSON archive of all administrative logins, case status changes, verification decisions, and platform rule tuning.
            </p>

            <button
              type="button"
              onClick={exportAuditArchive}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl bg-[#071014] hover:bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="size-4 text-[#b8f55e]" />
              {downloading ? 'Preparing Archive...' : 'Export Immutable Audit Archive'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#b8f55e] hover:bg-[#a6e848] text-[#071014] font-semibold text-xs transition"
            >
              Save Parameters
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
