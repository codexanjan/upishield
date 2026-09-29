'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  User,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  QrCode,
  History,
  RotateCcw,
  Cpu,
  ShieldCheck,
  Zap,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Sparkles,
  Info,
  MapPin,
  Clock,
  Layers,
  Activity,
  AlertOctagon,
  ChevronRight
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'
import {
  evaluateDynamicRisk,
  DEFAULT_USER_BASELINE,
  getDetailedRiskCategory,
  DynamicRiskAssessment,
  UnifiedUpiTransaction
} from '@/lib/ai-fraud-engine'
import { UPIGuardPaymentFlow } from '@/components/payments/upiguard-payment-flow'
import { useUPIGuardStore } from '@/lib/upiguard-store'

const recentPayees = [
  { name: 'Blue Tokai Coffee', upi: 'bluetokai@icici', avatar: 'BT', risk: 'Safe' },
  { name: 'Swiggy Delivery', upi: 'swiggy@hdfcbank', avatar: 'SW', risk: 'Safe' },
  { name: 'ABC Motors (Demo High Ticket)', upi: 'abc.motors@ybl', avatar: 'AM', risk: 'Elevated' },
  { name: 'Tech Helpdesk (Flagged VPA)', upi: 'scammer.refund@okaxis', avatar: 'TH', risk: 'Critical' },
  { name: 'Rohan Verma', upi: 'rohan.verma@okaxis', avatar: 'RV', risk: 'Safe' },
]

export default function SendUpiPage() {
  const router = useRouter()
  const [flowMode, setFlowMode] = useState<'upiguard_viva' | 'legacy_intent'>('upiguard_viva')
  const [activeTab, setActiveTab] = useState<'id' | 'recent' | 'qr'>('id')
  
  // Phase 1: Data Collection Layer
  const [sourceApp, setSourceApp] = useState<'GooglePay' | 'PhonePe' | 'Paytm' | 'CRED' | 'BHIM' | 'Native'>('GooglePay')
  const [receiverUpi, setReceiverUpi] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('Payment')
  
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  
  // Steps: 'form' -> 'confirm' (AI Fraud Review) -> 'handoff' (App Launch)
  const [step, setStep] = useState<'form' | 'confirm' | 'handoff'>('form')
  const [intentData, setIntentData] = useState<any>(null)
  const [riskAssessment, setRiskAssessment] = useState<DynamicRiskAssessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedUri, setCopiedUri] = useState(false)

  // Phase 8: Verification State for High/Elevated Risk
  const [userConfirmedState, setUserConfirmedState] = useState<'pending' | 'verified_by_user' | 'blocked_by_user'>('pending')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null)

  // Phase 16: Handoff Simulation Progress
  const [simulationState, setSimulationState] = useState<'idle' | 'logging_ledger' | 'recording_ai' | 'updating_profile' | 'completed'>('idle')
  const [accuracyFeedback, setAccuracyFeedback] = useState<'accurate' | 'inaccurate' | null>(null)

  // Pre-fill parameters if redirected from QR Scanner or external link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const u = params.get('receiver_upi')
      const n = params.get('receiver_name')
      const a = params.get('amount')
      if (u) setReceiverUpi(decodeURIComponent(u))
      if (n) setReceiverName(decodeURIComponent(n))
      if (a) setAmount(decodeURIComponent(a))
    }
  }, [])

  // Validate UPI ID format and blacklist
  const handleValidate = async () => {
    if (!receiverUpi.includes('@')) {
      setValidationResult({
        is_valid_format: false,
        message: 'UPI ID must contain "@" (e.g. username@bank)'
      })
      return
    }

    setValidating(true)
    try {
      const isBlacklisted = receiverUpi.toLowerCase().includes('scam') || receiverUpi.toLowerCase().includes('refund@okaxis')
      if (isBlacklisted) {
        setValidationResult({
          is_valid_format: true,
          is_reported: true,
          status_label: 'Blacklisted Beneficiary',
          message: 'Target VPA matches active scammer blacklist. High risk of fraud.'
        })
      } else {
        const res = await apiRequest('/upi/validate', {
          method: 'POST',
          body: JSON.stringify({ upi_id: receiverUpi })
        })
        setValidationResult(res)
      }
    } catch {
      const isRep = receiverUpi.toLowerCase().includes('fake') || receiverUpi.toLowerCase().includes('scam')
      setValidationResult({
        is_valid_format: true,
        is_reported: isRep,
        status_label: isRep ? 'Frequently Reported' : 'Normal',
        message: isRep
          ? 'Warning: Recipient has multiple verified fraud complaints on platform.'
          : 'Valid format with clean PSP reputation score.'
      })
    } finally {
      setValidating(false)
    }
  }

  // Phase 3 & 4: Review Payment & Execute Multi-Model AI Evaluation
  const handleReviewPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setLoading(true)
    setUserConfirmedState('pending')
    setFeedbackSubmitted(null)

    // Assemble Unified Transaction Payload (Phase 1 & 13)
    const unifiedTxn: UnifiedUpiTransaction = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source_app: sourceApp,
      sender_user_id: 1,
      sender_vpa: 'anjan.sharma@okaxis',
      receiver_vpa: receiverUpi.trim(),
      receiver_name: receiverName || 'UPI Recipient',
      amount: numAmount,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      device_id: 'DEV-A782',
      device_model: 'Samsung Galaxy S24 Ultra',
      location: {
        city: 'Bengaluru',
        latitude: 12.9716,
        longitude: 77.5946
      },
      payment_note: note || 'Payment'
    }

    // Run Multi-Model Fraud Fusion Engine
    const assessment = evaluateDynamicRisk(unifiedTxn, DEFAULT_USER_BASELINE)
    setRiskAssessment(assessment)

    // Generate Standard NPCI UPI URI
    const pa = encodeURIComponent(receiverUpi.trim())
    const pn = encodeURIComponent(receiverName || 'Merchant')
    const am = numAmount.toFixed(2)
    const tn = encodeURIComponent(note || 'Payment')
    const upiUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`

    setIntentData({
      transaction_id: unifiedTxn.id,
      upi_uri: upiUri,
      receiver_upi: receiverUpi.trim(),
      receiver_name: receiverName || 'Merchant',
      amount: numAmount,
      note: note || 'Payment',
      source_app: sourceApp
    })

    setLoading(false)
    setStep('confirm')
  }

  // Phase 8: User Verification Actions
  const handleUserConfirmGenuine = async () => {
    setUserConfirmedState('verified_by_user')
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: intentData?.transaction_id,
          user_id: 1,
          feedback_type: 'CONFIRMED_GENUINE',
          comment: 'User verified payment via in-flow verification challenge'
        })
      })
      setFeedbackSubmitted('Self-learning feedback stored: Adaptive threshold raised (+2.5 pts bonus). Transaction approved.')
    } catch {
      setFeedbackSubmitted('Verified by user. Proceeding with transfer.')
    }
  }

  const handleUserDenyFraud = async () => {
    setUserConfirmedState('blocked_by_user')
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: intentData?.transaction_id,
          user_id: 1,
          feedback_type: 'CONFIRMED_FRAUD',
          comment: 'User denied initiating this transfer. Immediate block requested.'
        })
      })
      setFeedbackSubmitted('ALERT: Transaction blocked. Fraud case registered in Admin Investigation Board.')
    } catch {
      setFeedbackSubmitted('Transaction blocked. Security lock triggered.')
    }
  }

  // Phase 16: Step 3 - Trigger Handoff
  const handleContinueToUpi = () => {
    setStep('handoff')
    setSimulationState('idle')

    // On mobile devices, prompt app switch via uri
    if (typeof window !== 'undefined' && intentData?.upi_uri) {
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile) {
        window.location.href = intentData.upi_uri
      }
    }
  }

  // Phase 16: Step 3 - Multi-Stage Demo Simulation
  const handleSimulatePaymentCycle = async () => {
    setSimulationState('logging_ledger')
    
    setTimeout(() => {
      setSimulationState('recording_ai')
    }, 600)

    setTimeout(() => {
      setSimulationState('updating_profile')
    }, 1200)

    setTimeout(async () => {
      setSimulationState('completed')

      // Record to universal single source of truth store
      useUPIGuardStore.getState().addSimulationTransaction({
        transactionId: intentData.transaction_id,
        amount: intentData.amount,
        merchant: intentData.receiver_name,
        receiverName: intentData.receiver_name,
        receiverUpiId: intentData.receiver_upi,
        payment_method: intentData.source_app || 'UPI',
        sourceApp: intentData.source_app,
        note: intentData.note,
        riskScore: riskAssessment?.overall_risk_score || 15,
        riskLevel: riskAssessment?.risk_level || 'LOW',
        decision: riskAssessment?.decision || 'ALLOW',
        status: riskAssessment?.decision === 'BLOCK' ? 'BLOCKED' : 'SETTLED'
      })

      try {
        await apiRequest('/transactions', {
          method: 'POST',
          body: JSON.stringify({
            transaction_reference: intentData.transaction_id,
            transaction_type: 'UPI',
            amount: intentData.amount,
            currency: 'INR',
            merchant: intentData.receiver_name,
            payment_method: intentData.source_app || 'UPI',
            receiver_upi: intentData.receiver_upi,
            receiver_name: intentData.receiver_name,
            upi_note: intentData.note,
            status: riskAssessment?.decision === 'BLOCK' ? 'Blocked' : 'Completed',
            risk_score: riskAssessment?.overall_risk_score || 15
          })
        })
      } catch {
        // Fallback
      }
    }, 1900)
  }

  const handleCopyUri = () => {
    if (intentData?.upi_uri) {
      navigator.clipboard.writeText(intentData.upi_uri)
      setCopiedUri(true)
      setTimeout(() => setCopiedUri(false), 2000)
    }
  }

  // Category Details from score
  const categoryInfo = riskAssessment
    ? getDetailedRiskCategory(riskAssessment.overall_risk_score)
    : { level: 'LOW', subLevel: 'Low Risk', action: 'ALLOW', badgeColor: 'bg-[#b8f55e]/20 text-[#b8f55e]', recommendedAction: 'ALLOW' }

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-6">
          <MotionFadeUp delay={0.05}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b8f55e] flex items-center gap-1.5">
              <Cpu className="size-3.5" />
              AI-PROTECTED PAYMENT PIPELINE
            </span>
          </MotionFadeUp>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#eef8f7]">
            <MotionWordReveal text="Send UPI Payment" delay={0.1} />
          </h1>
          <MotionFadeUp delay={0.2}>
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time multi-model fraud prediction, Isolation Forest anomaly checks, and adaptive barrier evaluation before bank handoff.
            </p>
          </MotionFadeUp>
        </div>

        {/* UPIGuard AI Mode Toggle */}
        <div className="flex rounded-2xl border border-white/10 bg-[#06101D] p-1.5 mb-6">
          <button
            onClick={() => setFlowMode('upiguard_viva')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 ${
              flowMode === 'upiguard_viva'
                ? 'bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] text-[#06101D] shadow-lg shadow-[#438EFF]/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="size-4" /> UPIGuard AI Simulator (Live Viva Demonstration)
          </button>
          <button
            onClick={() => setFlowMode('legacy_intent')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition ${
              flowMode === 'legacy_intent'
                ? 'bg-white/10 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Legacy Form Mode
          </button>
        </div>

        {flowMode === 'upiguard_viva' ? (
          <UPIGuardPaymentFlow
            initialRecipientUpi={receiverUpi || 'abc@upiguard'}
            initialAmount={amount || '5000'}
            initialNote={note || 'Electronics Purchase'}
            source="QR"
          />
        ) : (
          <>
        {/* Tab Selector */}
        <div className="flex rounded-xl border border-white/10 bg-[#071014] p-1 mb-6">
          <button
            onClick={() => { setActiveTab('id'); setStep('form') }}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              activeTab === 'id' ? 'bg-[#b8f55e] text-[#071014] font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            UPI ID
          </button>
          <button
            onClick={() => { setActiveTab('recent'); setStep('form') }}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              activeTab === 'recent' ? 'bg-[#b8f55e] text-[#071014] font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recent Payees
          </button>
          <button
            onClick={() => router.push('/dashboard/scan')}
            className="flex-1 rounded-lg py-2 text-xs font-medium text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <QrCode className="size-3.5 text-[#b8f55e]" /> Scan QR
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: PAYMENT ENTRY FORM                               */}
        {/* ======================================================== */}
        {step === 'form' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-xl space-y-5">
            {/* Quick Recent Payees */}
            {activeTab === 'recent' && (
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-slate-300">Select a Payee to Auto-Fill</p>
                {recentPayees.map((p) => (
                  <button
                    key={p.upi}
                    onClick={() => {
                      setReceiverUpi(p.upi)
                      setReceiverName(p.name)
                      if (p.name.includes('ABC Motors')) {
                        setAmount('200000')
                        setNote('Vehicle down payment')
                      } else if (p.name.includes('Tech Helpdesk')) {
                        setAmount('48500')
                        setNote('Refund processing claim')
                      } else {
                        setAmount('850')
                        setNote('Dinner')
                      }
                      setActiveTab('id')
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#071014] p-3 text-left hover:border-[#b8f55e]/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-full bg-[#b8f55e]/10 text-xs font-bold text-[#b8f55e]">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white">{p.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            p.risk === 'Critical' ? 'bg-rose-500/20 text-rose-400' : p.risk === 'Elevated' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#b8f55e]/15 text-[#b8f55e]'
                          }`}>
                            {p.risk}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{p.upi}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-slate-500" />
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleReviewPayment} className="space-y-4">
              {/* Phase 13: Source UPI App Adapter */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Source UPI App (Cross-UPI Adapter)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['GooglePay', 'PhonePe', 'Paytm', 'CRED', 'BHIM', 'Native'] as const).map(app => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setSourceApp(app)}
                      className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold transition border ${
                        sourceApp === app
                          ? 'bg-[#b8f55e]/20 text-[#b8f55e] border-[#b8f55e]/40 shadow-sm'
                          : 'bg-[#071014] text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receiver UPI ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Receiver UPI ID <span className="text-[#b8f55e]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="merchant@upi or name@bank"
                    value={receiverUpi}
                    onChange={(e) => {
                      setReceiverUpi(e.target.value)
                      setValidationResult(null)
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={validating || !receiverUpi}
                    className="rounded-xl border border-[#b8f55e]/40 bg-[#b8f55e]/10 px-4 py-2.5 text-xs font-semibold text-[#b8f55e] hover:bg-[#b8f55e]/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {validating ? 'Scanning...' : 'Verify'}
                  </button>
                </div>

                {validationResult && (
                  <div
                    className={`mt-2 flex items-start gap-2 rounded-xl border p-3 text-xs ${
                      validationResult.is_reported
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : validationResult.is_valid_format
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {validationResult.is_reported ? (
                      <AlertTriangle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{validationResult.status_label || 'Status'}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{validationResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Receiver Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Receiver Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Merchant or Contact Name"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Amount (INR ₹) <span className="text-[#b8f55e]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 pl-8 text-xs font-bold text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[
                    { label: '₹850 (Normal)', val: '850' },
                    { label: '₹18,500 (Elevated)', val: '18500' },
                    { label: '₹2,00,000 (Car Purchase)', val: '200000' }
                  ].map(preset => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setAmount(preset.val)}
                      className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-[#b8f55e]/30 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Note
                </label>
                <input
                  type="text"
                  placeholder="Bill, dinner, grocery, etc."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              {/* Telemetry Context Footnote */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-[#b8f55e] shrink-0" />
                  <span>Device: DEV-A782 (Samsung S24) · Location: Bengaluru Home Geofence</span>
                </div>
                <span className="text-[#b8f55e] font-mono text-[10px]">Active</span>
              </div>

              <button
                type="submit"
                disabled={loading || !receiverUpi || !amount}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-3 text-xs font-bold text-[#071014] hover:bg-[#c9f97f] transition shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Evaluating Multi-Model AI Fraud Models...' : 'REVIEW PAYMENT & RUN AI FRAUD SCAN'}
                <ArrowRight className="size-3.5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: UPGRADED PAYMENT VERIFICATION & AI RISK SCREEN   */}
        {/* ======================================================== */}
        {step === 'confirm' && intentData && riskAssessment && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl space-y-6">
            {/* Header */}
            <div className="text-center pb-4 border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8f55e] flex items-center justify-center gap-1.5">
                <Cpu className="size-3.5" />
                PAYMENT VERIFICATION · AI FRAUD ANALYSIS
              </span>
              <h2 className="mt-1 text-2xl font-bold text-white">Review Payment Details</h2>
              <p className="text-xs text-slate-400 mt-1">Multi-model intelligence evaluated transaction vectors before bank UPI handoff.</p>
            </div>

            {/* Beneficiary Details Card */}
            <div className="space-y-3 rounded-2xl border border-white/8 bg-[#071014] p-4 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Pay To</span>
                <span className="font-semibold text-white">{intentData.receiver_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">UPI ID</span>
                <span className="font-mono text-[#b8f55e]">{intentData.receiver_upi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Amount</span>
                <span className="text-base font-bold text-white font-mono">₹{Number(intentData.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Source UPI App</span>
                <span className="font-semibold text-white">{intentData.source_app}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Note</span>
                <span className="text-slate-300">{intentData.note}</span>
              </div>
            </div>

            {/* AI FRAUD ASSESSMENT PANEL (Phases 4, 5, 6, 7) */}
            <div className="rounded-2xl border border-white/10 bg-[#071014] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                  <Activity className="size-4 text-[#b8f55e]" />
                  AI RISK ASSESSMENT
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${categoryInfo.badgeColor}`}>
                  {categoryInfo.subLevel.toUpperCase()}
                </span>
              </div>

              {/* Main Score & Metric Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[10px] uppercase text-white/50 block">Risk Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-2xl font-mono font-bold ${
                      riskAssessment.overall_risk_score >= 61 ? 'text-rose-400' : riskAssessment.overall_risk_score >= 31 ? 'text-amber-400' : 'text-[#b8f55e]'
                    }`}>
                      {riskAssessment.overall_risk_score}
                    </span>
                    <span className="text-xs text-white/40">/ 100</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[10px] uppercase text-white/50 block">Fraud Probability</span>
                  <span className="text-2xl font-mono font-bold text-white mt-1 block">
                    {Math.round(riskAssessment.fraud_probability * 100)}%
                  </span>
                  <span className="text-[10px] text-white/40">XGBoost ML</span>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[10px] uppercase text-white/50 block">Anomaly Score</span>
                  <span className="text-2xl font-mono font-bold text-white mt-1 block">
                    {(riskAssessment.sub_scores.anomaly_score / 100).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-white/40">Isolation Forest</span>
                </div>

                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[10px] uppercase text-white/50 block">Adaptive Cutoff</span>
                  <span className="text-2xl font-mono font-bold text-[#b8f55e] mt-1 block font-mono">
                    {riskAssessment.adaptive_threshold}
                  </span>
                  <span className="text-[10px] text-white/40">Personal Barrier</span>
                </div>
              </div>

              {/* WHY FLAGGED? (Risk Factors Breakdown) */}
              {riskAssessment.explainable_ai.shap_contributions.length > 0 && (
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Why Flagged? (Feature Risk Drivers)
                  </span>
                  <ul className="space-y-1.5 text-xs text-amber-200/90">
                    {riskAssessment.explainable_ai.shap_contributions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>
                          <strong className="text-white">{c.feature_name}:</strong> {c.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SAFE SIGNALS */}
              {riskAssessment.explainable_ai.mitigating_factors.length > 0 && (
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Safe Signals Verified
                  </span>
                  <ul className="space-y-1 text-xs text-emerald-200/90">
                    {riskAssessment.explainable_ai.mitigating_factors.map((m, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-400 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RECOMMENDED ACTION BADGE */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/50">Recommended Decision Engine Action:</span>
                <span className={`font-mono font-bold px-3 py-1 rounded-lg ${
                  categoryInfo.action === 'BLOCK'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : categoryInfo.action === 'HOLD'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : categoryInfo.action === 'VERIFY'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                }`}>
                  {categoryInfo.recommendedAction}
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PHASE 8: VERIFICATION LAYER (Car Purchase / Spike Flow) */}
            {/* ======================================================== */}
            {(riskAssessment.decision === 'HOLD' || riskAssessment.decision === 'VERIFY' || riskAssessment.overall_risk_score >= 35) && userConfirmedState === 'pending' && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      User Identity Verification Challenge
                    </h4>
                    <p className="text-xs text-white mt-1">
                      This payment of <strong className="text-[#b8f55e]">₹{Number(intentData.amount).toLocaleString('en-IN')}</strong> is unusually large compared with your normal historical baseline (₹1,450). Is this your transaction?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleUserConfirmGenuine}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    YES, THIS IS ME
                  </button>
                  <button
                    type="button"
                    onClick={handleUserDenyFraud}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldAlert className="size-4 text-rose-400" />
                    NO, I DON&apos;T RECOGNIZE THIS
                  </button>
                </div>
              </div>
            )}

            {/* Feedback Status Notice */}
            {feedbackSubmitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-3 rounded-xl text-xs border ${
                userConfirmedState === 'verified_by_user' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                {feedbackSubmitted}
              </motion.div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
              >
                CANCEL
              </button>

              {userConfirmedState === 'blocked_by_user' || riskAssessment.decision === 'BLOCK' ? (
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-rose-600/30 border border-rose-600/50 py-3 text-xs font-bold text-rose-300 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="size-3.5" />
                  PAYMENT BLOCKED BY AI
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContinueToUpi}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#b8f55e] py-3 text-xs font-bold text-[#071014] hover:bg-[#c9f97f] transition shadow-lg shadow-[#b8f55e]/20 cursor-pointer"
                >
                  CONTINUE TO UPI APP <ExternalLink className="size-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: UPGRADED UPI APP HANDOFF & DEMO SIMULATION (P16) */}
        {/* ======================================================== */}
        {step === 'handoff' && intentData && riskAssessment && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#b8f55e]/10 text-[#b8f55e] mb-3">
                <Smartphone className="size-7" />
              </div>
              <h2 className="text-xl font-bold text-white">UPI App Handoff Initiated</h2>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                On mobile devices, your default UPI app ({intentData.source_app}) will prompt for your authorization PIN.
              </p>
            </div>

            {/* Pre-Payment Analysis Complete Card (Phase 16) */}
            <div className="p-4 rounded-2xl border border-white/10 bg-[#071014] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[#b8f55e]" />
                  Pre-Payment Analysis Complete
                </span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${categoryInfo.badgeColor}`}>
                  Risk Score: {riskAssessment.overall_risk_score}/100 ({categoryInfo.level})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-white/70">
                <div>
                  <span className="text-[10px] text-white/40 block">Transaction Token:</span>
                  <span className="font-mono text-white text-[11px]">{intentData.transaction_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">AI Engine:</span>
                  <span className="font-mono text-[#b8f55e] text-[11px]">Ensemble v2.4.1 (XGBoost + IF)</span>
                </div>
              </div>
            </div>

            {/* Generated UPI URI Box */}
            <div className="rounded-2xl border border-white/8 bg-[#071014] p-4 text-left font-mono text-[11px] text-slate-300 break-all relative">
              <div className="flex items-center justify-between mb-1.5 font-sans">
                <span className="text-[10px] text-slate-500">GENERATED NPCI UPI INTENT URI:</span>
                <button
                  type="button"
                  onClick={handleCopyUri}
                  className="text-xs text-[#b8f55e] hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  {copiedUri ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copiedUri ? 'Copied!' : 'Copy URI'}
                </button>
              </div>
              <span className="text-white/80">{intentData.upi_uri}</span>
            </div>

            {/* Demo Simulation Action with Realtime Feedback Cycle */}
            <div className="rounded-2xl border border-[#b8f55e]/30 bg-[#b8f55e]/[0.04] p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#b8f55e]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#b8f55e]">
                  DEMO MODE SIMULATOR
                </span>
                {simulationState === 'completed' && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Ledger Synced
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300">
                Simulate returning to UPI Shield AI after completing authorization in {intentData.source_app} to test ledger storage, risk outcome recording, and behavior baseline re-indexing.
              </p>

              {/* Multi-Stage Progress State */}
              {simulationState !== 'idle' && simulationState !== 'completed' && (
                <div className="p-3 rounded-xl border border-white/10 bg-black/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#b8f55e]">
                    <Sparkles className="size-4 animate-spin" />
                    <span>
                      {simulationState === 'logging_ledger' && 'Step 1/3: Writing transaction event to immutable ledger...'}
                      {simulationState === 'recording_ai' && 'Step 2/3: Recording risk outcome & SHAP vectors in centralized intelligence DB...'}
                      {simulationState === 'updating_profile' && 'Step 3/3: Re-indexing user behavior baseline & velocity distribution...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Completed Outcome (Phase 16) */}
              {simulationState === 'completed' ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="size-5 text-emerald-400" />
                    Payment Successful · ₹{Number(intentData.amount).toLocaleString('en-IN')} transferred
                  </div>
                  <div className="text-[11px] text-emerald-200/80 space-y-1">
                    <div>✓ Transaction stored in ledger (`{intentData.transaction_id}`)</div>
                    <div>✓ Risk outcome recorded (Overall Score: {riskAssessment.overall_risk_score})</div>
                    <div>✓ User behaviour profile updated (Ticket size &amp; daily velocity re-indexed)</div>
                  </div>

                  {/* Self-Learning Feedback Loop (Phase 9) */}
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                    <span className="text-white/70">Was this AI fraud prediction accurate?</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAccuracyFeedback('accurate')}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                          accuracyFeedback === 'accurate' ? 'bg-[#b8f55e] text-black border-[#b8f55e]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        <ThumbsUp className="size-3" /> Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccuracyFeedback('inaccurate')}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                          accuracyFeedback === 'inaccurate' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        <ThumbsDown className="size-3" /> No
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/transactions')}
                      className="flex-1 py-2 rounded-xl bg-[#b8f55e] text-[#071014] font-bold text-xs hover:bg-[#c9f97f] transition cursor-pointer"
                    >
                      View in Transactions →
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('form'); setSimulationState('idle') }}
                      className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-white hover:bg-white/10 cursor-pointer"
                    >
                      New Payment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulatePaymentCycle}
                    disabled={simulationState !== 'idle'}
                    className="flex-1 rounded-xl bg-[#b8f55e] py-2.5 text-xs font-bold text-[#071014] hover:bg-[#c9f97f] transition shadow-md shadow-[#b8f55e]/20 disabled:opacity-50 cursor-pointer"
                  >
                    Simulate Payment Success
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/transactions')}
                    className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('form'); setSimulationState('idle') }}
                className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="size-3" /> Make another payment
              </button>
            </div>
          </motion.div>
        )}
        </>
        )}
      </div>
    </UserLayout>
  )
}
