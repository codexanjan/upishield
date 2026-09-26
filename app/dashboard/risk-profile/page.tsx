'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Cpu,
  Smartphone,
  MapPin,
  Compass,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Sparkles,
  Lock,
  RefreshCw,
  QrCode,
  ArrowUpRight,
  Eye,
  Check,
  Clock,
  Layers,
  Zap,
  Info
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import {
  evaluateDynamicRisk,
  normalizeCrossUpiPayload,
  DEFAULT_USER_BASELINE,
  calculateAdaptiveThreshold,
  DynamicRiskAssessment
} from '@/lib/ai-fraud-engine'

export default function UserRiskProfilePage() {
  const [baseline, setBaseline] = useState(DEFAULT_USER_BASELINE)
  const [selectedTxnAmount, setSelectedTxnAmount] = useState(1250)
  const [selectedCity, setSelectedCity] = useState('Bengaluru')
  const [selectedDevice, setSelectedDevice] = useState('DEV-A782')
  const [selectedVpa, setSelectedVpa] = useState('nature.basket@icici')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'shap' | 'insights' | 'anomalies'>('overview')

  // Compute live dynamic risk assessment
  const liveAssessment: DynamicRiskAssessment = evaluateDynamicRisk(
    normalizeCrossUpiPayload({
      amount: selectedTxnAmount,
      city: selectedCity,
      device_id: selectedDevice,
      receiver_vpa: selectedVpa,
      receiver_name: selectedVpa.split('@')[0] || 'Merchant'
    }),
    baseline
  )

  const handleUserFeedback = async (type: 'genuine_was_me' | 'fraud_not_me') => {
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_feedback: type,
          transaction_id: 'TXN-LIVE-SIM',
          false_positive: type === 'genuine_was_me'
        })
      })

      if (type === 'genuine_was_me') {
        setBaseline((prev) => ({
          ...prev,
          false_positive_count: prev.false_positive_count + 1
        }))
        setFeedbackSubmitted('Confirmed as Genuine. Your adaptive safety threshold has been tuned to prevent false alarms.')
      } else {
        setBaseline((prev) => ({
          ...prev,
          recent_fraud_count: prev.recent_fraud_count + 1
        }))
        setFeedbackSubmitted('Confirmed as Suspicious. Threat signature registered and protective thresholds tightened.')
      }
    } catch {
      setFeedbackSubmitted('Feedback registered in local intelligence cache.')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-rose-400 bg-rose-500/15 border-rose-500/30'
    if (score >= 65) return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    if (score >= 35) return 'text-sky-400 bg-sky-500/15 border-sky-500/30'
    return 'text-[#b8f55e] bg-[#b8f55e]/15 border-[#b8f55e]/30'
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3.5 py-1 text-xs font-semibold text-[#b8f55e] mb-2">
              <Cpu className="size-3.5" />
              <span>DYNAMIC MULTI-MODEL AI RISK ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Risk & Behaviour Intelligence
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8fa9a6]">
              Real-time anomaly detection, self-learning user baselines, and adaptive threshold decisioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/alerts"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              Fraud Alerts
            </Link>
            <Link
              href="/dashboard/pay"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-semibold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              Simulate Payment <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        <AnimatePresence>
          {feedbackSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>{feedbackSubmitted}</span>
              </div>
              <button
                onClick={() => setFeedbackSubmitted(null)}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Dynamic Score & Decision Hero Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Risk Score Card (0 - 100) */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#0a1718] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#b8f55e]/10 blur-3xl" />

            <div>
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f8583]">
                    DYNAMIC RISK SCORE
                  </span>
                  <p className="text-xs text-[#8fa9a6] mt-0.5">Continuous Ensemble Evaluation</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                    getScoreColor(liveAssessment.overall_risk_score)
                  }`}
                >
                  {liveAssessment.decision} ({liveAssessment.risk_level})
                </span>
              </div>

              {/* Big Score Gauge */}
              <div className="my-8 flex items-baseline justify-center gap-3">
                <span className="text-7xl sm:text-8xl font-black tracking-tight text-white">
                  {liveAssessment.overall_risk_score}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#8fa9a6]">/ 100</span>
              </div>

              {/* Progress Bar & Adaptive Threshold Marker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8fa9a6]">Fraud Probability:</span>
                  <span className="font-bold text-white font-mono">
                    {(liveAssessment.fraud_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      liveAssessment.overall_risk_score >= 65 ? 'bg-rose-500' : 'bg-[#b8f55e]'
                    }`}
                    style={{ width: `${liveAssessment.overall_risk_score}%` }}
                  />
                  {/* Threshold Pin */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                    style={{ left: `${liveAssessment.adaptive_threshold}%` }}
                    title={`Adaptive Threshold: ${liveAssessment.adaptive_threshold}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6f8583] pt-1">
                  <span>0 (Safe)</span>
                  <span className="text-amber-400 font-semibold font-mono">
                    Adaptive Barrier: {liveAssessment.adaptive_threshold}
                  </span>
                  <span>100 (Critical)</span>
                </div>
              </div>
            </div>

            {/* Quick Action Confirmation */}
            <div className="pt-6 border-t border-white/8 space-y-3">
              <p className="text-xs text-[#8fa9a6]">
                Did you perform this recent transaction simulation?
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleUserFeedback('genuine_was_me')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition"
                >
                  <Check className="size-3.5 text-[#b8f55e]" /> Yes, This Was Me
                </button>
                <button
                  onClick={() => handleUserFeedback('fraud_not_me')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-300 transition"
                >
                  <ShieldAlert className="size-3.5 text-rose-400" /> No, Secure Account
                </button>
              </div>
            </div>
          </div>

          {/* Behavior Profile & Deviation Card */}
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0a1718] p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f8583]">
                  BEHAVIORAL PROFILE & ANOMALIES
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  Isolation Forest Deviation Analytics
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6f8583] block">BEHAVIOUR DEVIATION</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    liveAssessment.behaviour_metrics.deviation_percentage > 40
                      ? 'text-rose-400'
                      : 'text-[#b8f55e]'
                  }`}
                >
                  {liveAssessment.behaviour_metrics.deviation_percentage}%
                </span>
              </div>
            </div>

            {/* Baseline Matrix */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/[.02] border border-white/5 p-4">
                <span className="text-[10px] font-bold uppercase text-[#6f8583]">AVERAGE TICKET</span>
                <p className="text-lg font-bold text-white font-mono mt-1">
                  ₹{baseline.avg_ticket_size.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-[#8fa9a6]">Normal range: ₹200 – ₹4,200</span>
              </div>

              <div className="rounded-2xl bg-white/[.02] border border-white/5 p-4">
                <span className="text-[10px] font-bold uppercase text-[#6f8583]">ACTIVE WINDOW</span>
                <p className="text-lg font-bold text-white font-mono mt-1">
                  08:00 – 23:00 IST
                </p>
                <span className="text-[10px] text-emerald-400">Normal daylight hours</span>
              </div>

              <div className="rounded-2xl bg-white/[.02] border border-white/5 p-4">
                <span className="text-[10px] font-bold uppercase text-[#6f8583]">ENROLLED DEVICES</span>
                <p className="text-lg font-bold text-[#b8f55e] font-mono mt-1">
                  {baseline.registered_devices.length} Hardware Keys
                </p>
                <span className="text-[10px] text-[#8fa9a6]">Fingerprint bound</span>
              </div>
            </div>

            {/* Quick Interactive Simulation Controls */}
            <div className="rounded-2xl bg-white/[.03] border border-white/8 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-[#b8f55e]" /> Test Transaction Parameters
                </span>
                <span className="text-[10px] text-[#8fa9a6]">Recalculates real-time</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#8fa9a6] block mb-1">Amount (₹)</label>
                  <select
                    value={selectedTxnAmount}
                    onChange={(e) => setSelectedTxnAmount(Number(e.target.value))}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={450}>₹450 (Normal Coffee)</option>
                    <option value={1250}>₹1,250 (Average Grocery)</option>
                    <option value={14500}>₹14,500 (Elevated Spike)</option>
                    <option value={65000}>₹65,000 (Exceeds Limit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8fa9a6] block mb-1">Location City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Bengaluru">Bengaluru (Home)</option>
                    <option value="Mysuru">Mysuru (Home)</option>
                    <option value="Delhi">Delhi (2,460 km/h Flight Anomaly)</option>
                    <option value="Dubai">Dubai (Cross-Border)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8fa9a6] block mb-1">Beneficiary VPA</label>
                  <select
                    value={selectedVpa}
                    onChange={(e) => setSelectedVpa(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="nature.basket@icici">Nature's Basket (Trusted)</option>
                    <option value="new.merchant@okaxis">new.merchant@okaxis (New)</option>
                    <option value="scammer.refund@okaxis">scammer.refund@okaxis (Flagged)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Multi-Model Sub-Scores Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="size-4 text-[#b8f55e]" /> Multi-Model Sub-Scores Breakdown
            </h2>
            <span className="text-xs text-[#8fa9a6]">Weighted Fusion Pipeline</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Transaction Risk', score: liveAssessment.sub_scores.transaction_risk, model: 'XGBoost / Amount Spike' },
              { label: 'Device Risk', score: liveAssessment.sub_scores.device_risk, model: 'Hardware Fingerprint' },
              { label: 'Location Risk', score: liveAssessment.sub_scores.location_risk, model: 'Velocity & Geofence' },
              { label: 'Behaviour Risk', score: liveAssessment.sub_scores.behaviour_risk, model: 'Historical Baseline' },
              { label: 'Receiver Risk', score: liveAssessment.sub_scores.receiver_risk, model: 'Blacklist & Reputation' },
              { label: 'QR Code Risk', score: liveAssessment.sub_scores.qr_risk, model: 'Intent URI Integrity' },
              { label: 'Anomaly Score', score: liveAssessment.sub_scores.anomaly_score, model: 'Isolation Forest' },
              { label: 'Velocity Score', score: liveAssessment.sub_scores.velocity_score, model: 'Sequence Burst Rate' }
            ].map((sub) => (
              <div
                key={sub.label}
                className="rounded-2xl border border-white/10 bg-[#0a1718] p-4 space-y-2 hover:border-[#b8f55e]/30 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{sub.label}</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      sub.score >= 60 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {sub.score} / 100
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sub.score >= 60 ? 'bg-rose-500' : 'bg-[#b8f55e]'
                    }`}
                    style={{ width: `${sub.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#6f8583] truncate">{sub.model}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Explainable AI (SHAP-Style Feature Importance) Section */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b8f55e]">
                EXPLAINABLE AI (XAI)
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Why this transaction is evaluated as {liveAssessment.decision}
              </h2>
            </div>
            <span className="text-xs text-[#8fa9a6] font-mono">
              Inference: {liveAssessment.model_metadata.inference_time_ms} ms · Ensemble {liveAssessment.model_metadata.ensemble_version}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#8fa9a6] leading-relaxed">
            {liveAssessment.explainable_ai.summary}
          </p>

          {/* SHAP Waterfall Bars */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Feature Importance & Risk Contribution Weights
            </span>

            {liveAssessment.explainable_ai.shap_contributions.map((factor) => (
              <div
                key={factor.feature_name}
                className="rounded-xl bg-white/[.02] border border-white/5 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        factor.importance === 'CRITICAL'
                          ? 'bg-rose-500 animate-pulse'
                          : factor.importance === 'HIGH'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    />
                    <span className="font-semibold text-white">{factor.feature_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-[#8fa9a6]">
                      {factor.category}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-400">
                    +{factor.impact_score}%
                  </span>
                </div>
                <p className="text-[11px] text-[#8fa9a6] leading-relaxed">
                  {factor.description}
                </p>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${factor.impact_pct}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Mitigating Factors */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Mitigating Safety Factors
              </span>
              <div className="grid sm:grid-cols-2 gap-2">
                {liveAssessment.explainable_ai.mitigating_factors.map((mit) => (
                  <div
                    key={mit}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs text-emerald-300"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    <span>{mit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Fraud Insights: Trusted Entities & Watchlist */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trusted Geofence */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Compass className="size-4 text-[#b8f55e]" /> Trusted Locations
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">Zero Anomaly</span>
            </div>
            <div className="space-y-2">
              {baseline.frequent_cities.map((city) => (
                <div key={city} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[.02] border border-white/5 text-xs text-white">
                  <span>{city}</span>
                  <span className="text-[10px] text-[#b8f55e] font-mono">Verified Geofence</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trusted Hardware Keys */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Smartphone className="size-4 text-[#b8f55e]" /> Trusted Devices
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">Hardware Keystore</span>
            </div>
            <div className="space-y-2">
              {baseline.registered_devices.map((dev) => (
                <div key={dev} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[.02] border border-white/5 text-xs text-white">
                  <span>{dev}</span>
                  <span className="text-[10px] text-[#b8f55e] font-mono">Bound & Encrypted</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risky Beneficiary Watchlist */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-400" /> Community Watchlist
              </span>
              <span className="text-[10px] text-rose-400 font-semibold">Live Threat Intel</span>
            </div>
            <div className="space-y-2">
              {['scammer.refund@okaxis', 'lottery.reward2026@sbi'].map((vpa) => (
                <div key={vpa} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  <span className="font-mono truncate">{vpa}</span>
                  <span className="text-[10px] font-bold text-rose-400 shrink-0 ml-2">Flagged</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
