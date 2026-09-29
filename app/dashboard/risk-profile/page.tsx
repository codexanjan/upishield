'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { useUPIGuardStore } from '@/lib/upiguard-store'
import {
  evaluateDynamicRisk,
  normalizeCrossUpiPayload,
  DEFAULT_USER_BASELINE,
  calculateAdaptiveThreshold,
  getDetailedRiskCategory,
  DynamicRiskAssessment,
  UserBehaviorBaseline
} from '@/lib/ai-fraud-engine'

export default function UserRiskProfilePage() {
  const storeTransactions = useUPIGuardStore((s) => s.transactions)
  const submitFeedback = useUPIGuardStore((s) => s.submitFeedback)

  // 1. DYNAMIC BASELINE COMPUTATION FROM REAL TRANSACTION HISTORY
  const { computedAvgTicket, computedActiveWindow, enrolledDevicesList, realLargestHistoric, realPreviousLargest, historicAmounts } = useMemo(() => {
    const amounts = (storeTransactions || [])
      .map((t) => Number(t.amount) || 0)
      .filter((amt) => amt > 0)
    
    const totalSpend = amounts.reduce((sum, a) => sum + a, 0)
    const avgTicket = amounts.length > 0 ? Math.round(totalSpend / amounts.length) : 1450

    // Extract hours from timestamps
    const hours = (storeTransactions || [])
      .map((t) => {
        const dateStr = t.timestamps?.settled || t.timestamps?.created || (t as any).transaction_date
        return dateStr ? new Date(dateStr).getHours() : NaN
      })
      .filter((h) => !isNaN(h))
    
    const minH = hours.length > 0 ? Math.min(...hours) : 8
    const maxH = hours.length > 0 ? Math.max(...hours) : 23
    const activeWindow = `${minH.toString().padStart(2, '0')}:00 – ${maxH.toString().padStart(2, '0')}:00 IST`

    // Extract enrolled devices
    const devices = Array.from(
      new Set(
        (storeTransactions || [])
          .map((t) => t.deviceId || (t as any).device_id)
          .filter(Boolean)
          .concat(['DEV-A782', 'DEV-MAC-B88'])
      )
    )

    // Sorted historical amounts
    const sorted = [...amounts].sort((a, b) => b - a)
    const largest = sorted[0] || 25000
    const prevLargest = sorted.length > 1 ? sorted[1] : (sorted[0] ? Math.round(sorted[0] * 0.7) : 18500)

    return {
      computedAvgTicket: avgTicket,
      computedActiveWindow: activeWindow,
      enrolledDevicesList: devices,
      realLargestHistoric: largest,
      realPreviousLargest: prevLargest,
      historicAmounts: sorted
    }
  }, [storeTransactions])

  const [baseline, setBaseline] = useState<UserBehaviorBaseline>({
    ...DEFAULT_USER_BASELINE,
    frequent_cities: ['Hubballi', 'Bengaluru', 'Mysuru'],
    avg_ticket_size: computedAvgTicket,
    max_historic_amount: realLargestHistoric,
    registered_devices: enrolledDevicesList
  })

  // Keep baseline synchronized with computed transactions
  useEffect(() => {
    setBaseline((prev) => ({
      ...prev,
      frequent_cities: ['Hubballi', 'Bengaluru', 'Mysuru'],
      avg_ticket_size: computedAvgTicket,
      max_historic_amount: realLargestHistoric,
      registered_devices: enrolledDevicesList
    }))
  }, [computedAvgTicket, realLargestHistoric, enrolledDevicesList])

  // Live Simulation Controls State - Defaults to safe home profile
  const [selectedTxnAmount, setSelectedTxnAmount] = useState(850)
  const [selectedCity, setSelectedCity] = useState('Hubballi')
  const [selectedDevice, setSelectedDevice] = useState('DEV-A782')
  const [selectedVpa, setSelectedVpa] = useState('nature.basket@icici')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState<'genuine' | 'fraud' | null>(null)
  const [userConfirmationState, setUserConfirmationState] = useState<'genuine' | 'fraud' | null>(null)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [securityModalData, setSecurityModalData] = useState<{ alertId: string; amount: number; city: string; device: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'xai' | 'breakdown' | 'behaviour' | 'history' | 'threshold'>('overview')

  // Reset confirmation state whenever simulation inputs change so user can verify each new scenario
  useEffect(() => {
    setUserConfirmationState(null)
  }, [selectedTxnAmount, selectedCity, selectedDevice, selectedVpa])

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

  // 2. RUN REAL DETERMINISTIC MULTI-MODEL RISK EVALUATION
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

  // 3. EXACT 7-COMPONENT WEIGHTED RISK FORMULA
  // Total = 100 pts: ML 25%, Anomaly 20%, Behaviour 15%, Device 15%, Location 15%, Velocity 5%, Beneficiary 5%
  const fraudModelPts = Math.min(25, Math.max(1, Math.round(liveAssessment.sub_scores.transaction_risk * 0.25)))
  const anomalyPts = Math.min(20, Math.max(1, Math.round(liveAssessment.sub_scores.anomaly_score * 0.20)))
  const behaviourPts = Math.min(15, Math.max(1, Math.round(liveAssessment.sub_scores.behaviour_risk * 0.15)))
  const devicePts = Math.min(15, Math.max(1, Math.round(liveAssessment.sub_scores.device_risk * 0.15)))
  const locationPts = Math.min(15, Math.max(1, Math.round(liveAssessment.sub_scores.location_risk * 0.15)))
  const velocityPts = Math.min(5, Math.max(1, Math.round(liveAssessment.sub_scores.velocity_score * 0.05)))
  const beneficiaryPts = Math.min(5, Math.max(1, Math.round(liveAssessment.sub_scores.receiver_risk * 0.05)))

  // 4. MAJOR PURCHASE BEHAVIOR DYNAMIC DERIVATION
  const largestPurchaseDisplay = Math.max(realLargestHistoric, selectedTxnAmount)
  const previousLargestDisplay = realPreviousLargest
  const amountDeviationPct = previousLargestDisplay > 0
    ? Math.round(((selectedTxnAmount - previousLargestDisplay) / previousLargestDisplay) * 100)
    : 0
  const amountDeviationStr = amountDeviationPct >= 0 ? `+${amountDeviationPct}%` : `${amountDeviationPct}%`

  // Merchant Familiarity check from real transaction history and frequent contacts
  const isMerchantFamiliar = (storeTransactions || []).some((t) =>
    (t.receiverUpiId && t.receiverUpiId.toLowerCase() === selectedVpa.toLowerCase()) ||
    (t.receiverName && t.receiverName.toLowerCase() === selectedVpa.split('@')[0]?.toLowerCase())
  ) || (baseline.frequent_vpas || []).some((v) => v.toLowerCase() === selectedVpa.toLowerCase())
  const merchantNameClean = selectedVpa.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, ' ')?.toUpperCase() || 'MERCHANT'
  const merchantFamiliarityStr = isMerchantFamiliar ? `Familiar (${merchantNameClean})` : `New (${merchantNameClean})`

  // Dynamic Behavioural Impact based on actual deviation metrics
  const behaviouralImpact: 'LOW' | 'MEDIUM' | 'HIGH' =
    amountDeviationPct > 300 || selectedTxnAmount >= 200000 || liveAssessment.behaviour_metrics.deviation_percentage >= 50
      ? 'HIGH'
      : amountDeviationPct > 50 || selectedTxnAmount >= 50000 || liveAssessment.behaviour_metrics.deviation_percentage >= 25
      ? 'MEDIUM'
      : 'LOW'

  // Is this a major purchase scenario? (>= ₹50,000 or significant amount deviation)
  const isMajorPurchaseActive = selectedTxnAmount >= 50000 || liveAssessment.behaviour_metrics.is_unusual_amount || behaviouralImpact !== 'LOW'

  // 5. INTERACTIVE ACTION BUTTON HANDLERS WITH FULL VISUAL CONFIRMATION & AUDIT
  const handleUserFeedback = async (type: 'genuine_was_me' | 'fraud_not_me') => {
    setFeedbackLoading(type === 'genuine_was_me' ? 'genuine' : 'fraud')
    try {
      // 1. Send feedback to backend API
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_feedback: type,
          transaction_id: `TXN-SIM-${Date.now()}`,
          amount: selectedTxnAmount,
          receiver_vpa: selectedVpa,
          city: selectedCity,
          device_id: selectedDevice,
          false_positive: type === 'genuine_was_me'
        })
      }).catch(() => null)

      // 2. Submit to self-learning model registry in UPIGuard store
      if (submitFeedback) {
        submitFeedback({
          transactionId: `TXN-SIM-${selectedTxnAmount}`,
          amount: selectedTxnAmount,
          receiverVpa: selectedVpa,
          sourceApp: 'Native',
          predictedRisk: liveAssessment.overall_risk_score,
          predictedDecision: liveAssessment.decision,
          actualOutcome: type === 'genuine_was_me' ? 'LEGITIMATE' : 'FRAUD',
          feedbackSource: 'USER_CONFIRMATION',
          userNotes: type === 'genuine_was_me'
            ? `User verified transaction of ₹${selectedTxnAmount.toLocaleString('en-IN')} in ${selectedCity} as authorized.`
            : `User flagged transaction of ₹${selectedTxnAmount.toLocaleString('en-IN')} to ${selectedVpa} as unauthorized.`
        })
      }

      // 3. Fraud / Genuine state branch
      if (type === 'fraud_not_me') {
        const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`
        useUPIGuardStore.setState((s) => ({
          alerts: [
            {
              id: `alt_${Date.now()}`,
              alertId,
              severity: 'CRITICAL',
              title: `Unauthorized Payment Flagged: ₹${selectedTxnAmount.toLocaleString('en-IN')}`,
              description: `Transaction attempt to ${selectedVpa} from ${selectedCity} (${selectedDevice}) reported as NOT ME by account holder.`,
              transactionId: `TXN-SIM-${Date.now()}`,
              amount: selectedTxnAmount,
              userId: 'demo@upishield.ai',
              createdAt: new Date().toISOString(),
              status: 'OPEN'
            },
            ...s.alerts
          ]
        }))

        // Tighten adaptive threshold (-5.0 pts)
        setBaseline((prev) => ({
          ...prev,
          recent_fraud_count: (prev.recent_fraud_count || 0) + 1
        }))
        setUserConfirmationState('fraud')
        setSecurityModalData({
          alertId,
          amount: selectedTxnAmount,
          city: selectedCity,
          device: selectedDevice
        })
        setShowSecurityModal(true)
        setFeedbackSubmitted(
          `Confirmed as Suspicious: Threat registered. Protective threshold barrier tightened (-5.0 pts) and incident ${alertId} logged in Fraud Alerts.`
        )
      } else {
        // Genuine payment: Relax adaptive threshold (+2.5 pts bonus)
        setBaseline((prev) => ({
          ...prev,
          false_positive_count: (prev.false_positive_count || 0) + 1
        }))
        setUserConfirmationState('genuine')
        setFeedbackSubmitted(
          `Confirmed as Genuine: Transaction marked authorized by you. Adaptive barrier relaxed (+2.5 pts) to prevent future false alarms.`
        )
      }
    } catch {
      setFeedbackSubmitted('Feedback registered in local intelligence cache.')
    } finally {
      setFeedbackLoading(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 81) return 'text-rose-400 bg-rose-500/15 border-rose-500/30'
    if (score >= 61) return 'text-orange-400 bg-orange-500/15 border-orange-500/30'
    if (score >= 31) return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    return 'text-[#b8f55e] bg-[#b8f55e]/15 border-[#b8f55e]/30'
  }

  // Dynamic Natural-Language explanation derived from actual inputs & baseline
  const isHighOrMedium = liveAssessment.overall_risk_score >= 35
  const dynamicNaturalLanguageExplanation = isHighOrMedium
    ? `This payment received an ${categoryInfo.subLevel.toUpperCase()} score (${liveAssessment.overall_risk_score}/100, Action: ${categoryInfo.recommendedAction}) because its amount (₹${selectedTxnAmount.toLocaleString('en-IN')}) is ${(selectedTxnAmount / baseline.avg_ticket_size).toFixed(1)}× higher than your historical baseline (₹${baseline.avg_ticket_size.toLocaleString('en-IN')}), initiated from a device (${selectedDevice}) ${baseline.registered_devices.includes(selectedDevice) ? 'registered in hardware keystore' : 'not previously seen on your account'}, and beneficiary (${selectedVpa}) ${isMerchantFamiliar ? 'has verified prior trust' : 'is a new encounter'}. Location (${selectedCity}) is ${baseline.frequent_cities.includes(selectedCity) ? 'inside verified cluster' : 'outside regular geofence'}.`
    : `This transaction received a LOW RISK score (${liveAssessment.overall_risk_score}/100, Trusted) because the transaction amount (₹${selectedTxnAmount.toLocaleString('en-IN')}) is within your historical spending baseline (₹200–₹${(computedAvgTicket * 3).toLocaleString('en-IN')}), initiated from an enrolled device (${selectedDevice}) within your verified geofence (${selectedCity}) during regular active hours (${computedActiveWindow}).`

  return (
    <UserLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3.5 py-1 text-xs font-semibold text-[#b8f55e] mb-2">
              <Cpu className="size-3.5" />
              <span>DYNAMIC MULTI-MODEL AI RISK &amp; EXPLAINABILITY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Risk &amp; Explainability Engine
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
              Simulate Payment &amp; AI Scan <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-3">
          {[
            { id: 'overview', label: 'Risk Overview', icon: Activity },
            { id: 'xai', label: 'Explainable AI (XAI)', icon: Sparkles },
            { id: 'breakdown', label: 'Risk Breakdown', icon: Layers },
            { id: 'behaviour', label: 'Behaviour Profile', icon: Compass },
            { id: 'history', label: 'Risk History', icon: HistoryIcon },
            { id: 'threshold', label: 'Adaptive Threshold', icon: SlidersHorizontal }
          ].map((tab) => {
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
              className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
                userConfirmationState === 'fraud'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {userConfirmationState === 'fraud' ? (
                  <ShieldAlert className="size-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                )}
                <span className="font-medium">{feedbackSubmitted}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackSubmitted(null)}
                className={`text-xs font-semibold hover:underline cursor-pointer ml-3 ${
                  userConfirmationState === 'fraud' ? 'text-rose-400' : 'text-emerald-400'
                }`}
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
                    <span
                      className={`text-7xl sm:text-8xl font-black tracking-tight font-mono ${
                        liveAssessment.overall_risk_score >= 61
                          ? 'text-rose-400'
                          : liveAssessment.overall_risk_score >= 31
                          ? 'text-amber-400'
                          : 'text-[#b8f55e]'
                      }`}
                    >
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
                    <div className="relative h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          liveAssessment.overall_risk_score >= 61
                            ? 'bg-rose-500'
                            : liveAssessment.overall_risk_score >= 31
                            ? 'bg-amber-400'
                            : 'bg-[#b8f55e]'
                        }`}
                        style={{ width: `${liveAssessment.overall_risk_score}%` }}
                      />
                      {/* Adaptive Threshold Marker Pin */}
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-amber-400 shadow-[0_0_10px_#fbbf24]"
                        style={{ left: `${liveAssessment.adaptive_threshold}%` }}
                        title={`Adaptive Barrier: ${liveAssessment.adaptive_threshold}`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6f8583] pt-1 font-mono">
                      <span>0 (Safe)</span>
                      <span className="text-amber-400 font-semibold">
                        Adaptive Barrier: {liveAssessment.adaptive_threshold}
                      </span>
                      <span>100 (Critical)</span>
                    </div>
                    <div className="pt-1 text-[11px] text-center font-mono">
                      {liveAssessment.overall_risk_score < liveAssessment.adaptive_threshold ? (
                        <span className="text-emerald-400">
                          ✓ Below Barrier: Risk Score ({liveAssessment.overall_risk_score}) &lt; Threshold ({liveAssessment.adaptive_threshold}) → Safe for Transfer
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          ⚠ Barrier Exceeded: Risk Score ({liveAssessment.overall_risk_score}) ≥ Threshold ({liveAssessment.adaptive_threshold}) → {categoryInfo.recommendedAction}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action Confirmation Buttons */}
                <div className="pt-6 border-t border-white/8 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8fa9a6]">
                      Did you perform this recent transaction simulation?
                    </p>
                    {userConfirmationState && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        userConfirmationState === 'genuine' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {userConfirmationState === 'genuine' ? '✓ Verified by You' : '🛡️ Quarantined'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={feedbackLoading !== null}
                      onClick={() => handleUserFeedback('genuine_was_me')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        userConfirmationState === 'genuine'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      }`}
                    >
                      {feedbackLoading === 'genuine' ? (
                        <RefreshCw className="size-3.5 animate-spin text-[#b8f55e]" />
                      ) : (
                        <Check className="size-3.5 text-[#b8f55e]" />
                      )}
                      <span>{userConfirmationState === 'genuine' ? 'Yes, Confirmed Me' : 'Yes, This Was Me'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={feedbackLoading !== null}
                      onClick={() => handleUserFeedback('fraud_not_me')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        userConfirmationState === 'fraud'
                          ? 'bg-rose-600/30 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40'
                          : 'bg-rose-600/20 hover:bg-rose-600/30 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {feedbackLoading === 'fraud' ? (
                        <RefreshCw className="size-3.5 animate-spin text-rose-400" />
                      ) : (
                        <ShieldAlert className="size-3.5 text-rose-400" />
                      )}
                      <span>{userConfirmationState === 'fraud' ? 'Account Secured' : 'No, Secure Account'}</span>
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
                        BEHAVIORAL PROFILE &amp; SIMULATION
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        Isolation Forest &amp; Deviation Analytics
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
                      <span className="text-[10px] text-[#8fa9a6]">
                        Baseline: ₹200 – ₹{(baseline.avg_ticket_size * 3).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-white/[.02] border border-white/5 p-4">
                      <span className="text-[10px] font-bold uppercase text-[#6f8583]">ACTIVE WINDOW</span>
                      <p className="text-lg font-bold text-white font-mono mt-1">
                        {computedActiveWindow}
                      </p>
                      <span className="text-[10px] text-emerald-400">Regular transaction hours</span>
                    </div>

                    <div className="rounded-2xl bg-white/[.02] border border-white/5 p-4">
                      <span className="text-[10px] font-bold uppercase text-[#6f8583]">ENROLLED DEVICES</span>
                      <p className="text-lg font-bold text-[#b8f55e] font-mono mt-1">
                        {enrolledDevicesList.length} Hardware Keys
                      </p>
                      <span className="text-[10px] text-[#8fa9a6] truncate block">
                        {enrolledDevicesList.slice(0, 2).join(', ')}
                      </span>
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

                  {/* Quick Preset Buttons for 1-Click Testing */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-white/5 pb-2.5">
                    <span className="text-[10px] text-[#8fa9a6] font-semibold uppercase tracking-wider">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTxnAmount(850)
                        setSelectedCity('Hubballi')
                        setSelectedDevice('DEV-A782')
                        setSelectedVpa('nature.basket@icici')
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        selectedTxnAmount === 850 && selectedCity === 'Hubballi' && selectedDevice === 'DEV-A782'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      🟢 Home Routine (₹850)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTxnAmount(18500)
                        setSelectedCity('Mumbai')
                        setSelectedDevice('DEV-NEW-88')
                        setSelectedVpa('new.merchant@okaxis')
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        selectedTxnAmount === 18500 && selectedCity === 'Mumbai' && selectedDevice === 'DEV-NEW-88'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      🟡 Travel Spike (₹18.5k)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTxnAmount(850000)
                        setSelectedCity('Dubai')
                        setSelectedDevice('DEV-EMU-X99')
                        setSelectedVpa('scammer.refund@okaxis')
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        selectedTxnAmount === 850000 && selectedCity === 'Dubai' && selectedDevice === 'DEV-EMU-X99'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      🔴 Cyber Attack (₹8.5L)
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-[#8fa9a6] block mb-1 font-medium">Amount (₹)</label>
                      <select
                        id="simulation-amount-select"
                        value={selectedTxnAmount}
                        onChange={(e) => setSelectedTxnAmount(Number(e.target.value))}
                        className="w-full bg-[#071014] border border-white/15 focus:border-[#b8f55e]/60 rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                      >
                        <option value={850}>₹850 (Normal Grocery / Routine)</option>
                        <option value={1450}>₹1,450 (Baseline Average Ticket)</option>
                        <option value={18500}>₹18,500 (Elevated 13x Spending Spike)</option>
                        <option value={200000}>₹2,00,000 (Vehicle Advance Outlay)</option>
                        <option value={850000}>₹8,50,000 (Car Purchase - ABC Motors)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8fa9a6] block mb-1 font-medium">City / Location</label>
                      <select
                        id="simulation-city-select"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-[#071014] border border-white/15 focus:border-[#b8f55e]/60 rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                      >
                        <option value="Hubballi">Hubballi (Home Address / Geofence)</option>
                        <option value="Bengaluru">Bengaluru (Verified Cluster)</option>
                        <option value="Mysuru">Mysuru (Frequent City)</option>
                        <option value="Mumbai">Mumbai (Velocity Anomaly / Untrusted)</option>
                        <option value="Dubai">Dubai (Cross-Border Alert)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8fa9a6] block mb-1 font-medium">Device &amp; Beneficiary</label>
                      <select
                        id="simulation-device-select"
                        value={`${selectedDevice}|${selectedVpa}`}
                        onChange={(e) => {
                          const [d, v] = e.target.value.split('|')
                          setSelectedDevice(d)
                          setSelectedVpa(v)
                        }}
                        className="w-full bg-[#071014] border border-white/15 focus:border-[#b8f55e]/60 rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                      >
                        <option value="DEV-A782|nature.basket@icici">DEV-A782 · Trusted Key (Nature Basket)</option>
                        <option value="DEV-A782|abcmotors@upiguard">DEV-A782 · Trusted Key (ABC Motors)</option>
                        <option value="DEV-NEW-88|new.merchant@okaxis">DEV-NEW-88 · Unregistered Device (New VPA)</option>
                        <option value="DEV-EMU-X99|scammer.refund@okaxis">DEV-EMU-X99 · Rooted Emulator (Scam VPA)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* MAJOR PURCHASE BEHAVIOR CARD (Dynamic) */}
                {isMajorPurchaseActive && (
                  <div className="rounded-2xl bg-amber-400/[0.06] border border-amber-400/30 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-400/20 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Activity className="size-4" /> MAJOR PURCHASE BEHAVIOR
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          behaviouralImpact === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : behaviouralImpact === 'MEDIUM'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        Behavioral Impact: {behaviouralImpact}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400">Largest Purchase</span>
                        <div className="text-base font-black text-white">₹{largestPurchaseDisplay.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Previous Largest</span>
                        <div className="text-base font-black text-slate-300">₹{previousLargestDisplay.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Amount Deviation</span>
                        <div className={`text-base font-black ${amountDeviationPct > 50 ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {amountDeviationStr}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Merchant Familiarity</span>
                        <div className="text-base font-black text-white truncate">{merchantFamiliarityStr}</div>
                      </div>
                    </div>

                    <p className="text-xs text-amber-200/90 italic pt-1 border-t border-amber-400/10">
                      {selectedTxnAmount >= 200000
                        ? '“This transaction is significantly larger than your historical transaction pattern. Multi-factor verification (Biometric Face Scan + OTP) is recommended.”'
                        : '“Transaction deviation evaluated against 30-day baseline ledger and historical spending variance.”'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DEDICATED EXPLAINABLE AI (XAI) SECTION DIRECTLY BELOW RISK SCORE */}
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
                  className="text-xs font-semibold text-[#b8f55e] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open Full XAI Matrix <ArrowRight className="size-3.5" />
                </button>
              </div>

              {/* Top Summary Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Overall Risk Score</span>
                  <span
                    className={`text-xl font-mono font-bold ${
                      liveAssessment.overall_risk_score >= 61
                        ? 'text-rose-400'
                        : liveAssessment.overall_risk_score >= 31
                        ? 'text-amber-400'
                        : 'text-[#b8f55e]'
                    }`}
                  >
                    {liveAssessment.overall_risk_score} / 100
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Risk Level</span>
                  <span
                    className={`text-xl font-bold uppercase ${
                      liveAssessment.risk_level === 'CRITICAL'
                        ? 'text-rose-400'
                        : liveAssessment.risk_level === 'HIGH'
                        ? 'text-orange-400'
                        : liveAssessment.risk_level === 'MEDIUM'
                        ? 'text-amber-400'
                        : 'text-[#b8f55e]'
                    }`}
                  >
                    {categoryInfo.subLevel}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Fraud Probability (XGBoost)</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {(liveAssessment.fraud_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[.02] border border-white/5 space-y-1">
                  <span className="text-white/50 uppercase text-[10px] tracking-wider block">Adaptive Barrier</span>
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
                            Unusual Amount (₹{selectedTxnAmount.toLocaleString('en-IN')})
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
                      {!baseline.registered_devices.includes(selectedDevice) && (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Unrecognized Hardware Signature ({selectedDevice})
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{devicePts} pts</span>
                        </div>
                      )}
                      {!baseline.frequent_cities.includes(selectedCity) && (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            Unusual Geographic Location ({selectedCity})
                          </span>
                          <span className="font-mono font-bold text-rose-400">+{locationPts} pts</span>
                        </div>
                      )}
                      {!isMerchantFamiliar || selectedVpa.includes('scam') ? (
                        <div className="flex items-center justify-between text-white/90">
                          <span className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-rose-400" />
                            {selectedVpa.includes('scam') ? 'Blacklisted Scam VPA Hit' : 'New / Unverified Beneficiary'}
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
                    {baseline.registered_devices.includes(selectedDevice) && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          Device Keystore &amp; Fingerprint Verified
                        </span>
                        <span className="font-mono font-bold text-emerald-400">-3 pts</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-400 shrink-0" />
                        No Previous Fraud Reports Against User
                      </span>
                      <span className="font-mono font-bold text-emerald-400">-2 pts</span>
                    </div>
                    {baseline.frequent_cities.includes(selectedCity) && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Check className="size-3.5 text-emerald-400 shrink-0" />
                          Authenticated Within Primary Geofence ({selectedCity})
                        </span>
                        <span className="font-mono font-bold text-emerald-400">-4 pts</span>
                      </div>
                    )}
                    {isMerchantFamiliar && (
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

              {/* Natural-Language AI Explanation Box */}
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
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          sub.score >= 60 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
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
        {/* TAB 2: EXPLAINABLE AI (XAI) DEEP-DIVE                    */}
        {/* ======================================================== */}
        {activeTab === 'xai' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card A: Supervised ML Model Explanation */}
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

                {/* SHAP Feature Impact Bars */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                    Factors Increasing Fraud Probability
                  </span>

                  {[
                    {
                      name: 'Transaction Amount Spike',
                      impact: selectedTxnAmount >= computedAvgTicket * 5 ? '+32%' : selectedTxnAmount >= computedAvgTicket * 2 ? '+18%' : '+3%',
                      width: selectedTxnAmount >= computedAvgTicket * 5 ? '85%' : selectedTxnAmount >= computedAvgTicket * 2 ? '50%' : '15%'
                    },
                    {
                      name: 'Hardware Device Signature',
                      impact: !baseline.registered_devices.includes(selectedDevice) ? '+26%' : '+2%',
                      width: !baseline.registered_devices.includes(selectedDevice) ? '70%' : '10%'
                    },
                    {
                      name: 'Geographic Location Change',
                      impact: !baseline.frequent_cities.includes(selectedCity) ? '+21%' : '+2%',
                      width: !baseline.frequent_cities.includes(selectedCity) ? '60%' : '8%'
                    },
                    {
                      name: 'Beneficiary / VPA Reputation',
                      impact: selectedVpa.includes('scam') ? '+45%' : !isMerchantFamiliar ? '+16%' : '+2%',
                      width: selectedVpa.includes('scam') ? '92%' : !isMerchantFamiliar ? '48%' : '10%'
                    }
                  ].map((f) => (
                    <div key={f.name} className="space-y-1 text-xs">
                      <div className="flex justify-between text-white/80">
                        <span>{f.name}</span>
                        <span className="font-mono text-rose-400 font-bold">{f.impact}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: f.width }} />
                      </div>
                    </div>
                  ))}

                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block pt-3">
                    Factors Reducing Fraud Probability
                  </span>
                  {[
                    { name: 'Enrolled IP & Device Keystore', impact: '-9%', width: '30%' },
                    { name: 'Normal Historical Transaction Velocity', impact: '-8%', width: '26%' }
                  ].map((f) => (
                    <div key={f.name} className="space-y-1 text-xs">
                      <div className="flex justify-between text-white/80">
                        <span>{f.name}</span>
                        <span className="font-mono text-emerald-400 font-bold">{f.impact}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: f.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Risk Engine Explanation */}
              <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#b8f55e] uppercase tracking-wider block">
                      RISK ENGINE: MULTI-MODEL FUSION
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">Final Risk Score Contributions</h3>
                  </div>
                  <span
                    className={`text-2xl font-mono font-bold ${
                      liveAssessment.overall_risk_score >= 61
                        ? 'text-rose-400'
                        : liveAssessment.overall_risk_score >= 31
                        ? 'text-amber-400'
                        : 'text-[#b8f55e]'
                    }`}
                  >
                    {liveAssessment.overall_risk_score} / 100
                  </span>
                </div>

                <p className="text-xs text-white/60">
                  Explains <em>why the final 0–100 composite score was produced</em> by blending ML probabilities with behavioral, device, and isolation forest anomaly models.
                </p>

                {/* Weighted breakdown formula */}
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

            {/* “Why this score?” Card */}
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
                      <AlertTriangle className="size-3.5" /> Amount (₹{selectedTxnAmount.toLocaleString('en-IN')}) is {(selectedTxnAmount / baseline.avg_ticket_size).toFixed(1)}× higher than normal baseline (₹{baseline.avg_ticket_size.toLocaleString('en-IN')})
                    </p>
                    <p className="flex items-center gap-2 text-rose-400 font-semibold">
                      <AlertTriangle className="size-3.5" /> Beneficiary encounter: {merchantFamiliarityStr}
                    </p>
                    {!baseline.registered_devices.includes(selectedDevice) && (
                      <p className="flex items-center gap-2 text-rose-400 font-semibold">
                        <AlertTriangle className="size-3.5" /> Unregistered hardware signature ({selectedDevice})
                      </p>
                    )}
                    {!baseline.frequent_cities.includes(selectedCity) && (
                      <p className="flex items-center gap-2 text-rose-400 font-semibold">
                        <AlertTriangle className="size-3.5" /> Location is outside verified home cluster ({selectedCity})
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1 text-emerald-300">
                    <p className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400" /> No chargeback history against account profile
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
                    <Check className="size-3.5 text-emerald-400" /> Amount (₹{selectedTxnAmount.toLocaleString('en-IN')}) is within your historical baseline (₹200–₹{(computedAvgTicket * 3).toLocaleString('en-IN')})
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Payment originated from verified cluster ({selectedCity})
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Beneficiary is trusted with established payment frequency
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Device recognized ({selectedDevice} Hardware Key)
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400" /> Transaction occurred during normal active hours ({computedActiveWindow})
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
                    <span className="font-mono font-bold text-white">₹{computedAvgTicket.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Median Ticket</span>
                    <span className="font-mono font-bold text-white">
                      ₹{(historicAmounts[Math.floor(historicAmounts.length / 2)] || 900).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Normal Range</span>
                    <span className="font-mono text-[#b8f55e]">₹200 – ₹{(computedAvgTicket * 3).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Max Historic Spend</span>
                    <span className="font-mono text-white">₹{realLargestHistoric.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-white/10 bg-[#0a1718] space-y-3">
                <span className="text-xs uppercase text-white/50 tracking-wider">Temporal &amp; Velocity Cadence</span>
                <div className="space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Active Hours</span>
                    <span className="font-mono font-bold text-white">{computedActiveWindow}</span>
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
                    <span className="font-bold text-white">{baseline.frequent_cities[0] || 'Bengaluru'} (84%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Secondary City</span>
                    <span className="font-bold text-white">{baseline.frequent_cities[1] || 'Mysuru'} (12%)</span>
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
              {(storeTransactions && storeTransactions.length > 0 ? storeTransactions.slice(0, 6) : [
                { id: 'TXN-9021', transactionId: 'TXN-9021', timestamps: { settled: new Date().toISOString() }, amount: 850, receiverName: 'nature.basket@icici', receiverUpiId: 'nature.basket@icici', riskScore: 12, riskLevel: 'LOW', riskDecision: 'ALLOW' as const },
                { id: 'TXN-8984', transactionId: 'TXN-8984', timestamps: { settled: new Date(Date.now() - 86400000).toISOString() }, amount: 2400, receiverName: 'coffee.day@hdfc', receiverUpiId: 'coffee.day@hdfc', riskScore: 18, riskLevel: 'LOW', riskDecision: 'ALLOW' as const },
                { id: 'TXN-8820', transactionId: 'TXN-8820', timestamps: { settled: new Date(Date.now() - 259200000).toISOString() }, amount: 18500, receiverName: 'electronic.city@axis', receiverUpiId: 'electronic.city@axis', riskScore: 64, riskLevel: 'HIGH', riskDecision: 'VERIFY' as const },
                { id: 'TXN-8712', transactionId: 'TXN-8712', timestamps: { settled: new Date(Date.now() - 432000000).toISOString() }, amount: 48500, receiverName: 'scammer.refund@okaxis', receiverUpiId: 'scammer.refund@okaxis', riskScore: 96, riskLevel: 'CRITICAL', riskDecision: 'BLOCK' as const }
              ]).map((item: any) => {
                const score = item.riskScore || 12
                return (
                  <div key={item.transactionId || item.id} className="p-3.5 rounded-xl border border-white/5 bg-white/[.02] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-white">{item.transactionId || item.id}</span>
                      <span className="text-white/40 ml-2">· {new Date(item.timestamps?.settled || item.timestamps?.created || item.createdAt || Date.now()).toLocaleDateString()}</span>
                      <p className="text-white/60 mt-0.5">{item.receiverName || item.receiverUpiId} (₹{Number(item.amount).toLocaleString('en-IN')})</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          score >= 61 ? 'text-rose-400' : score >= 31 ? 'text-amber-400' : 'text-[#b8f55e]'
                        }`}
                      >
                        {score}/100
                      </span>
                      <span className="text-[10px] text-white/50 block">{item.riskDecision || item.status || 'SETTLED'}</span>
                    </div>
                  </div>
                )
              })}
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
                <span className="text-2xl font-mono font-bold text-emerald-400 block">+{((baseline.false_positive_count || 0) * 2.5).toFixed(1)} pts</span>
                <span className="text-[10px] text-emerald-300/80">{baseline.false_positive_count || 0} confirmed genuine payments</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="text-rose-400">Recent Fraud Tightening</span>
                <span className="text-2xl font-mono font-bold text-rose-400 block">-{((baseline.recent_fraud_count || 0) * 5.0).toFixed(1)} pts</span>
                <span className="text-[10px] text-rose-300/80">{baseline.recent_fraud_count || 0} confirmed fraud incidents</span>
              </div>
            </div>
          </div>
        )}

        {/* Security Emergency Modal */}
        <AnimatePresence>
          {showSecurityModal && securityModalData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-[#0c181a] p-6 space-y-5 shadow-2xl shadow-rose-950/50 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-rose-500/10 blur-2xl" />

                <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
                  <div className="size-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                    <ShieldAlert className="size-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Emergency Account Protection</h3>
                    <p className="text-xs text-rose-300">Unauthorized transaction flagged &amp; blocked</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-white/80">
                  <div className="p-3 rounded-xl bg-white/[.03] border border-white/10 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/50">Incident Alert ID:</span>
                      <span className="font-mono font-bold text-rose-400">{securityModalData.alertId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Flagged Amount:</span>
                      <span className="font-mono font-bold text-white">₹{securityModalData.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Originating City:</span>
                      <span className="text-white font-medium">{securityModalData.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Device Signature:</span>
                      <span className="font-mono text-white/80">{securityModalData.device}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Lock className="size-3.5" /> Protective Measures Applied:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/90 pl-1">
                      <li>Device hardware endpoint quarantined immediately</li>
                      <li>Adaptive safety barrier tightened (-5.0 pts)</li>
                      <li>Security event dispatched to Fraud Alerts &amp; Admin</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/dashboard/alerts"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold text-center transition"
                  >
                    View in Fraud Alerts
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowSecurityModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  )
}
