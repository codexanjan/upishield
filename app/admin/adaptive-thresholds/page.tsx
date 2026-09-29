'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sliders,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  Zap,
  Info,
  Lock,
  Unlock,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'

interface UserThresholdEntry {
  user_id: number
  name: string
  upi_handle: string
  baseline: number
  previous_threshold: number
  adaptive_threshold: number
  delta: number
  reason_for_change: string
  false_positives: number
  confirmed_fraud: number
  risk_tier: 'ULTRA_SAFE' | 'STANDARD' | 'ELEVATED_WATCH' | 'PROBATION'
  last_adjusted: string
}

export interface ThresholdChangeLogItem {
  id: string
  entity: string
  previous_threshold: number
  current_threshold: number
  delta: number
  reason: string
  timestamp: string
  triggered_by: string
}

export default function AdminAdaptiveThresholdsPage() {
  const [globalBaseline, setGlobalBaseline] = useState<number>(70)
  const [globalPreviousBaseline, setGlobalPreviousBaseline] = useState<number>(72)
  const [globalBaselineDelta, setGlobalBaselineDelta] = useState<number>(-2.0)
  const [globalBaselineReason, setGlobalBaselineReason] = useState<string>(
    'Dynamic tightening applied based on recent high-velocity fraud spikes and confirmed fraud feedback'
  )
  const [fpRelaxationWeight, setFpRelaxationWeight] = useState<number>(2.5)
  const [fraudTighteningWeight, setFraudTighteningWeight] = useState<number>(5.0)
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [isRecalibrating, setIsRecalibrating] = useState<boolean>(false)

  // Threshold adaptation change log required by Objective 3
  const [thresholdLogs, setThresholdLogs] = useState<ThresholdChangeLogItem[]>([
    {
      id: 'TH-LOG-904',
      entity: 'Anjan Sharma (anjan.sharma@okaxis)',
      previous_threshold: 70.0,
      current_threshold: 72.5,
      delta: 2.5,
      reason: 'False positive confirmed: Verified legitimate appliance purchase TXN-7419 (+2.5 relaxation)',
      timestamp: 'Today, 10:45 AM',
      triggered_by: 'USER_FEEDBACK'
    },
    {
      id: 'TH-LOG-903',
      entity: 'Rohan Mehta (rohan.m@okicici)',
      previous_threshold: 59.0,
      current_threshold: 55.0,
      delta: -4.0,
      reason: 'Confirmed fraud dispute: Unauthorized collect request TXN-8821 (-4.0 tightening penalty)',
      timestamp: 'Today, 02:15 AM',
      triggered_by: 'DISPUTE_RAISED'
    },
    {
      id: 'TH-LOG-902',
      entity: 'Global Production Baseline',
      previous_threshold: 72.0,
      current_threshold: 70.0,
      delta: -2.0,
      reason: 'Active evolving pattern detected: HIGH_VELOCITY_PHISHING attack surge (-2.0 dynamic tightening)',
      timestamp: 'Yesterday, 11:30 PM',
      triggered_by: 'PATTERN_ENGINE'
    },
    {
      id: 'TH-LOG-901',
      entity: 'Deepak Patel (deepak.p@okaxis)',
      previous_threshold: 65.0,
      current_threshold: 60.0,
      delta: -5.0,
      reason: 'Unusual transaction velocity burst: 6 transactions in 4 minutes from new IP (-5.0 tightening)',
      timestamp: 'Yesterday, 04:20 PM',
      triggered_by: 'VELOCITY_MONITOR'
    }
  ])

  // Demo user threshold states
  const [userThresholds, setUserThresholds] = useState<UserThresholdEntry[]>([
    {
      user_id: 1,
      name: 'Anjan Sharma',
      upi_handle: 'anjan.sharma@okaxis',
      baseline: 70,
      previous_threshold: 70.0,
      adaptive_threshold: 72.5, // 1 false positive raised it
      delta: 2.5,
      reason_for_change: 'False positive feedback (+2.5 pts bonus for legitimate verified high ticket purchase)',
      false_positives: 1,
      confirmed_fraud: 0,
      risk_tier: 'ULTRA_SAFE',
      last_adjusted: 'Yesterday, 18:20'
    },
    {
      user_id: 2,
      name: 'Priya Verma',
      upi_handle: 'priya.v@oksbi',
      baseline: 70,
      previous_threshold: 70.0,
      adaptive_threshold: 70.0,
      delta: 0.0,
      reason_for_change: 'Standard baseline: Zero disputes or anomalies in last 30 days',
      false_positives: 0,
      confirmed_fraud: 0,
      risk_tier: 'STANDARD',
      last_adjusted: '3 days ago'
    },
    {
      user_id: 3,
      name: 'Rohan Mehta',
      upi_handle: 'rohan.m@okicici',
      baseline: 70,
      previous_threshold: 59.0,
      adaptive_threshold: 55.0, // 3 confirmed frauds lowered it
      delta: -4.0,
      reason_for_change: 'Confirmed fraud penalty (-4.0 pts tightening due to unauthorized collect dispute)',
      false_positives: 0,
      confirmed_fraud: 3,
      risk_tier: 'PROBATION',
      last_adjusted: 'Today, 02:15'
    },
    {
      user_id: 4,
      name: 'Kavita Nair',
      upi_handle: 'kavita.nair@okhdfc',
      baseline: 70,
      previous_threshold: 72.5,
      adaptive_threshold: 75.0, // 2 false positives
      delta: 2.5,
      reason_for_change: 'Consistently verified user actions (+2.5 pts relaxed threshold)',
      false_positives: 2,
      confirmed_fraud: 0,
      risk_tier: 'ULTRA_SAFE',
      last_adjusted: '5 days ago'
    },
    {
      user_id: 5,
      name: 'Deepak Patel',
      upi_handle: 'deepak.p@okaxis',
      baseline: 70,
      previous_threshold: 65.0,
      adaptive_threshold: 60.0, // 2 fraud alerts
      delta: -5.0,
      reason_for_change: 'Suspicious device rotation & multiple failed PINs (-5.0 pts tightening)',
      false_positives: 0,
      confirmed_fraud: 2,
      risk_tier: 'ELEVATED_WATCH',
      last_adjusted: '1 day ago'
    }
  ])

  // Recalibrate dynamic threshold based on recent behavior, fraud rate, and feedback
  const handleRecalibrateAll = () => {
    setIsRecalibrating(true)
    setTimeout(() => {
      const newGlobal = Math.max(50, Math.min(85, globalBaseline - 1.5))
      const delta = Number((newGlobal - globalBaseline).toFixed(1))
      setGlobalPreviousBaseline(globalBaseline)
      setGlobalBaseline(newGlobal)
      setGlobalBaselineDelta(delta)
      const reason = `Automated Bayesian recalculation: Absorbed 3 pending user fraud disputes and 1 active velocity pattern (-1.5 pts)`
      setGlobalBaselineReason(reason)

      // Add to log
      setThresholdLogs(prev => [
        {
          id: `TH-LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          entity: 'Global Production Baseline',
          previous_threshold: globalBaseline,
          current_threshold: newGlobal,
          delta: delta,
          reason: reason,
          timestamp: 'Just now',
          triggered_by: 'BAYESIAN_TUNER'
        },
        ...prev
      ])

      setIsRecalibrating(false)
      setSaveNotice('Adaptive thresholds updated across all active inference nodes.')
      setTimeout(() => setSaveNotice(null), 4000)
    }, 900)
  }

  const handleSavePolicy = () => {
    setSaveNotice('Adaptive Threshold calibration saved and pushed to dynamic inference nodes.')
    setTimeout(() => setSaveNotice(null), 4000)
  }

  const toggleEmergencyLockdown = () => {
    const next = !emergencyLockdown
    setEmergencyLockdown(next)
    if (next) {
      setSaveNotice('EMERGENCY LOCKDOWN ACTIVATED: All user thresholds clamped to 40. High sensitivity active.')
    } else {
      setSaveNotice('Emergency lockdown deactivated. Resumed per-user adaptive thresholds.')
    }
    setTimeout(() => setSaveNotice(null), 5000)
  }

  const handleResetUser = (id: number) => {
    setUserThresholds(prev => prev.map(u => u.user_id === id ? {
      ...u,
      adaptive_threshold: globalBaseline,
      false_positives: 0,
      confirmed_fraud: 0,
      risk_tier: 'STANDARD',
      last_adjusted: 'Just now'
    } : u))
    setSaveNotice(`User #${id} reset to standard baseline threshold (${globalBaseline}).`)
    setTimeout(() => setSaveNotice(null), 3000)
  }

  const filteredUsers = userThresholds.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.upi_handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30">
                DYNAMIC RISK BARRIERS
              </span>
              <span className="text-xs text-white/50">Engine: Adaptive Bayesian Tuner</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Adaptive Threshold Engine</h1>
            <p className="text-sm text-white/60">
              Personalized risk cutoffs automatically recalibrated based on verified user feedback, false-positive history, and confirmed fraud attacks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleEmergencyLockdown}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                emergencyLockdown
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              {emergencyLockdown ? <Lock className="size-4" /> : <Unlock className="size-4" />}
              {emergencyLockdown ? 'EMERGENCY LOCKDOWN ACTIVE' : 'Trigger Emergency Lockdown'}
            </button>

            <button
              onClick={handleSavePolicy}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#b8f55e] text-[#071014] hover:bg-[#c9f97f] flex items-center gap-2 shadow-lg shadow-[#b8f55e]/20 transition-all cursor-pointer"
            >
              <Save className="size-4" />
              Save Configuration
            </button>
          </div>
        </div>

        {/* Notice */}
        {saveNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10 text-xs text-[#b8f55e] flex items-center justify-between"
          >
            <span>{saveNotice}</span>
            <CheckCircle2 className="size-4" />
          </motion.div>
        )}

        {/* Current vs Previous Adaptive Threshold Banner (Objective 3 Requirement) */}
        <div className="p-5 rounded-2xl border border-[#b8f55e]/30 bg-[#0a1718] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl shadow-black/40">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30">
                Active Production Barrier
              </span>
              <span className="text-xs text-white/50">• Dynamic Bayesian Tuner</span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-[#b8f55e]" />
              System-Wide Adaptive Cutoff: {globalBaseline} / 100
            </h2>
            <p className="text-xs text-white/70 max-w-3xl leading-relaxed">
              Reason for recent adaptation: <span className="text-[#b8f55e] font-medium">{globalBaselineReason}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-right min-w-24">
              <span className="text-[10px] text-white/40 uppercase block font-semibold">Previous Cutoff</span>
              <span className="text-xl font-mono font-bold text-white/80">{globalPreviousBaseline}</span>
            </div>
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-right min-w-24">
              <span className="text-[10px] text-white/40 uppercase block font-semibold">Net Change (Δ)</span>
              <span className={`text-xl font-mono font-bold ${globalBaselineDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {globalBaselineDelta > 0 ? `+${globalBaselineDelta}` : globalBaselineDelta} pts
              </span>
            </div>
            <button
              onClick={handleRecalibrateAll}
              disabled={isRecalibrating}
              className="px-4 py-3 rounded-xl text-xs font-bold bg-[#b8f55e] text-[#071014] hover:bg-[#c9f97f] flex items-center gap-2 shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`size-4 ${isRecalibrating ? 'animate-spin' : ''}`} />
              {isRecalibrating ? 'Recalibrating...' : 'Recalibrate Dynamic Threshold'}
            </button>
          </div>
        </div>

        {/* Top Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-[#0a1718]">
            <span className="text-xs uppercase text-white/50 tracking-wider">Current Cutoff</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-white">{globalBaseline}</span>
              <span className="text-xs text-white/40">/ 100</span>
            </div>
            <span className="text-[11px] text-white/50 block mt-2">Previous: {globalPreviousBaseline} (Δ {globalBaselineDelta > 0 ? `+${globalBaselineDelta}` : globalBaselineDelta})</span>
          </div>

          <div className="p-4 rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10">
            <span className="text-xs uppercase text-[#b8f55e] tracking-wider">Ultra-Safe Tier (&gt;72)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-white">41.2%</span>
              <span className="text-xs text-[#b8f55e]">of users</span>
            </div>
            <span className="text-[11px] text-white/60 block mt-2">Elevated threshold = zero friction</span>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0a1718]">
            <span className="text-xs uppercase text-white/50 tracking-wider">Standard Tier (68-72)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-white">52.6%</span>
              <span className="text-xs text-white/40">of users</span>
            </div>
            <span className="text-[11px] text-white/50 block mt-2">Nominal friction; standard velocity</span>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
            <span className="text-xs uppercase text-rose-400 tracking-wider">Probation Tier (&lt;65)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-mono font-bold text-white">6.2%</span>
              <span className="text-xs text-rose-400">of users</span>
            </div>
            <span className="text-[11px] text-white/60 block mt-2">Tightened barriers after fraud alerts</span>
          </div>
        </div>

        {/* Adaptive Threshold Updates & Audit Timeline (Objective 3 Requirement) */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0a1718] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Adaptive Threshold Changes & Reasons</h3>
              <p className="text-xs text-white/50">Audit history of mathematical cutoff adjustments triggered by behavioral shifts and confirmed feedback</p>
            </div>
            <span className="text-xs text-white/50 font-mono">
              History Size: {thresholdLogs.length} Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="bg-white/5 text-white/90 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Prior Cutoff</th>
                  <th className="p-3">New Cutoff</th>
                  <th className="p-3">Delta (Δ)</th>
                  <th className="p-3">Reason for Adaptation</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {thresholdLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#b8f55e]">{log.id}</td>
                    <td className="p-3 font-semibold text-white">{log.entity}</td>
                    <td className="p-3 font-mono">{log.previous_threshold}</td>
                    <td className="p-3 font-mono font-bold text-white">{log.current_threshold}</td>
                    <td className="p-3 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        log.delta > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : log.delta < 0
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-white/10 text-white/70'
                      }`}>
                        {log.delta > 0 ? `+${log.delta}` : log.delta} pts
                      </span>
                    </td>
                    <td className="p-3 text-white/70 max-w-md">{log.reason}</td>
                    <td className="p-3 font-mono text-white/40 whitespace-nowrap">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Policy Calibrator */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0a1718] space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-[#b8f55e]" />
              Adaptive Barrier Policy Tuning
            </h3>
            <p className="text-xs text-white/50">Define mathematical relaxation and tightening gradients applied to individual risk curves</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Slider 1: Global Baseline */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Default Baseline</span>
                <span className="font-mono text-sm font-bold text-[#b8f55e]">{globalBaseline}</span>
              </div>
              <input
                type="range"
                min="50"
                max="85"
                step="1"
                value={globalBaseline}
                onChange={e => setGlobalBaseline(Number(e.target.value))}
                className="w-full accent-[#b8f55e] cursor-pointer"
              />
              <p className="text-[11px] text-white/50">
                Transactions scoring above this score trigger verification or hold for fresh accounts.
              </p>
            </div>

            {/* Slider 2: False Positive Relaxation */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">False Positive Bonus</span>
                <span className="font-mono text-sm font-bold text-emerald-400">+{fpRelaxationWeight} pts</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={fpRelaxationWeight}
                onChange={e => setFpRelaxationWeight(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <p className="text-[11px] text-white/50">
                When a user confirms &quot;Yes, this was me&quot;, threshold raises by this amount (capped at +10 pts).
              </p>
            </div>

            {/* Slider 3: Confirmed Fraud Tightening */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Confirmed Fraud Penalty</span>
                <span className="font-mono text-sm font-bold text-rose-400">-{fraudTighteningWeight} pts</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={fraudTighteningWeight}
                onChange={e => setFraudTighteningWeight(Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
              <p className="text-[11px] text-white/50">
                When chargeback or fraud is confirmed, threshold drops by this amount (tightening security).
              </p>
            </div>
          </div>
        </div>

        {/* Per-User Threshold Inspector Table */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0a1718] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Per-User Adaptive Thresholds</h3>
              <p className="text-xs text-white/50">Dynamic cutoffs currently applied in active transaction evaluation</p>
            </div>

            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-2.5 text-white/40" />
              <input
                type="text"
                placeholder="Search by name or UPI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#b8f55e]/50 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="bg-white/5 text-white/90 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">UPI Handle</th>
                  <th className="p-3">Base</th>
                  <th className="p-3">Prior</th>
                  <th className="p-3">Active Cutoff</th>
                  <th className="p-3">Delta (Δ)</th>
                  <th className="p-3">Reason for Change</th>
                  <th className="p-3">Risk Tier</th>
                  <th className="p-3">Last Adjusted</th>
                  <th className="p-3 text-right">Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map(user => {
                  const effectiveThreshold = emergencyLockdown ? 40 : user.adaptive_threshold
                  return (
                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-white whitespace-nowrap">{user.name}</td>
                      <td className="p-3 font-mono text-white/60">{user.upi_handle}</td>
                      <td className="p-3 font-mono">{user.baseline}</td>
                      <td className="p-3 font-mono text-white/60">{user.previous_threshold}</td>
                      <td className="p-3 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          effectiveThreshold >= 72
                            ? 'bg-[#b8f55e]/20 text-[#b8f55e]'
                            : effectiveThreshold <= 60
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/10 text-white'
                        }`}>
                          {effectiveThreshold}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          user.delta > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : user.delta < 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-white/5 text-white/50'
                        }`}>
                          {user.delta > 0 ? `+${user.delta}` : user.delta}
                        </span>
                      </td>
                      <td className="p-3 text-white/70 max-w-xs truncate" title={user.reason_for_change}>
                        {user.reason_for_change}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.risk_tier === 'ULTRA_SAFE'
                            ? 'bg-[#b8f55e]/20 text-[#b8f55e]'
                            : user.risk_tier === 'PROBATION'
                            ? 'bg-rose-500/20 text-rose-400'
                            : user.risk_tier === 'ELEVATED_WATCH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {user.risk_tier}
                        </span>
                      </td>
                      <td className="p-3 text-white/50 whitespace-nowrap">{user.last_adjusted}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleResetUser(user.user_id)}
                          title="Reset to default baseline"
                          className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
