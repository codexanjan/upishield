'use client'

import { useState, useEffect } from 'react'
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
  History as HistoryIcon,
  Layers,
  Zap,
  Info,
  SlidersHorizontal,
  BarChart3,
  FileCode,
  ThumbsUp,
  ThumbsDown,
  ChevronRight
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import {
  evaluateDynamicRisk,
  normalizeCrossUpiPayload,
  DEFAULT_USER_BASELINE,
  calculateAdaptiveThreshold,
  getDetailedRiskCategory,
  DynamicRiskAssessment
} from '@/lib/ai-fraud-engine'

export default function UserRiskProfilePage() {
  const [baseline, setBaseline] = useState(DEFAULT_USER_BASELINE)
  const [selectedTxnAmount, setSelectedTxnAmount] = useState(18500)
  const [selectedCity, setSelectedCity] = useState('Delhi')
  const [selectedDevice, setSelectedDevice] = useState('DEV-NEW-88')
  const [selectedVpa, setSelectedVpa] = useState('new.merchant@okaxis')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'xai' | 'breakdown' | 'behaviour' | 'history' | 'threshold'>('overview')

  // Check URL query parameters on load (e.g. ?tab=xai)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam && ['overview', 'xai', 'breakdown', 'behaviour', 'history', 'threshold'].includes(tabParam)) {
        setActiveTab(tabParam as any)
      }
    }
  }, [])

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

  const categoryInfo = getDetailedRiskCategory(liveAssessment.overall_risk_score)

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
        setFeedbackSubmitted('Confirmed as Genuine. Your adaptive safety threshold has been tuned to prevent false alarms (+2.5 pts bonus).')
      } else {
        setBaseline((prev) => ({
          ...prev,
          recent_fraud_count: prev.recent_fraud_count + 1
        }))
        setFeedbackSubmitted('Confirmed as Suspicious. Threat signature registered and protective thresholds tightened (-5.0 pts).')
      }
    } catch {
      setFeedbackSubmitted('Feedback registered in local intelligence cache.')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 81) return 'text-rose-400 bg-rose-500/15 border-rose-500/30'
    if (score >= 61) return 'text-orange-400 bg-orange-500/15 border-orange-500/30'
    if (score >= 31) return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    return 'text-[#b8f55e] bg-[#b8f55e]/15 border-[#b8f55e]/30'
  }

  // Phase 4 & Feature 1: Exact 7-component formula weights
  // Total = 100 pts: ML 25%, Anomaly 20%, Behaviour 20%, Device 10%, Location 10%, Velocity 10%, Beneficiary 5%
  const fraudModelPts = Math.min(25, Math.round(liveAssessment.sub_scores.transaction_risk * 0.25))
  const anomalyPts = Math.min(20, Math.round(liveAssessment.sub_scores.anomaly_score * 0.20))
  const behaviourPts = Math.min(20, Math.round(liveAssessment.sub_scores.behaviour_risk * 0.20))
  const devicePts = Math.min(10, Math.round(liveAssessment.sub_scores.device_risk * 0.10))
  const locationPts = Math.min(10, Math.round(liveAssessment.sub_scores.location_risk * 0.10))
  const velocityPts = Math.min(10, Math.round(liveAssessment.sub_scores.velocity_score * 0.10))
  const beneficiaryPts = Math.min(5, Math.round(liveAssessment.sub_scores.receiver_risk * 0.05))

  // Feature 5: Dynamically synthesized Natural-Language explanation
  const isHighOrMedium = liveAssessment.overall_risk_score >= 35
  const isCarOrLargeSpike = selectedTxnAmount >= 50000

  const dynamicNaturalLanguageExplanation = isHighOrMedium
    ? `This payment received an ${categoryInfo.subLevel.toUpperCase()} score (${liveAssessment.overall_risk_score}/100) because its amount (₹${selectedTxnAmount.toLocaleString('en-IN')}) is ${(selectedTxnAmount / baseline.avg_ticket_size).toFixed(1)}× higher than your historical baseline (₹${baseline.avg_ticket_size}), it was initiated from a device (${selectedDevice}) not previously registered on your account, and the beneficiary (${selectedVpa}) has no verified trust history. Your current location (${selectedCity}) is also outside your usual payment geofence. However, no prior global chargebacks were registered against this target.`
    : `This transaction received a LOW RISK score (${liveAssessment.overall_risk_score}/100, Trusted) because the transaction amount (₹${selectedTxnAmount.toLocaleString('en-IN')}) is within your normal historical spending range (₹200–₹4,200), initiated from your enrolled device (${selectedDevice}) inside your primary verified geofence (${selectedCity}) during normal active hours (08:00–23:00 IST).`

  return (
    <UserLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3.5 py-1 text-xs font-semibold text-[#b8f55e] mb-2">
              <Cpu className="size-3.5" />
              <span>DYNAMIC MULTI-MODEL AI RISK & EXPLAINABILITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Risk & Explainability Engine
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8fa9a6]">
              Feature-level SHAP attributions, behavioral baseline deviations, and adaptive decision transparency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/pay"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#09110f] hover:bg-[#c9f97f] transition shadow-lg shadow-[#b8f55e]/20"
            >
              Simulate Payment & AI Scan <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation (User requested: Risk Overview, Explainable AI, Risk Breakdown, Behaviour Profile, Risk History, Adaptive Threshold) */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-3">
          {[
            { id: 'overview', label: 'Risk Overview', icon: Activity },
            { id: 'xai', label: 'Explainable AI (XAI)', icon: Sparkles },
            { id: 'breakdown', label: 'Risk Breakdown', icon: Layers },
            { id: 'behaviour', label: 'Behaviour Profile', icon: Compass },
            { id: 'history', label: 'Risk History', icon: HistoryIcon },
            { id: 'threshold', label: 'Adaptive Threshold', icon: SlidersHorizontal }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#b8f55e] text-[#071014] font-bold shadow-md shadow-[#b8f55e]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
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
                className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* TAB 1: RISK OVERVIEW (HERO + XAI CARD DIRECTLY BELOW)    */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary Dynamic Score & Simulation Hero */}
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
                      {categoryInfo.recommendedAction} ({categoryInfo.subLevel})
                    </span>
                  </div>

                  {/* Big Score Gauge */}
                  <div className="my-8 flex items-baseline justify-center gap-3">
                    <span className={`text-7xl sm:text-8xl font-black tracking-tight font-mono ${
                      liveAssessment.overall_risk_score >= 61 ? 'text-rose-400' : liveAssessment.overall_risk_score >= 31 ? 'text-amber-400' : 'text-[#b8f55e]'
                    }`}>
                      {liveAssessment.overall_risk_score}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#8fa9a6]">/ 100</span>
                  </div>

                  {/* Progress Bar & Adaptive Threshold Marker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8fa9a6]">Fraud Probability (XGBoost):</span>
                      <span className="font-bold text-white font-mono">
                        {(liveAssessment.fraud_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          liveAssessment.overall_risk_score >= 61 ? 'bg-rose-500' : liveAssessment.overall_risk_score >= 31 ? 'bg-amber-400' : 'bg-[#b8f55e]'
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
                    <div className="flex items-center justify-between text-[11px] text-[#6f8583] pt-1 font-mono">
                      <span>0 (Safe)</span>
                      <span className="text-amber-400 font-semibold">
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
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      <Check className="size-3.5 text-[#b8f55e]" /> Yes, This Was Me
                    </button>
                    <button
                      onClick={() => handleUserFeedback('fraud_not_me')}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-300 transition cursor-pointer"
                    >
                      <ShieldAlert className="size-3.5 text-rose-400" /> No, Secure Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Behavior Simulation Controls & Baseline Matrix */}
              <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0a1718] p-6 sm:p-7 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/8 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f8583]">
                        BEHAVIORAL PROFILE & SIMULATION
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        Isolation Forest & Deviation Analytics
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
                  <div className="grid sm:grid-cols-3 gap-3 my-4">
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
                      <span className="text-[10px] text-[#8fa9a6]">DEV-A782, DEV-MAC-B88</span>
                    </div>
                  </div>
                </div>

                {/* Simulation Controls */}
                <div className="rounded-2xl bg-white/[.03] border border-white/8 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-[#b8f55e]" /> Live Simulation Controls
                    </span>
                    <span className="text-[10px] text-[#8fa9a6]">Change values to recalculate XAI live</span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-[#8fa9a6] block mb-1">Amount (₹)</label>
                      <select
                        value={selectedTxnAmount}
                        onChange={(e) => setSelectedTxnAmount(Number(e.target.value))}
                        className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value={850}>₹850 (Normal Grocery)</option>
                        <option value={1450}>₹1,450 (Baseline Average)</option>
                        <option value={18500}>₹18,500 (Elevated Spike)</option>
                        <option value={200000}>₹2,00,000 (Vehicle Advance)</option>
                        <option value={850000}>₹8,50,000 (Car Purchase - ABC Motors)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8fa9a6] block mb-1">City / Location</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="Hubballi">Hubballi (Home Geofence)</option>
                        <option value="Bengaluru">Bengaluru (Verified Cluster)</option>
                        <option value="Mysuru">Mysuru (Frequent City)</option>
                        <option value="Mumbai">Mumbai (Velocity Anomaly / Untrusted)</option>
                        <option value="Dubai">Dubai (Cross-Border Alert)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8fa9a6] block mb-1">Device & VPA</label>
                      <select
                        value={`${selectedDevice}|${selectedVpa}`}
                        onChange={(e) => {
                          const [d, v] = e.target.value.split('|')
                          setSelectedDevice(d)
                          setSelectedVpa(v)
                        }}
                        className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="DEV-A782|abcmotors@upiguard">DEV-A782 · ABC Motors (Known)</option>
                        <option value="DEV-A782|nature.basket@icici">DEV-A782 · Trusted Merchant</option>
                        <option value="DEV-NEW-88|new.merchant@okaxis">New Device · First-Time VPA</option>
                        <option value="DEV-EMU-X99|scammer.refund@okaxis">Emulator · Flagged Scam VPA</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 11: MAJOR PURCHASE BEHAVIOR CARD */}
                {selectedTxnAmount >= 200000 && (
                  <div className="rounded-2xl bg-amber-400/[0.06] border border-amber-400/30 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-400/20 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Activity className="size-4" /> MAJOR PURCHASE BEHAVIOR
                      </span>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                        Behavioral Impact: HIGH
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400">Largest Purchase</span>
                        <div className="text-base font-black text-white">₹8,50,000</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Previous Largest</span>
                        <div className="text-base font-black text-slate-300">₹1,20,000</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Amount Deviation</span>
                        <div className="text-base font-black text-amber-300">+608%</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Merchant Familiarity</span>
                        <div className="text-base font-black text-white">New (ABC Motors)</div>
                      </div>
                    </div>

                    <p className="text-xs text-amber-200/90 italic pt-1 border-t border-amber-400/10">
                      &ldquo;This transaction is significantly larger than the user&apos;s historical transaction pattern. Additional authentication (Face/PIN + OTP) is required.&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* USER REQUESTED: DEDICATED EXPLAINABLE AI (XAI) SECTION   */}
            {/* DIRECTLY BELOW THE RISK SCORE ON /dashboard/risk-profile */}
            {/* ======================================================== */}
            <div className="rounded-3xl border border-[#b8f55e]/30 bg-[#0a1718] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-[#b8f55e]/5 blur-3xl" />

              {/* XAI Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30 flex items-center gap-1.5">
                      <Sparkles className="size-3" />
                      EXPLAINABLE AI (XAI)
                    </span>
                    <span className="text-xs text-white/50">Feature Attributions &amp; Decision Transparency</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Why did AI assign this risk score?</h2>
                </div>
                <button
                  onClick={() => setActiveTab('xai')}
                  className="text-xs font-semibold text-[#b8f55e] hover:underline flex items-center gap-1"
                >
                  Open Full XAI Matrix <ArrowRight className="size-3.5" />
                </button>
              </div>

              {/* Top Summary Table (Exact user UI mockup) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Overall Risk Score</span>
                  <span className={`text-xl font-mono font-bold ${
                    liveAssessment.overall_risk_score >= 61 ? 'text-rose-400' : liveAssessment.overall_risk_score >= 31 ? 'text-amber-400' : 'text-[#b8f55e]'
                  }`}>
                    {liveAssessment.overall_risk_score} / 100
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Risk Level</span>
                  <span className={`text-xl font-bold uppercase ${
                    liveAssessment.risk_level === 'CRITICAL' ? 'text-rose-400' : liveAssessment.risk_level === 'HIGH' ? 'text-orange-400' : liveAssessment.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-[#b8f55e]'
                  }`}>
                    {categoryInfo.subLevel}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Fraud Probability</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {(liveAssessment.fraud_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Adaptive Threshold</span>
                  <span className="text-xl font-mono font-bold text-[#b8f55e]">
                    {liveAssessment.adaptive_threshold}
                  </span>
                </div>
              </div>

              {/* Factors Grid: TOP RISK FACTORS vs TRUST SIGNALS */}
              <div className="grid md:grid-cols-2 gap-5 pt-2">
                {/* Top Risk Factors (+pts) */}
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-500/10 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="size-4" />
                      TOP RISK FACTORS
                    </span>
                    <span className="text-[10px] text-white/50">Adds risk points</span>
                  </div>

                  {isHighOrMedium ? (
                    <div className="space-y-2.5 text-xs">
                      {liveAssessment.behaviour_metrics.is_unusual_amount && (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Unusual Transaction Amount (₹{selectedTxnAmount})
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{fraudModelPts} pts</span>
                        </div>
                      )}
                      {liveAssessment.behaviour_metrics.deviation_percentage > 20 && (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Behaviour Deviation ({liveAssessment.behaviour_metrics.deviation_percentage}%)
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{behaviourPts} pts</span>
                        </div>
                      )}
                      {selectedDevice !== 'DEV-A782' && (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Unrecognized Hardware Signature
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{devicePts} pts</span>
                        </div>
                      )}
                      {selectedCity !== 'Bengaluru' && selectedCity !== 'Mysuru' && (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Unusual Geographic Location ({selectedCity})
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{locationPts} pts</span>
                        </div>
                      )}
                      {selectedVpa.includes('new') || selectedVpa.includes('scam') ? (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            New / Unverified Beneficiary Encounter
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{beneficiaryPts} pts</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-white/50">
                      Zero high-risk features detected. Transaction conforms to normal profile.
                    </div>
                  )}
                </div>

                {/* Trust Signals (-pts) */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="size-4" />
                      TRUST SIGNALS
                    </span>
                    <span className="text-[10px] text-white/50">Mitigates risk score</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-white/90">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-400 shrink-0" />
                        Device Keystore &amp; Fingerprint Verified
                      </span>
                      <span className="font-mono font-bold text-emerald-400">-3 pts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-400 shrink-0" />
                        No Previous Fraud Reports Against User
                      </span>
                      <span className="font-mono font-bold text-emerald-400">-2 pts</span>
                    </div>
                    {selectedCity === 'Bengaluru' && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          Authenticated Within Primary Geofence
                        </span>
                        <span className="font-mono font-bold text-emerald-400">-4 pts</span>
                      </div>
                    )}
                    {selectedVpa === 'nature.basket@icici' && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          Verified Merchant With Zero Dispute Velocity
                        </span>
                        <span className="font-mono font-bold text-emerald-400">-5 pts</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-400 shrink-0" />
                        Nominal Daily Velocity Rate (4.2 txns/day)
                      </span>
                      <span className="font-mono font-bold text-emerald-400">-2 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Natural-Language AI Explanation Box (Feature 5) */}
              <div className="p-4 rounded-2xl bg-[#071014] border border-white/10 space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#b8f55e] flex items-center gap-1.5">
                  <Cpu className="size-3.5" />
                  AI EXPLANATION (NATURAL LANGUAGE SYNTHESIS)
                </span>
                <p className="text-xs text-white/90 leading-relaxed font-sans">
                  {dynamicNaturalLanguageExplanation}
                </p>
              </div>

              {/* Recommended Action Footer */}
              <div className="p-4 rounded-2xl bg-white/[.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-white/50 block text-[10px] uppercase">Recommended Action</span>
                  <span className="text-sm font-bold text-white">
                    {categoryInfo.recommendedAction === 'BLOCK PAYMENT'
                      ? 'Immediate Block & Quarantine Entity'
                      : categoryInfo.recommendedAction === 'HOLD / VERIFY'
                      ? 'Hold Transfer For Biometric User Verification'
                      : categoryInfo.recommendedAction === 'VERIFY USER'
                      ? 'Step-Up Verification Challenge'
                      : 'Approve Instantly with Nominal Friction'}
                  </span>
                </div>
                <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center ${categoryInfo.badgeColor}`}>
                  {categoryInfo.recommendedAction}
                </span>
              </div>
            </div>

            {/* Quick 8 Sub-Scores Grid */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="size-4 text-[#b8f55e]" /> Multi-Model Sub-Scores Breakdown
                </h3>
                <span className="text-xs text-white/50">Weighted Fusion Engine</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  { label: 'Transaction Risk', score: liveAssessment.sub_scores.transaction_risk, model: 'XGBoost Supervised' },
                  { label: 'Device Risk', score: liveAssessment.sub_scores.device_risk, model: 'Hardware Fingerprint' },
                  { label: 'Location Risk', score: liveAssessment.sub_scores.location_risk, model: 'Velocity & Geofence' },
                  { label: 'Behaviour Risk', score: liveAssessment.sub_scores.behaviour_risk, model: 'Baseline Deviation' },
                  { label: 'Receiver Risk', score: liveAssessment.sub_scores.receiver_risk, model: 'VPA Reputation' },
                  { label: 'QR Code Risk', score: liveAssessment.sub_scores.qr_risk, model: 'Bharat QR Entropy' },
                  { label: 'Anomaly Score', score: liveAssessment.sub_scores.anomaly_score, model: 'Isolation Forest' },
                  { label: 'Velocity Score', score: liveAssessment.sub_scores.velocity_score, model: 'Sequence Burst Rate' }
                ].map((sub) => (
                  <div key={sub.label} className="rounded-2xl border border-white/10 bg-[#0a1718] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{sub.label}</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        sub.score >= 60 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {sub.score}/100
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
                    <p className="text-[10px] text-white/50">{sub.model}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EXPLAINABLE AI (XAI) DEEP-DIVE (ALL 5 FEATURES)   */}
        {/* ======================================================== */}
        {activeTab === 'xai' && (
          <div className="space-y-6">
            {/* Feature 4: Separate ML Explanation from Overall Risk Score Explanation */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card A: Supervised ML Model Explanation (Why ML predicted fraud) */}
              <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      MODEL 1: SUPERVISED XGBOOST
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">ML Fraud Probability Attributions</h3>
                  </div>
                  <span className="text-2xl font-mono font-bold text-sky-400">
                    {(liveAssessment.fraud_probability * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-white/60">
                  Explains specifically <em>why the machine learning model predicted fraud</em> using SHAP feature gradients independent of heuristic rules.
                </p>

                {/* Feature 3: SHAP Feature Impact Bars */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                    Factors Increasing Fraud Probability
                  </span>

                  {[
                    { name: 'Transaction Amount Spike', impact: selectedTxnAmount >= 14500 ? '+28%' : '+8%', width: selectedTxnAmount >= 14500 ? '78%' : '25%' },
                    { name: 'New Hardware Device Signature', impact: selectedDevice !== 'DEV-A782' ? '+22%' : '+4%', width: selectedDevice !== 'DEV-A782' ? '65%' : '15%' },
                    { name: 'Geographic Location Change', impact: selectedCity !== 'Bengaluru' ? '+18%' : '+3%', width: selectedCity !== 'Bengaluru' ? '55%' : '12%' },
                    { name: 'Unverified / First-Time Beneficiary', impact: selectedVpa.includes('new') || selectedVpa.includes('scam') ? '+15%' : '+2%', width: selectedVpa.includes('new') || selectedVpa.includes('scam') ? '45%' : '10%' }
                  ].map(f => (
                    <div key={f.name} className="space-y-1 text-xs">
                      <div className="flex justify-between text-white/80">
                        <span>{f.name}</span>
                        <span className="font-mono text-rose-400 font-bold">{f.impact}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: f.width }} />
                      </div>
                    </div>
                  ))}

                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block pt-3">
                    Factors Reducing Fraud Probability
                  </span>
                  {[
                    { name: 'Enrolled IP & Device Keystore', impact: '-9%', width: '30%' },
                    { name: 'Normal Historical Transaction Velocity', impact: '-8%', width: '26%' }
                  ].map(f => (
                    <div key={f.name} className="space-y-1 text-xs">
                      <div className="flex justify-between text-white/80">
                        <span>{f.name}</span>
                        <span className="font-mono text-emerald-400 font-bold">{f.impact}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: f.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Risk Engine Explanation (Why the final 0–100 score was produced) */}
              <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#b8f55e] uppercase tracking-wider block">
                      RISK ENGINE: MULTI-MODEL FUSION
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">Final Risk Score Contributions</h3>
                  </div>
                  <span className={`text-2xl font-mono font-bold ${
                    liveAssessment.overall_risk_score >= 61 ? 'text-rose-400' : liveAssessment.overall_risk_score >= 31 ? 'text-amber-400' : 'text-[#b8f55e]'
                  }`}>
                    {liveAssessment.overall_risk_score} / 100
                  </span>
                </div>

                <p className="text-xs text-white/60">
                  Explains <em>why the final 0–100 composite score was produced</em> by blending ML probabilities with behavioral, device, and isolation forest anomaly models.
                </p>

                {/* Feature 1: Exact weighted breakdown formula */}
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Fraud Model (XGBoost)</span>
                      <span className="text-[10px] text-white/40">25% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{fraudModelPts} / 25</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Anomaly Detection (Isolation Forest)</span>
                      <span className="text-[10px] text-white/40">20% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{anomalyPts} / 20</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Behaviour Deviation Risk</span>
                      <span className="text-[10px] text-white/40">20% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{behaviourPts} / 20</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Device Hardware Integrity</span>
                      <span className="text-[10px] text-white/40">10% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{devicePts} / 10</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Location Velocity &amp; Geofence</span>
                      <span className="text-[10px] text-white/40">10% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{locationPts} / 10</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Transaction Amount Spike</span>
                      <span className="text-[10px] text-white/40">10% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{velocityPts} / 10</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Beneficiary / VPA Reputation</span>
                      <span className="text-[10px] text-white/40">5% maximum weight</span>
                    </div>
                    <span className="font-mono font-bold text-white">{beneficiaryPts} / 5</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between font-bold text-white">
                    <span>Total Composite Score:</span>
                    <span className="font-mono text-[#b8f55e] text-sm">
                      {liveAssessment.overall_risk_score} / 100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: “Why this score?” Card */}
            <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <HelpCircle className="size-4 text-[#b8f55e]" />
                  Why This Score? (Comprehensive Explanation)
                </h3>
                <span className="text-xs text-white/50 font-mono">Dynamic Rule + AI Synthesis</span>
              </div>

              {isHighOrMedium ? (
                <div className="space-y-3 text-xs">
                  <div className="space-y-1.5 text-amber-200">
                    <p className="flex items-center gap-2 text-rose-400 font-semibold">
                      <AlertTriangle className="size-3.5" /> Amount is {(selectedTxnAmount / baseline.avg_ticket_size).toFixed(1)}× higher than normal baseline (₹{baseline.avg_ticket_size})
                    </p>
                    <p className="flex items-center gap-2 text-rose-400 font-semibold">
                      <AlertTriangle className="size-3.5" /> First transaction to beneficiary {selectedVpa}
                    </p>
                    <p className="flex items-center gap-2 text-rose-400 font-semibold">
                      <AlertTriangle className="size-3.5" /> New device detected ({selectedDevice})
                    </p>
                    <p className="flex items-center gap-2 text-rose-400 font-semibold">
                      <AlertTriangle className="size-3.5" /> Transaction location is outside frequent home geofence ({selectedCity})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1 text-emerald-300">
                    <p className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400" /> No fraud reports registered against beneficiary VPA
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400" /> Transaction velocity is nominal with zero burst rate
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-emerald-300">
                  <p className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-2">
                    Why Low Risk? (Trusted Activity)
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Amount (₹{selectedTxnAmount}) is within your normal ₹200–₹4,200 spending range
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Payment originated from your usual location (Bengaluru Home Geofence)
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Beneficiary is trusted with established payment frequency
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Current device is recognized (DEV-A782 Hardware Key)
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Transaction occurred during normal daylight active hours (08:00 - 23:00)
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> No abnormal transaction velocity detected
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RISK BREAKDOWN & WEIGHT FORMULAS                  */}
        {/* ======================================================== */}
        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-4">
              <h3 className="text-base font-bold text-white">Multi-Model Weighted Fusion Formula</h3>
              <p className="text-xs text-white/60">
                How UPI Shield AI combines supervised classification, unsupervised anomaly detection, and real-time context:
              </p>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs text-white/90 space-y-1">
                <div>Composite Risk Score =</div>
                <div className="text-[#b8f55e] pl-4">0.25 × ML Prediction (XGBoost)</div>
                <div className="text-[#b8f55e] pl-4">+ 0.20 × Anomaly Risk (Isolation Forest)</div>
                <div className="text-[#b8f55e] pl-4">+ 0.20 × Behaviour Deviation Risk</div>
                <div className="text-[#b8f55e] pl-4">+ 0.10 × Device Hardware Integrity</div>
                <div className="text-[#b8f55e] pl-4">+ 0.10 × Location Velocity / Geofence</div>
                <div className="text-[#b8f55e] pl-4">+ 0.10 × Transaction Amount Spike</div>
                <div className="text-[#b8f55e] pl-4">+ 0.05 × Beneficiary VPA Reputation</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: BEHAVIOUR PROFILE & BASELINE                      */}
        {/* ======================================================== */}
        {activeTab === 'behaviour' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-3">
                <span className="text-xs uppercase text-white/50 tracking-wider">Ticket Size Distribution</span>
                <div className="space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Average Ticket</span>
                    <span className="font-mono font-bold text-white">₹1,450</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Median Ticket</span>
                    <span className="font-mono font-bold text-white">₹900</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Normal Range</span>
                    <span className="font-mono text-[#b8f55e]">₹300 – ₹5,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Max Historic Spend</span>
                    <span className="font-mono text-white">₹25,000</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-3">
                <span className="text-xs uppercase text-white/50 tracking-wider">Temporal &amp; Velocity Cadence</span>
                <div className="space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Active Hours</span>
                    <span className="font-mono font-bold text-white">08:00 – 23:00 IST</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Transactions / Day</span>
                    <span className="font-mono font-bold text-[#b8f55e]">4.2 avg</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Off-Hours Tolerance</span>
                    <span className="font-mono text-amber-400">Step-Up Prompt</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-3">
                <span className="text-xs uppercase text-white/50 tracking-wider">Geographic Footprint</span>
                <div className="space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Primary Home City</span>
                    <span className="font-bold text-white">Bengaluru (84%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Secondary City</span>
                    <span className="font-bold text-white">Mysuru (12%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Max Ground Speed</span>
                    <span className="font-mono text-[#b8f55e]">&lt;120 km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: RISK HISTORY & 30-DAY TRENDS                      */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-4">
            <h3 className="text-base font-bold text-white">30-Day Risk Score History &amp; Anomalies</h3>
            <p className="text-xs text-white/60">
              Audit log of all evaluated transactions with model inference scores:
            </p>

            <div className="space-y-2 pt-2">
              {[
                { id: 'TXN-9021', date: 'Today, 10:20 AM', amount: '₹850', receiver: 'nature.basket@icici', score: 12, level: 'Trusted', status: 'ALLOW' },
                { id: 'TXN-8984', date: 'Yesterday, 04:15 PM', amount: '₹2,400', receiver: 'coffee.day@hdfc', score: 18, level: 'Low Risk', status: 'ALLOW' },
                { id: 'TXN-8820', date: '3 days ago', amount: '₹18,500', receiver: 'electronic.city@axis', score: 64, level: 'Elevated Risk', status: 'VERIFIED_BY_USER' },
                { id: 'TXN-8712', date: '5 days ago', amount: '₹48,500', receiver: 'scammer.refund@okaxis', score: 96, level: 'Critical', status: 'BLOCKED' }
              ].map(item => (
                <div key={item.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[.02] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{item.id}</span>
                    <span className="text-white/40 ml-2">· {item.date}</span>
                    <p className="text-white/60 mt-0.5">{item.receiver} ({item.amount})</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${
                      item.score >= 61 ? 'text-rose-400' : item.score >= 31 ? 'text-amber-400' : 'text-[#b8f55e]'
                    }`}>
                      {item.score}/100
                    </span>
                    <span className="text-[10px] text-white/50 block">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: ADAPTIVE THRESHOLD ENGINE                         */}
        {/* ======================================================== */}
        {activeTab === 'threshold' && (
          <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-4">
            <h3 className="text-base font-bold text-white">Your Personal Adaptive Threshold: {liveAssessment.adaptive_threshold} / 100</h3>
            <p className="text-xs text-white/60">
              Unlike static rules that block at an arbitrary number, your threshold automatically adapts to your confirmed transactions:
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                <span className="text-white/50">Base Threshold</span>
                <span className="text-2xl font-mono font-bold text-white block">70.0</span>
                <span className="text-[10px] text-white/40">Global baseline</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-emerald-400">False-Positive Bonus</span>
                <span className="text-2xl font-mono font-bold text-emerald-400 block">+{baseline.false_positive_count * 2.5} pts</span>
                <span className="text-[10px] text-emerald-300/80">{baseline.false_positive_count} confirmed genuine payments</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="text-rose-400">Recent Fraud Tightening</span>
                <span className="text-2xl font-mono font-bold text-rose-400 block">-{baseline.recent_fraud_count * 5.0} pts</span>
                <span className="text-[10px] text-rose-300/80">{baseline.recent_fraud_count} confirmed fraud incidents</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
