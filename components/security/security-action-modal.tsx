'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Smartphone,
  KeyRound,
  FileText,
  PhoneCall,
  CheckCircle2,
  X,
  AlertTriangle,
  Download,
  Copy,
  Radio,
  ExternalLink,
  RefreshCw,
  LogOut
} from 'lucide-react'

export type SecurityModalType =
  | 'device_lockdown'
  | 'account_freeze'
  | 'card_freeze'
  | 'node_quarantine'
  | 'scam_qr_intercept'

export interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
  type: SecurityModalType
  data?: {
    entityTitle?: string
    deviceId?: string
    location?: string
    time?: string
    amount?: number | string
    ip?: string
    upiId?: string
    cardLast4?: string
    reason?: string
    riskScore?: number
  }
  onActionComplete?: (actionName: string) => void
}

export function SecurityActionModal({
  isOpen,
  onClose,
  type,
  data = {},
  onActionComplete
}: SecurityModalProps) {
  const [activeStep, setActiveStep] = useState<'main' | 'pin_reset' | 'report_generated'>('main')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)
  const [sessionsRevoked, setSessionsRevoked] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [copiedIncident, setCopiedIncident] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  if (!isOpen) return null

  const handleResetPin = () => {
    if (newPin.length !== 4 || newPin !== confirmPin) return
    setLoadingAction('pin')
    setTimeout(() => {
      setPinSuccess(true)
      setLoadingAction(null)
      if (onActionComplete) onActionComplete('UPI PIN Reset')
    }, 600)
  }

  const handleRevokeSessions = () => {
    setLoadingAction('revoke')
    setTimeout(() => {
      setSessionsRevoked(true)
      setLoadingAction(null)
      if (onActionComplete) onActionComplete('All Device Sessions Revoked')
    }, 700)
  }

  const handleToggleBiometric = () => {
    setLoadingAction('biometric')
    setTimeout(() => {
      setBiometricEnabled(true)
      setLoadingAction(null)
      if (onActionComplete) onActionComplete('Biometric Kill-Switch Enabled')
    }, 500)
  }

  const handleCopyIncidentReport = () => {
    const reportText = `[NATIONAL CYBERCRIME REPORTING PORTAL - INCIDENT DRAFT]
Reference ID: UPI-SHIELD-${Date.now().toString(36).toUpperCase()}
Timestamp: ${new Date().toISOString()}
Security Event: ${type.toUpperCase().replace('_', ' ')}
Flagged Entity: ${data.entityTitle || data.upiId || data.deviceId || 'DEV-A782'}
Location of Incident: ${data.location || 'Delhi, India'}
IP Address: ${data.ip || '49.36.128.91'}
Attempted Amount: ₹${data.amount || '28,000'}
Deterministic Safety Action: Session Terminated / Account Quarantined
Platform: UPI Shield AI Autonomous Cyber Intelligence System`

    navigator.clipboard.writeText(reportText)
    setCopiedIncident(true)
    setTimeout(() => setCopiedIncident(false), 2500)
    if (onActionComplete) onActionComplete('Incident Report Copied')
  }

  const handleDownloadAuditReport = () => {
    const reportPayload = {
      platform: 'UPI Shield AI',
      generated_at: new Date().toISOString(),
      event_type: type,
      security_tier: 'ZERO_TRUST_DETERMINISTIC_LOCKDOWN',
      telemetry: {
        entity: data.entityTitle || data.upiId || data.deviceId,
        location: data.location || 'Delhi, India',
        ip_origin: data.ip || '49.36.128.91',
        time_of_attempt: data.time || '10:38 AM',
        amount: data.amount,
        risk_score: data.riskScore || 95
      },
      audit_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      protection_status: 'FUNDS_PROTECTED_ZERO_LOSS'
    }

    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `UPI-Shield-Security-Incident-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    if (onActionComplete) onActionComplete('Forensic Audit Slip Downloaded')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-[#0a1718] p-6 shadow-2xl shadow-rose-950/40 text-white overflow-hidden"
        >
          {/* Top Decorative Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="size-4" />
          </button>

          {/* Header Badge & Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="size-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                {type === 'device_lockdown' && 'UNKNOWN DEVICE TERMINATED'}
                {type === 'account_freeze' && 'ACCOUNT PROTECTION ACTIVE'}
                {type === 'card_freeze' && 'PAYMENT CARD LOCKED'}
                {type === 'node_quarantine' && 'THREAT NODE QUARANTINED'}
                {type === 'scam_qr_intercept' && 'FRAUDULENT QR INTERCEPTED'}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {type === 'device_lockdown' && 'Device Revoked & Session Blocked'}
                {type === 'account_freeze' && 'Account Transfers Temporarily Locked'}
                {type === 'card_freeze' && `Card •••• ${data.cardLast4 || '4821'} Suspended`}
                {type === 'node_quarantine' && `Node Quarantined: ${data.entityTitle || 'Suspicious Entity'}`}
                {type === 'scam_qr_intercept' && 'Malicious Collect Scam Prevented'}
              </h2>
            </div>
          </div>

          {/* Telemetry Summary Card */}
          <div className="rounded-2xl border border-white/8 bg-[#071014] p-3.5 space-y-2 mb-5 text-xs">
            <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
              <span>Incident Trigger</span>
              <span className="font-semibold text-rose-300">
                {data.reason || 'Unauthorized Concurrent Login Detected'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Location</span>
                <span className="text-slate-200 font-medium">{data.location || 'Delhi, India'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Device / IP</span>
                <span className="text-slate-200 font-medium">{data.deviceId || 'DEV-A782'} ({data.ip || '49.36.128.91'})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Protection Status</span>
                <span className="text-[#b8f55e] font-bold">100% Zero Loss</span>
              </div>
            </div>
          </div>

          {/* Step 1: Main Action Hub */}
          {activeStep === 'main' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="size-3.5 text-[#b8f55e]" />
                  Further Recommended Security Actions:
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select immediate defensive measures to secure your digital identity and funds:
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid gap-2.5">
                {/* 1. Reset UPI PIN */}
                <button
                  onClick={() => setActiveStep('pin_reset')}
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#b8f55e]/40 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                      <KeyRound className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#b8f55e] transition">
                        Reset UPI PIN & Passcode
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {pinSuccess ? '✓ PIN reset successfully just now' : 'Re-establish single-user deterministic PIN'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {pinSuccess ? 'Done' : 'Update'}
                  </span>
                </button>

                {/* 2. Revoke All Other Device Sessions */}
                <button
                  onClick={handleRevokeSessions}
                  disabled={sessionsRevoked || loadingAction === 'revoke'}
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-rose-500/40 transition text-left group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-rose-500/15 text-rose-400">
                      <LogOut className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-rose-300 transition">
                        Revoke All Active App Tokens
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {sessionsRevoked ? '✓ All other 3 devices kicked out' : 'Force logout on all tablets, emulators & PCs'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sessionsRevoked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                    {sessionsRevoked ? 'Revoked' : loadingAction === 'revoke' ? 'Processing...' : 'Kick All'}
                  </span>
                </button>

                {/* 3. Enable Biometric Cooling-off Shield */}
                <button
                  onClick={handleToggleBiometric}
                  disabled={biometricEnabled || loadingAction === 'biometric'}
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#b8f55e]/40 transition text-left group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Radio className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#b8f55e] transition">
                        Enforce Biometric Only Kill-Switch (48h)
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {biometricEnabled ? '✓ Biometric lock active for 48 hours' : 'Requires fingerprint/FaceID for any transfer > ₹500'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${biometricEnabled ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-[#b8f55e] bg-[#b8f55e]/10 border-[#b8f55e]/20'}`}>
                    {biometricEnabled ? 'Active' : loadingAction === 'biometric' ? 'Activating...' : 'Enable'}
                  </span>
                </button>

                {/* 4. Instant Cyber Cell Reporting */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyIncidentReport}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition"
                  >
                    <Copy className="size-3.5" />
                    {copiedIncident ? 'Copied Cyber Text!' : 'Report to 1930'}
                  </button>

                  <button
                    onClick={handleDownloadAuditReport}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#b8f55e] hover:border-[#b8f55e]/40 transition"
                  >
                    <Download className="size-3.5" />
                    Audit Forensic Slip
                  </button>
                </div>
              </div>

              {/* Bottom Finish / Dismiss */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="size-3 text-[#b8f55e]" />
                  Protected by Deterministic Firewall
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#b8f55e] text-[#071014] text-xs font-bold hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
                >
                  Done, Account Secured
                </button>
              </div>
            </div>
          )}

          {/* Step 2: In-Modal UPI PIN Reset Flow */}
          {activeStep === 'pin_reset' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="size-4 text-amber-400" />
                  Set New 4-Digit UPI PIN
                </h3>
                <button
                  onClick={() => setActiveStep('main')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Immediately updates cryptographic authorization hash across all linked bank accounts.
              </p>

              {pinSuccess ? (
                <div className="py-8 text-center space-y-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="size-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">UPI PIN Successfully Updated</h4>
                  <p className="text-xs text-emerald-300/90 max-w-xs mx-auto">
                    New credentials synced. Any unauthorized device will fail subsequent payment authorizations.
                  </p>
                  <button
                    onClick={() => setActiveStep('main')}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-[#071014] text-xs font-bold"
                  >
                    Return to Security Actions
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">New 4-digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-[1em] text-lg font-mono rounded-xl border border-white/10 bg-[#071014] py-2 text-white focus:border-[#b8f55e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Confirm New PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-[1em] text-lg font-mono rounded-xl border border-white/10 bg-[#071014] py-2 text-white focus:border-[#b8f55e] focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleResetPin}
                    disabled={newPin.length !== 4 || newPin !== confirmPin || loadingAction === 'pin'}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#071014] text-xs font-bold transition disabled:opacity-50"
                  >
                    {loadingAction === 'pin' ? 'Securing PIN...' : 'Confirm New UPI PIN'}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
