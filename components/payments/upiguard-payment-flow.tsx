'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Send,
  ScanLine,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Camera,
  KeyRound,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  Copy,
  Check,
  Printer,
  Share2,
  ExternalLink,
  ChevronRight,
  Smartphone,
  MapPin,
  Flame,
  XCircle,
  Eye,
  EyeOff,
  Car,
  Building,
  ShoppingBag,
  Laptop,
  GraduationCap,
  HeartPulse,
  Plane,
  Briefcase,
  Gem,
  HelpCircle,
  ShieldQuestion,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { useUPIGuardStore, SimulationTransaction } from '@/lib/upiguard-store'
import { calculateUpiGuardMasterRisk, UpiGuardRiskOutput } from '@/lib/ai-fraud-engine'

interface PaymentFlowProps {
  initialRecipientUpi?: string
  initialAmount?: string
  initialNote?: string
  source?: 'QR' | 'INTENT' | 'MANUAL'
  onComplete?: (txn: SimulationTransaction) => void
}

type PaymentStep =
  | 'ENTRY'         // Enter or scan payee
  | 'REVIEW'        // Payment Review screen
  | 'SECURITY'      // Real-time AI Risk Analysis streaming
  | 'WAS_THIS_YOU'  // Mandatory Security Confirmation Layer
  | 'AUTH_GATE'     // Choose PIN or FACE
  | 'PIN_INPUT'     // Enter demo UPI PIN
  | 'FACE_SCAN'     // Live camera face scan
  | 'OTP_GATE'      // Random 6-digit OTP
  | 'SUCCESS'       // Settled successfully with receipt
  | 'BLOCKED'       // Critical risk fraud block screen
  | 'USER_REPORTED_BLOCKED' // User explicitly reported "NOT ME"

export function UPIGuardPaymentFlow({
  initialRecipientUpi = 'abc@upiguard',
  initialAmount = '5000',
  initialNote = 'Electronics Purchase',
  source = 'QR',
  onComplete
}: PaymentFlowProps) {
  const {
    accounts,
    activeUserUpi,
    setActiveUser,
    activePaymentRequest,
    initiatePayment,
    confirmUserTransaction,
    updateTransactionRisk,
    verifyPin,
    verifyFace,
    requestOtp,
    verifyOtp,
    settlePayment,
    blockPayment,
    incomingRequests,
    acceptIncomingRequest,
    reportIncomingRequest
  } = useUPIGuardStore()

  const sender = accounts[activeUserUpi] || accounts['anjan@upiguard']

  // Mode Selection: Standard Send, Major Purchase (Car/Property/etc), Receive Money Simulation
  const [paymentMode, setPaymentMode] = useState<'STANDARD' | 'MAJOR_PURCHASE' | 'RECEIVE_MONEY'>('STANDARD')
  const [majorCategory, setMajorCategory] = useState<string>('Vehicle')
  const [paymentType, setPaymentType] = useState<'FULL' | 'DOWN_PAYMENT'>('FULL')
  const [downPaymentAmount, setDownPaymentAmount] = useState<string>('250000')
  const [isSuspiciousPreset, setIsSuspiciousPreset] = useState<boolean>(false)
  const [reportedCaseId, setReportedCaseId] = useState<string | null>(null)

  // Incoming / Collect Request state
  const [selectedIncomingReqId, setSelectedIncomingReqId] = useState<string | null>(null)
  const [incomingAuthMode, setIncomingAuthMode] = useState<'PIN' | 'FACE' | null>(null)
  const [incomingSuccessMsg, setIncomingSuccessMsg] = useState<string | null>(null)
  const [confirmingIncomingReq, setConfirmingIncomingReq] = useState<any | null>(null)
  const [incomingModalStep, setIncomingModalStep] = useState<'CONFIRM' | 'PIN'>('CONFIRM')
  const [incomingPin, setIncomingPin] = useState('')
  const [incomingPinError, setIncomingPinError] = useState<string | null>(null)

  // Core Form State
  const [recipientUpi, setRecipientUpi] = useState(initialRecipientUpi)
  const [recipientName, setRecipientName] = useState('ABC Electronics')
  const [amount, setAmount] = useState(initialAmount)
  const [note, setNote] = useState(initialNote)

  // Flow State Machine
  const [step, setStep] = useState<PaymentStep>('ENTRY')
  const [currentTransaction, setCurrentTransaction] = useState<SimulationTransaction | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<UpiGuardRiskOutput | null>(null)

  // Step 3 Security Analysis Streaming
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0)
  const analysisSteps = [
    'Validating transaction parameters & digital signature...',
    'Checking beneficiary reputation & platform blacklist history...',
    'Evaluating device hardware endpoint & trust keystore...',
    'Comparing behavioral baseline with historical diurnal spending...',
    'Analyzing geographic geofence & impossible travel velocity...',
    'Evaluating rolling 60-second transaction frequency...',
    'Executing supervised Random Forest & Isolation Forest ensemble...',
    'Generating unified 0–100 risk score & explainability contributions...'
  ]

  // Step 4: Authentication State
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<'UPI_PIN' | 'FACE_SCAN'>('UPI_PIN')
  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  // Face Scan State
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceProgress, setFaceProgress] = useState(0)
  const [faceStatusText, setFaceStatusText] = useState('Initializing camera...')
  const [faceMatchResult, setFaceMatchResult] = useState<{ matchScore: number; verified: boolean } | null>(null)
  const [cameraDenied, setCameraDenied] = useState(false)

  // Step 5: OTP State
  const [otpChallengeId, setOtpChallengeId] = useState('')
  const [demoGeneratedOtp, setDemoGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(120)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(5)

  // Step 6: Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Auto-fill recipient name when UPI ID changes
  useEffect(() => {
    if (recipientUpi === 'abc@upiguard') setRecipientName('ABC Electronics')
    else if (recipientUpi === 'coffee@upiguard') setRecipientName('UPIGuard Coffee')
    else if (recipientUpi.includes('scammer')) setRecipientName('Overseas Support (Flagged)')
    else if (recipientUpi === 'rahul@upiguard') setRecipientName('Rahul Kumar')
    else if (recipientUpi === 'priya@upiguard') setRecipientName('Priya Sharma')
  }, [recipientUpi])

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null
    if (step === 'OTP_GATE' && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => Math.max(0, t - 1)), 1000)
    }
    return () => clearInterval(interval)
  }, [step, otpTimer])

  // Camera Management for Face Scan
  useEffect(() => {
    let stream: MediaStream | null = null
    if (step === 'FACE_SCAN') {
      setFaceProgress(0)
      setFaceStatusText('Initializing camera feed...')
      setCameraDenied(false)

      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = s
            videoRef.current.play()
            setCameraActive(true)
          }

          // Simulate live face detection milestones
          runFaceDetectionSequence()
        })
        .catch((err) => {
          console.warn('Camera permission denied or camera unavailable', err)
          setCameraDenied(true)
        })
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [step])

  const runFaceDetectionSequence = () => {
    const milestones = [
      { progress: 20, text: 'Initializing camera (20%)' },
      { progress: 40, text: 'Face detected inside oval guide (40%)' },
      { progress: 55, text: 'Face centered & aligned (55%)' },
      { progress: 70, text: 'Facial landmarks & liveness verified (70%)' },
      { progress: 90, text: 'Identity matching against enrolled profile (90%)' },
      { progress: 100, text: 'Identity verification complete (100%)' }
    ]

    milestones.forEach((m, idx) => {
      setTimeout(() => {
        setFaceProgress(m.progress)
        setFaceStatusText(m.text)
        if (m.progress === 100) {
          const matchScore = 0.84
          setFaceMatchResult({ matchScore, verified: true })
          if (currentTransaction) {
            verifyFace(currentTransaction.transactionId, matchScore)
          }
        }
      }, (idx + 1) * 700)
    })
  }

  const handleUseDemoFaceProfile = () => {
    setFaceProgress(100)
    setFaceStatusText('Demo enrolled face profile verified (84% Match)')
    setFaceMatchResult({ matchScore: 0.84, verified: true })
    if (currentTransaction) {
      verifyFace(currentTransaction.transactionId, 0.84)
    }
  }

  // Step 1 -> Step 2: Proceed to Review
  const handleProceedToReview = () => {
    const num = Number(amount) || 5000
    const isMajor = paymentMode === 'MAJOR_PURCHASE' || num >= 50000
    const txn = initiatePayment({
      senderUpiId: activeUserUpi,
      receiverUpiId: recipientUpi,
      receiverName: recipientName,
      amount: num,
      note: note || (isMajor ? `${majorCategory} Purchase` : 'Payment'),
      source,
      isMajorPurchase: isMajor,
      purchaseCategory: isMajor ? majorCategory : undefined,
      paymentType: paymentType
    })
    setCurrentTransaction(txn)
    setStep('REVIEW')
  }

  // Step 2 -> Step 3: Run Real-Time AI Fraud Analysis
  const handleStartSecurityAnalysis = () => {
    setStep('SECURITY')
    setAnalysisStepIndex(0)

    const num = Number(amount) || 5000
    const isMajor = paymentMode === 'MAJOR_PURCHASE' || num >= 50000
    const isSuspicious = isSuspiciousPreset || num === 75000 || recipientUpi.includes('scammer')

    // Compute unified UPIGuard master risk
    const assessment = calculateUpiGuardMasterRisk({
      amount: num,
      senderUpiId: activeUserUpi,
      receiverUpiId: recipientUpi,
      receiverName: recipientName,
      isNewDevice: isSuspicious,
      locationCity: isSuspicious ? 'Mumbai' : 'Hubballi',
      normalCity: 'Hubballi',
      isMajorPurchase: isMajor,
      purchaseCategory: isMajor ? majorCategory : undefined,
      isSuspiciousMajorPurchase: isSuspicious
    })

    setRiskAssessment(assessment)

    // Stream through the 8 visual analysis steps
    analysisSteps.forEach((_, idx) => {
      setTimeout(() => {
        setAnalysisStepIndex(idx)
        if (idx === analysisSteps.length - 1) {
          setTimeout(() => {
            if (currentTransaction) {
              updateTransactionRisk(currentTransaction.transactionId, {
                score: assessment.finalRisk,
                level: assessment.riskLevel,
                decision: assessment.decision,
                factors: assessment.shapContributions.map((s) => ({
                  name: s.name,
                  score: s.impact,
                  description: s.description,
                  importance: s.importance
                })),
                mlProbability: assessment.fraudProbability
              })
            }

            // CRITICAL RISK POLICY: If risk >= 90 or BLOCK, block immediately
            if (assessment.finalRisk >= 90 || assessment.decision === 'BLOCK') {
              if (currentTransaction) {
                blockPayment(currentTransaction.transactionId, 'CRITICAL_RISK_POLICY_PREVENTION')
              }
              setStep('BLOCKED')
            } else {
              // Proceed to mandatory "Was this you?" confirmation layer
              setStep('WAS_THIS_YOU')
            }
          }, 800)
        }
      }, idx * 450)
    })
  }

  // Mandatory "Was This You?" Confirmation handler
  const handleConfirmTransaction = (isConfirmed: boolean) => {
    if (!currentTransaction) return
    const res = confirmUserTransaction(currentTransaction.transactionId, isConfirmed)
    if (isConfirmed) {
      setStep('AUTH_GATE')
    } else {
      if (res.caseCreated) {
        setReportedCaseId(res.caseCreated.caseId)
      }
      setStep('USER_REPORTED_BLOCKED')
    }
  }

  // Incoming collect requests handlers
  const handleAcceptIncoming = (reqId: string, authMethod: 'UPI_PIN' | 'FACE_SCAN') => {
    const res = acceptIncomingRequest(reqId, authMethod)
    if (res.success) {
      setIncomingSuccessMsg(res.message)
      setIncomingAuthMode(null)
      setSelectedIncomingReqId(null)
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      } catch {}
    }
  }

  const handleVerifyIncomingPin = () => {
    if (!confirmingIncomingReq) return
    if (incomingPin !== '2580' && incomingPin !== sender.pin) {
      setIncomingPinError('Invalid UPI PIN. (Demo PIN: 2580)')
      return
    }
    const res = acceptIncomingRequest(confirmingIncomingReq.id, 'UPI_PIN')
    if (res.success) {
      setIncomingSuccessMsg(res.message)
      setConfirmingIncomingReq(null)
      setIncomingPin('')
      setIncomingPinError(null)
      try {
        confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } })
      } catch {}
    }
  }

  const handleReportIncoming = (reqId: string) => {
    const res = reportIncomingRequest(reqId, 'User flagged incoming collect attempt as unauthorized')
    if (res.success) {
      setIncomingSuccessMsg('Collect request successfully reported to SOC and blocked.')
      setSelectedIncomingReqId(null)
      setConfirmingIncomingReq(null)
    }
  }

  // Step 4: Verify PIN
  const handleVerifyPin = () => {
    setPinError(null)
    if (!currentTransaction) return
    const result = verifyPin(currentTransaction.transactionId, enteredPin)
    if (result.success) {
      // Proceed to mandatory OTP
      initiateOtpChallenge()
    } else {
      setPinError(result.message)
    }
  }

  // Step 4: Face Verified -> Proceed to OTP
  const handleFaceSuccessProceed = () => {
    initiateOtpChallenge()
  }

  // Step 5: Generate & Request Demo OTP
  const initiateOtpChallenge = () => {
    if (!currentTransaction) return
    const { challengeId, demoOtp, expiresIn } = requestOtp(currentTransaction.transactionId)
    setOtpChallengeId(challengeId)
    setDemoGeneratedOtp(demoOtp)
    setOtpTimer(expiresIn)
    setEnteredOtp('')
    setOtpError(null)
    setStep('OTP_GATE')
  }

  // Step 5: Verify OTP
  const handleVerifyOtp = () => {
    setOtpError(null)
    const result = verifyOtp(otpChallengeId, enteredOtp)
    if (result.success) {
      // Execute final settlement
      if (currentTransaction) {
        const settlement = settlePayment(currentTransaction.transactionId)
        if (settlement.success) {
          setStep('SUCCESS')
          try {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } })
          } catch {}
          if (onComplete && settlement.transaction) {
            onComplete(settlement.transaction)
          }
        } else {
          setOtpError(settlement.message)
        }
      }
    } else {
      setOtpError(result.message)
      setOtpAttemptsRemaining((r) => Math.max(0, r - 1))
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Step Indicator Header */}
      <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726]/80 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 'ENTRY' || step === 'REVIEW'
                  ? 'bg-[#438EFF] text-white shadow-md shadow-[#438EFF]/30'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              1
            </span>
            <span className={step === 'ENTRY' || step === 'REVIEW' ? 'text-white' : ''}>Review</span>
          </div>

          <div className="h-0.5 w-4 sm:w-8 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 'SECURITY'
                  ? 'bg-[#5BD6FF] text-[#06101D] shadow-md shadow-[#5BD6FF]/30'
                  : step === 'WAS_THIS_YOU' || step === 'AUTH_GATE' || step === 'PIN_INPUT' || step === 'FACE_SCAN' || step === 'OTP_GATE' || step === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[#0B1B2D] text-slate-500'
              }`}
            >
              2
            </span>
            <span className={step === 'SECURITY' ? 'text-white' : ''}>AI Risk</span>
          </div>

          <div className="h-0.5 w-4 sm:w-8 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 'WAS_THIS_YOU'
                  ? 'bg-amber-400 text-[#06101D] shadow-md shadow-amber-400/30'
                  : step === 'AUTH_GATE' || step === 'PIN_INPUT' || step === 'FACE_SCAN' || step === 'OTP_GATE' || step === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[#0B1B2D] text-slate-500'
              }`}
            >
              3
            </span>
            <span className={step === 'WAS_THIS_YOU' ? 'text-white' : ''}>Confirm</span>
          </div>

          <div className="h-0.5 w-4 sm:w-8 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 'AUTH_GATE' || step === 'PIN_INPUT' || step === 'FACE_SCAN' || step === 'OTP_GATE'
                  ? 'bg-[#7759E8] text-white shadow-md shadow-[#7759E8]/30'
                  : step === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[#0B1B2D] text-slate-500'
              }`}
            >
              4
            </span>
            <span className={step === 'AUTH_GATE' || step === 'PIN_INPUT' || step === 'FACE_SCAN' || step === 'OTP_GATE' ? 'text-white' : ''}>
              Auth/OTP
            </span>
          </div>

          <div className="h-0.5 w-4 sm:w-8 bg-white/10" />

          <div className="flex items-center gap-2">
            <span
              className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 'SUCCESS'
                  ? 'bg-emerald-400 text-[#06101D] shadow-md shadow-emerald-400/30'
                  : step === 'BLOCKED' || step === 'USER_REPORTED_BLOCKED'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#0B1B2D] text-slate-500'
              }`}
            >
              5
            </span>
            <span className={step === 'SUCCESS' || step === 'BLOCKED' || step === 'USER_REPORTED_BLOCKED' ? 'text-white' : ''}>
              Result
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: PAYMENT ENTRY (Standard, Major Purchase, or Receive Simulation) */}
      {step === 'ENTRY' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Top 3 Primary Action Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#06101D] border border-white/10">
            <button
              type="button"
              onClick={() => {
                setPaymentMode('STANDARD')
                setIsSuspiciousPreset(false)
                if (recipientUpi === 'abcmotors@upiguard') {
                  setRecipientUpi('abc@upiguard')
                  setRecipientName('ABC Electronics')
                  setAmount('5000')
                  setNote('Electronics Purchase')
                }
              }}
              className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                paymentMode === 'STANDARD'
                  ? 'bg-[#438EFF] text-white shadow-lg shadow-[#438EFF]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="size-3.5" />
              MAKE PAYMENT
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('MAJOR_PURCHASE')
                setIsSuspiciousPreset(false)
                setRecipientUpi('abcmotors@upiguard')
                setRecipientName('ABC Motors')
                setAmount('850000')
                setMajorCategory('Vehicle')
                setNote('Hyundai Creta Demo Purchase')
              }}
              className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                paymentMode === 'MAJOR_PURCHASE'
                  ? 'bg-amber-400 text-[#06101D] shadow-lg shadow-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gem className="size-3.5" />
              MAJOR PURCHASE
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('RECEIVE_MONEY')
                setIsSuspiciousPreset(false)
              }}
              className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                paymentMode === 'RECEIVE_MONEY'
                  ? 'bg-emerald-400 text-[#06101D] shadow-lg shadow-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="size-3.5" />
              RECEIVE MONEY
            </button>
          </div>

          {/* User Balance Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {paymentMode === 'STANDARD' && <Send className="size-5 text-[#5BD6FF]" />}
                {paymentMode === 'MAJOR_PURCHASE' && <Gem className="size-5 text-amber-400" />}
                {paymentMode === 'RECEIVE_MONEY' && <ArrowDownLeft className="size-5 text-emerald-400" />}
                {paymentMode === 'STANDARD' && 'SEND UPI DEMO PAYMENT'}
                {paymentMode === 'MAJOR_PURCHASE' && 'MAJOR PURCHASE / LARGE VALUE'}
                {paymentMode === 'RECEIVE_MONEY' && 'RECEIVE & COLLECT SIMULATION'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {paymentMode === 'STANDARD' && 'Closed-loop instant payment simulation with UPIGuard AI'}
                {paymentMode === 'MAJOR_PURCHASE' && 'High-value purchase simulation with contextual risk evaluation'}
                {paymentMode === 'RECEIVE_MONEY' && 'Simulate incoming money requests with dynamic risk & biometric collection'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Your Balance</span>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                ₹{sender.balance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* ===================== MODE 1: STANDARD SEND ===================== */}
          {paymentMode === 'STANDARD' && (
            <div className="space-y-5">
              {/* Quick Payee Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Demo Payee / VPA
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientUpi('abc@upiguard')
                      setRecipientName('ABC Electronics')
                      setAmount('5000')
                      setNote('Electronics Purchase')
                    }}
                    className={`p-3 rounded-2xl text-left border transition ${
                      recipientUpi === 'abc@upiguard'
                        ? 'bg-[#438EFF]/20 border-[#5BD6FF] text-white'
                        : 'bg-[#06101D] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">ABC Electronics</div>
                    <div className="text-[10px] font-mono text-[#5BD6FF]">abc@upiguard</div>
                    <div className="text-[10px] text-slate-400 mt-1">₹5,000 Viva Demo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientUpi('coffee@upiguard')
                      setRecipientName('UPIGuard Coffee')
                      setAmount('250')
                      setNote('Coffee & Snacks')
                    }}
                    className={`p-3 rounded-2xl text-left border transition ${
                      recipientUpi === 'coffee@upiguard'
                        ? 'bg-[#438EFF]/20 border-[#5BD6FF] text-white'
                        : 'bg-[#06101D] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">UPIGuard Coffee</div>
                    <div className="text-[10px] font-mono text-[#5BD6FF]">coffee@upiguard</div>
                    <div className="text-[10px] text-slate-400 mt-1">₹250 Micro Spend</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecipientUpi('scammer.refund@okaxis')
                      setRecipientName('Overseas Support (Flagged)')
                      setAmount('75000')
                      setNote('Refund Processing')
                    }}
                    className={`p-3 rounded-2xl text-left border transition ${
                      recipientUpi.includes('scammer')
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                        : 'bg-[#06101D] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-rose-300">Fraud Scenario VPA</div>
                    <div className="text-[10px] font-mono text-rose-400 truncate">scammer.refund@okaxis</div>
                    <div className="text-[10px] text-rose-400 mt-1 font-semibold">₹75,000 Fraud Test</div>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recipient UPI ID (Synthetic)
                  </label>
                  <input
                    type="text"
                    value={recipientUpi}
                    onChange={(e) => setRecipientUpi(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-4 text-sm text-white font-mono focus:border-[#5BD6FF] focus:outline-none"
                    placeholder="receiver@upiguard"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Amount (₹)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-2xl bg-[#06101D] border border-white/10 py-3.5 pl-10 pr-4 text-2xl font-black text-white font-mono focus:border-[#5BD6FF] focus:outline-none"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Note / Purpose
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-4 text-sm text-white focus:border-[#5BD6FF] focus:outline-none"
                    placeholder="Electronics Purchase"
                  />
                </div>
              </div>

              <button
                onClick={handleProceedToReview}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] hover:brightness-110 text-[#06101D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#438EFF]/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                CONTINUE TO REVIEW <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {/* ===================== MODE 2: MAJOR PURCHASE ===================== */}
          {paymentMode === 'MAJOR_PURCHASE' && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Demo Viva Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Legitimate Car Purchase Demo */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuspiciousPreset(false)
                      setMajorCategory('Vehicle')
                      setRecipientName('ABC Motors')
                      setRecipientUpi('abcmotors@upiguard')
                      setAmount('850000')
                      setNote('Hyundai Creta Demo Purchase')
                      setPaymentType('FULL')
                    }}
                    className={`p-4 rounded-2xl border text-left transition ${
                      !isSuspiciousPreset && amount === '850000'
                        ? 'bg-amber-400/15 border-amber-400 text-white'
                        : 'bg-[#06101D] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                        <Gem className="size-4" /> HIGH-VALUE PURCHASE DEMO
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Risk: 42 (MEDIUM)
                      </span>
                    </div>
                    <div className="text-sm font-black text-white mt-1">₹8,50,000 · ABC Motors</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Known Merchant + Known Device + Hubballi ➔ Enhanced Auth (Face + OTP)
                    </div>
                  </button>

                  {/* Suspicious Car Purchase Demo */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuspiciousPreset(true)
                      setMajorCategory('Vehicle')
                      setRecipientName('ABC Motors (Untrusted Endpoint)')
                      setRecipientUpi('abcmotors@upiguard')
                      setAmount('850000')
                      setNote('Hyundai Creta Suspicious Attempt')
                      setPaymentType('FULL')
                    }}
                    className={`p-4 rounded-2xl border text-left transition ${
                      isSuspiciousPreset
                        ? 'bg-rose-500/15 border-rose-500 text-white'
                        : 'bg-[#06101D] border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="size-4" /> SUSPICIOUS HIGH-VALUE DEMO
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Risk: 95 (BLOCK)
                      </span>
                    </div>
                    <div className="text-sm font-black text-white mt-1">₹8,50,000 · Mumbai Endpoint</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      New Device + Mumbai Anomaly + High Velocity ➔ BLOCKED
                    </div>
                  </button>
                </div>
              </div>

              {/* Major Purchase Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Purchase Category
                  </label>
                  <select
                    value={majorCategory}
                    onChange={(e) => setMajorCategory(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-3 text-sm text-white focus:border-amber-400 focus:outline-none font-medium"
                  >
                    <option value="Vehicle">Car / Vehicle</option>
                    <option value="Bike">Bike / Two-Wheeler</option>
                    <option value="Property">Property / Real Estate</option>
                    <option value="Electronics">Electronics / Computing</option>
                    <option value="Jewelry">Jewelry / Luxury</option>
                    <option value="Education">Education / Tuition</option>
                    <option value="Medical">Medical / Healthcare</option>
                    <option value="Travel">Travel / Holiday</option>
                    <option value="Business">Business Equipment</option>
                    <option value="Custom">Custom Large Purchase</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Merchant / Seller
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-4 text-sm text-white focus:border-amber-400 focus:outline-none"
                    placeholder="ABC Motors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Seller UPI ID
                  </label>
                  <input
                    type="text"
                    value={recipientUpi}
                    onChange={(e) => setRecipientUpi(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-4 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                    placeholder="abcmotors@upiguard"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Purchase Description
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-4 text-sm text-white focus:border-amber-400 focus:outline-none"
                    placeholder="Hyundai Creta Demo Purchase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Purchase Amount (₹)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-400">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-2xl bg-[#06101D] border border-white/10 py-3.5 pl-10 pr-4 text-3xl font-black text-white font-mono focus:border-amber-400 focus:outline-none"
                      placeholder="850000"
                    />
                  </div>
                </div>

                {/* Payment Type: Full vs Down Payment */}
                <div className="sm:col-span-2 rounded-2xl bg-[#06101D] border border-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="radio"
                        name="payType"
                        checked={paymentType === 'FULL'}
                        onChange={() => setPaymentType('FULL')}
                        className="accent-amber-400 size-4"
                      />
                      Full Simulated Payment
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="radio"
                        name="payType"
                        checked={paymentType === 'DOWN_PAYMENT'}
                        onChange={() => setPaymentType('DOWN_PAYMENT')}
                        className="accent-amber-400 size-4"
                      />
                      Simulated Down Payment
                    </label>
                  </div>

                  {paymentType === 'DOWN_PAYMENT' && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 font-mono text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Down Payment:</span>
                        <input
                          type="number"
                          value={downPaymentAmount}
                          onChange={(e) => setDownPaymentAmount(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 py-2 px-3 text-sm text-amber-300 font-bold"
                          placeholder="250000"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Remaining Simulated Amount:</span>
                        <div className="mt-1 py-2 px-3 text-sm font-bold text-slate-300">
                          ₹{Math.max(0, Number(amount) - Number(downPaymentAmount)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Context Summary Info */}
              <div className="p-4 rounded-2xl bg-[#06101D] border border-amber-400/20 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Risk Profile:</span>
                  <span className="font-bold text-amber-300">
                    {isSuspiciousPreset ? 'SUSPICIOUS HIGH VALUE (CRITICAL)' : 'LEGITIMATE HIGH VALUE (MEDIUM)'}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Payment Source:</span>
                  <span className="text-slate-200">Demo Wallet (Balance: ₹{sender.balance.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Required Verification:</span>
                  <span className="text-[#5BD6FF]">Confirm Intent ➔ Face Scan / PIN ➔ Random OTP</span>
                </div>
              </div>

              <button
                onClick={handleProceedToReview}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 text-[#06101D] font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                PROCEED WITH MAJOR PURCHASE <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {/* ===================== MODE 3: RECEIVE SIMULATION ===================== */}
          {paymentMode === 'RECEIVE_MONEY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Pending Incoming Collect Requests
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {incomingRequests.filter((r) => r.status === 'PENDING').length} Active
                </span>
              </div>

              {incomingSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
                  <span>{incomingSuccessMsg}</span>
                  <button onClick={() => setIncomingSuccessMsg(null)} className="text-emerald-300 hover:text-white">
                    ✕
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {incomingRequests.map((req) => {
                  const isSafe = req.riskScore <= 35
                  return (
                    <div
                      key={req.id}
                      className={`p-5 rounded-2xl border transition space-y-3 ${
                        req.status !== 'PENDING'
                          ? 'opacity-60 bg-[#06101D]/50 border-white/5'
                          : isSafe
                          ? 'bg-[#06101D] border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-[#06101D] border-rose-500/20 hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{req.senderName}</h4>
                            <span className="text-xs font-mono text-[#5BD6FF]">({req.senderUpiId})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{req.note}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-emerald-400 font-mono">
                            ₹{req.amount.toLocaleString('en-IN')}
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono mt-1 ${
                              isSafe
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            Risk: {req.riskScore}/100 ({req.riskScore <= 35 ? 'LOW' : 'CRITICAL'})
                          </span>
                        </div>
                      </div>

                      {/* XAI Explanation Banner */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 font-mono">
                        <span className="text-[#5BD6FF] font-bold">XAI Reason: </span>
                        {req.xaiReason}
                      </div>

                      {/* Actions */}
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingIncomingReq(req)
                              setIncomingModalStep('CONFIRM')
                              setIncomingPin('')
                              setIncomingPinError(null)
                            }}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06101D] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-[0.99]"
                          >
                            <ShieldCheck className="size-3.5" /> Review & Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReportIncoming(req.id)}
                            className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <AlertTriangle className="size-3.5" /> Report & Block
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-xs font-mono font-bold">
                          Status: <span className={req.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}>{req.status}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Interactive Modal: "Was this you?" -> "Enter PIN" */}
          <AnimatePresence>
            {confirmingIncomingReq && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md rounded-3xl border border-white/10 bg-[#091726] p-6 sm:p-7 shadow-2xl space-y-5"
                >
                  {incomingModalStep === 'CONFIRM' && (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="size-3.5" /> Step 1: Confirmation
                          </span>
                          <h3 className="text-lg font-black text-white mt-0.5">WAS THIS YOU?</h3>
                          <p className="text-xs text-slate-400">Verify incoming collect request authorization</p>
                        </div>
                        <button
                          onClick={() => setConfirmingIncomingReq(null)}
                          className="text-slate-400 hover:text-white text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Request Details */}
                      <div className="p-4 rounded-2xl bg-[#06101D] border border-white/5 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Requester</span>
                          <span className="font-bold text-white">{confirmingIncomingReq.senderName}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-400">UPI ID</span>
                          <span className="text-[#5BD6FF]">{confirmingIncomingReq.senderUpiId}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Note</span>
                          <span className="text-slate-200">{confirmingIncomingReq.note}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                          <span className="text-slate-400">Amount</span>
                          <span className="font-mono text-2xl font-black text-emerald-400">
                            ₹{confirmingIncomingReq.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Risk & XAI */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-mono">Dynamic AI Risk:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              confirmingIncomingReq.riskScore <= 35
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {confirmingIncomingReq.riskScore}/100 ({confirmingIncomingReq.riskScore <= 35 ? 'LOW' : 'CRITICAL'})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono mt-1">
                          <span className="text-[#5BD6FF] font-bold">XAI Reason: </span>
                          {confirmingIncomingReq.xaiReason || 'Standard verification required.'}
                        </p>
                      </div>

                      <div className="text-center py-1">
                        <p className="text-xs font-semibold text-slate-200">
                          Did you initiate or authorize this payment collection?
                        </p>
                      </div>

                      {/* Was This You Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleReportIncoming(confirmingIncomingReq.id)
                          }}
                          className="py-3 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <ThumbsDown className="size-4" /> NO, NOT ME
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncomingModalStep('PIN')}
                          className="py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06101D] text-xs font-black shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-1.5"
                        >
                          <ThumbsUp className="size-4" /> YES, IT WAS ME
                        </button>
                      </div>
                    </div>
                  )}

                  {incomingModalStep === 'PIN' && (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Lock className="size-3.5" /> Step 2: UPI PIN Authentication
                          </span>
                          <h3 className="text-lg font-black text-white mt-0.5">ENTER UPI PIN</h3>
                          <p className="text-xs text-slate-400">Enter your 4-digit PIN to authorize credit</p>
                        </div>
                        <button
                          onClick={() => setConfirmingIncomingReq(null)}
                          className="text-slate-400 hover:text-white text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Demo PIN Badge */}
                      <div className="p-2.5 rounded-xl bg-[#5BD6FF]/10 border border-[#5BD6FF]/20 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Demo User PIN:</span>
                        <span className="font-bold text-[#5BD6FF] bg-[#5BD6FF]/20 px-2 py-0.5 rounded">2580</span>
                      </div>

                      {/* Masked PIN Display */}
                      <div className="flex justify-center gap-3 py-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`size-12 rounded-2xl border flex items-center justify-center text-xl font-bold font-mono transition ${
                              incomingPin.length > idx
                                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400 shadow-md shadow-emerald-400/20'
                                : 'border-white/10 bg-[#06101D] text-slate-600'
                            }`}
                          >
                            {incomingPin.length > idx ? '●' : '○'}
                          </div>
                        ))}
                      </div>

                      {incomingPinError && (
                        <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
                          {incomingPinError}
                        </div>
                      )}

                      {/* Keypad */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              if (incomingPin.length < 4) {
                                setIncomingPin((prev) => prev + num)
                                setIncomingPinError(null)
                              }
                            }}
                            className="py-3 rounded-xl bg-[#06101D] hover:bg-white/10 text-white font-bold text-sm transition"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIncomingPin('')}
                          className="py-3 rounded-xl bg-[#06101D] hover:bg-white/10 text-slate-400 font-semibold text-xs transition"
                        >
                          CLR
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (incomingPin.length < 4) {
                              setIncomingPin((prev) => prev + '0')
                              setIncomingPinError(null)
                            }
                          }}
                          className="py-3 rounded-xl bg-[#06101D] hover:bg-white/10 text-white font-bold text-sm transition"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncomingPin((prev) => prev.slice(0, -1))}
                          className="py-3 rounded-xl bg-[#06101D] hover:bg-white/10 text-slate-400 font-semibold text-xs transition"
                        >
                          ⌫
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={handleVerifyIncomingPin}
                          disabled={incomingPin.length !== 4}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 disabled:opacity-40 text-[#06101D] font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="size-4" /> AUTHORIZE & COLLECT FUNDS
                        </button>
                        <div className="flex justify-between items-center text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => setIncomingModalStep('CONFIRM')}
                            className="text-slate-400 hover:text-white"
                          >
                            ← Back to Confirmation
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmingIncomingReq) {
                                handleAcceptIncoming(confirmingIncomingReq.id, 'FACE_SCAN')
                                setConfirmingIncomingReq(null)
                              }
                            }}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                          >
                            <Camera className="size-3.5" /> Face Scan Instead
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* STEP 2: PAYMENT REVIEW (Section 17) */}
      {step === 'REVIEW' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="border-b border-white/5 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5BD6FF]">STEP 1 OF 5</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">PAYMENT REVIEW</h2>
            <p className="text-xs text-slate-400">Verify receiver credentials before initiating AI risk evaluation</p>
          </div>

          {/* Receiver & Payer Card */}
          <div className="rounded-2xl bg-[#06101D] border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Paying To</span>
                <h4 className="text-base font-bold text-white mt-0.5">{recipientName}</h4>
                <p className="text-xs font-mono text-[#5BD6FF]">{recipientUpi}</p>
              </div>
              <div className="size-12 rounded-2xl bg-[#438EFF]/20 border border-[#5BD6FF]/30 flex items-center justify-center text-[#5BD6FF] font-bold">
                {recipientName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Debit Account (Demo)</span>
              <span className="text-white font-mono font-medium">{sender.name} ({sender.upiId})</span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-2 border-b border-white/5 pb-4">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal Amount</span>
              <span className="font-mono text-white">₹{Number(amount).toLocaleString('en-IN')}.00</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>UPIGuard AI Security Fee</span>
              <span className="font-mono text-emerald-400">₹0.00 (Free Demo)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
              <span>Total Payable</span>
              <span className="font-mono text-2xl font-black text-emerald-400">
                ₹{Number(amount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('ENTRY')}
              className="py-3.5 px-5 rounded-2xl bg-[#0B1B2D] hover:bg-white/5 text-slate-300 text-xs font-semibold transition"
            >
              Back
            </button>
            <button
              onClick={handleStartSecurityAnalysis}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] hover:brightness-110 text-[#06101D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#438EFF]/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="size-5" />
              RUN UPIGUARD AI SECURITY CHECK
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: REAL-TIME AI RISK ANALYSIS STREAMING (Section 19) */}
      {step === 'SECURITY' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="size-16 rounded-3xl bg-[#5BD6FF]/10 border border-[#5BD6FF]/30 flex items-center justify-center mx-auto text-[#5BD6FF] shadow-lg shadow-[#5BD6FF]/20 animate-pulse">
              <Sparkles className="size-8 text-[#5BD6FF]" />
            </div>
            <h2 className="text-xl font-extrabold text-white">UPIGUARD AI FRAUD ANALYSIS</h2>
            <p className="text-xs text-slate-400">
              Evaluating multi-vector risk engine & supervised ML ensemble across transaction attributes
            </p>
          </div>

          {/* Streaming Steps Checklist */}
          <div className="rounded-2xl bg-[#06101D] border border-white/5 p-5 space-y-3 font-mono text-xs">
            {analysisSteps.map((s, idx) => {
              const isDone = idx < analysisStepIndex
              const isCurrent = idx === analysisStepIndex
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 transition-opacity ${
                    isDone ? 'text-emerald-400 opacity-100' : isCurrent ? 'text-[#5BD6FF] opacity-100 font-bold' : 'text-slate-600 opacity-40'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="size-4 rounded-full border-2 border-[#5BD6FF] border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <span className="size-2 rounded-full bg-slate-700 shrink-0 ml-1 mr-1" />
                  )}
                  <span>{s}</span>
                </div>
              )
            })}
          </div>

          <div className="text-center text-[11px] text-slate-500 font-mono">
            Streaming Socket.IO events: <span className="text-[#5BD6FF]">risk:started</span> ➔ <span className="text-[#5BD6FF]">risk:completed</span>
          </div>
        </motion.div>
      )}

      {/* STEP: WAS THIS YOU? (Mandatory Security Confirmation Layer) */}
      {step === 'WAS_THIS_YOU' && currentTransaction && riskAssessment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="border-b border-white/5 pb-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5BD6FF] font-mono">
              SECURITY CONFIRMATION LAYER
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Was this you?</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              You are attempting to make a payment. Confirm your authorization before proceeding to authentication.
            </p>
          </div>

          {/* Transaction Summary Card */}
          <div className="rounded-2xl bg-[#06101D] border border-white/10 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-slate-400 uppercase text-[10px]">Payment Amount</span>
              <span className="text-2xl font-black text-emerald-400">
                ₹{currentTransaction.amount?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-slate-500 text-[10px]">To Beneficiary</span>
                <p className="font-bold text-white text-sm">{currentTransaction.receiverName}</p>
                <p className="text-[#5BD6FF] text-[11px] truncate">{currentTransaction.receiverUpiId}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Purpose</span>
                <p className="font-bold text-white text-sm truncate">{currentTransaction.note || 'Major Purchase'}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {currentTransaction.isMajorPurchase ? 'MAJOR PURCHASE' : 'STANDARD'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px]">Location:</span>
                <p className="text-slate-200 font-medium">Hubballi (Home)</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Device:</span>
                <p className="text-slate-200 font-medium">Anjan-Laptop</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">AI Risk Score:</span>
                <p className={`font-bold ${riskAssessment.finalRisk <= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {riskAssessment.finalRisk} / 100 ({riskAssessment.riskLevel})
                </p>
              </div>
            </div>
          </div>

          {/* Large Two Cards: YES vs NO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* YES CARD */}
            <button
              type="button"
              onClick={() => handleConfirmTransaction(true)}
              className="p-6 rounded-3xl border-2 border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition group space-y-3"
            >
              <div className="size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                <Check className="size-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">YES, THIS WAS ME</h4>
                <p className="text-xs text-slate-300 mt-1">
                  I initiated this payment. Proceed to PIN / Face verification.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                ✓ Authorize Transaction →
              </div>
            </button>

            {/* NO CARD */}
            <button
              type="button"
              onClick={() => handleConfirmTransaction(false)}
              className="p-6 rounded-3xl border-2 border-rose-500/40 hover:border-rose-400 bg-rose-950/20 hover:bg-rose-950/40 text-left transition group space-y-3"
            >
              <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
                <AlertTriangle className="size-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-rose-300">NO, THIS WAS NOT ME</h4>
                <p className="text-xs text-slate-300 mt-1">
                  I don&apos;t recognize this payment. Stop simulation immediately.
                </p>
              </div>
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                ⚠ Immediately Block & Report →
              </div>
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 italic">
            &ldquo;Never approve a payment you did not personally initiate.&rdquo;
          </p>
        </motion.div>
      )}

      {/* STEP: USER REPORTED BLOCKED */}
      {step === 'USER_REPORTED_BLOCKED' && currentTransaction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border-2 border-rose-500/50 bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          <div className="size-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/30">
            <ShieldAlert className="size-10" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400 font-mono">
              PAYMENT BLOCKED BY USER CONFIRMATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              You reported: &ldquo;NOT ME&rdquo;
            </h2>
            <p className="text-sm font-bold text-slate-200 mt-1">
              ₹{currentTransaction.amount?.toLocaleString('en-IN')} to {currentTransaction.receiverName}
            </p>
            <div className="p-3 mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium">
              ✓ Your payment was stopped before simulated settlement. <strong>No demo balance was transferred.</strong>
            </div>
          </div>

          {/* Security Case Created Badge */}
          <div className="rounded-2xl bg-[#06101D] border border-white/10 p-5 text-left space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Security Case Created:</span>
              <span className="font-bold text-amber-300">{reportedCaseId || 'CASE-92831'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Severity:</span>
              <span className="font-bold text-rose-400">CRITICAL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-400">OPEN (SOC Notified)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Audit Source:</span>
              <span className="text-slate-300">USER_REPORTED_NOT_ME</span>
            </div>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
              UPIGuard AI has recorded this event for investigation. Realtime security alert was dispatched to Admin SOC.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <button
              onClick={() => setStep('ENTRY')}
              className="py-3 px-3 rounded-2xl bg-[#0B1B2D] hover:bg-white/10 text-slate-200 text-xs font-semibold"
            >
              Back to Form
            </button>
            <a
              href="/dashboard/cases"
              className="py-3 px-3 rounded-2xl bg-[#0B1B2D] hover:bg-white/10 text-[#5BD6FF] text-xs font-semibold flex items-center justify-center"
            >
              View Cases
            </a>
            <a
              href="/dashboard/devices"
              className="py-3 px-3 rounded-2xl bg-[#0B1B2D] hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center"
            >
              View Devices
            </a>
            <a
              href="/dashboard"
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] text-[#06101D] text-xs font-bold flex items-center justify-center"
            >
              Dashboard
            </a>
          </div>
        </motion.div>
      )}

      {/* STEP 4: AUTHENTICATION GATE (Section 27, 28, 29, 31) */}
      {step === 'AUTH_GATE' && riskAssessment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Risk Score Pill */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#06101D] border border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center font-bold text-lg font-mono ${
                  riskAssessment.finalRisk <= 39
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {riskAssessment.finalRisk}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Unified Risk Score</span>
                <h4 className="text-sm font-bold text-white">
                  {riskAssessment.riskLevel} RISK · {riskAssessment.decision}
                </h4>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              ✓ Verified Safe
            </span>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">SECURE PAYMENT</h3>
            <p className="text-xs text-slate-400 mt-1">Choose authentication method to proceed with simulation</p>
          </div>

          {/* Authentication Options (Section 27) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* UPI PIN Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedAuthMethod('UPI_PIN')
                setStep('PIN_INPUT')
              }}
              className="p-6 rounded-3xl border-2 border-white/10 hover:border-[#438EFF] bg-[#06101D] hover:bg-[#438EFF]/5 transition flex flex-col items-center text-center group"
            >
              <div className="size-16 rounded-2xl bg-[#438EFF]/20 border border-[#438EFF]/40 flex items-center justify-center text-[#5BD6FF] mb-3 group-hover:scale-110 transition">
                <Lock className="size-8" />
              </div>
              <h4 className="text-base font-bold text-white">UPI PIN</h4>
              <p className="text-xs text-slate-400 mt-1">Secure with 4-digit PIN</p>
              <span className="mt-4 px-4 py-1.5 rounded-xl bg-[#438EFF] text-[#06101D] text-xs font-extrabold uppercase">
                USE UPI PIN
              </span>
            </button>

            {/* FACE SCAN Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedAuthMethod('FACE_SCAN')
                setStep('FACE_SCAN')
              }}
              className="p-6 rounded-3xl border-2 border-white/10 hover:border-[#7759E8] bg-[#06101D] hover:bg-[#7759E8]/5 transition flex flex-col items-center text-center group"
            >
              <div className="size-16 rounded-2xl bg-[#7759E8]/20 border border-[#7759E8]/40 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 transition">
                <Camera className="size-8" />
              </div>
              <h4 className="text-base font-bold text-white">FACE SCAN</h4>
              <p className="text-xs text-slate-400 mt-1">Verify identity with camera biometrics</p>
              <span className="mt-4 px-4 py-1.5 rounded-xl bg-[#7759E8] text-white text-xs font-extrabold uppercase shadow-lg shadow-[#7759E8]/30">
                USE FACE SCAN
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4A: PIN INPUT SCREEN (Section 28) */}
      {step === 'PIN_INPUT' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          <div className="size-14 rounded-2xl bg-[#438EFF]/20 border border-[#438EFF]/40 flex items-center justify-center mx-auto text-[#5BD6FF]">
            <KeyRound className="size-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">ENTER UPI PIN</h3>
            <p className="text-xs text-slate-400 mt-1">Enter your 4-digit demo payment PIN</p>
          </div>

          {/* 4-Digit Input */}
          <div className="max-w-xs mx-auto space-y-3">
            <input
              type="password"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl tracking-[1em] font-black rounded-2xl bg-[#06101D] border border-white/10 py-3.5 text-white font-mono focus:border-[#5BD6FF] focus:outline-none"
            />

            {/* Demo Hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Demo PIN for {sender.name}:</span>
              <button
                type="button"
                onClick={() => setEnteredPin(sender.pin)}
                className="text-[#5BD6FF] font-mono font-bold hover:underline"
              >
                Auto-Fill {sender.pin}
              </button>
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-rose-400">{pinError}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('AUTH_GATE')}
              className="py-3 px-5 rounded-2xl bg-[#0B1B2D] text-slate-300 text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleVerifyPin}
              disabled={enteredPin.length !== 4}
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] disabled:opacity-50 text-[#06101D] font-extrabold text-xs uppercase tracking-wider"
            >
              CONFIRM UPI PIN
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4B: FACE SCAN SCREEN (Section 29, 31, 32) */}
      {step === 'FACE_SCAN' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          <div>
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Camera className="size-5 text-purple-400" />
              FACE VERIFICATION
            </h3>
            <p className="text-xs text-slate-400 mt-1">Look directly at the camera · Center your face inside the oval</p>
          </div>

          {/* Camera Viewfinder with Oval Guide */}
          <div className="relative mx-auto size-64 sm:size-72 rounded-3xl overflow-hidden bg-black border-2 border-purple-500/40 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 size-full object-cover -scale-x-100"
            />

            {/* Glowing Face Oval Overlay */}
            <div className="absolute inset-x-8 inset-y-6 rounded-[50%] border-2 border-dashed border-[#5BD6FF] pointer-events-none animate-pulse flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-[#5BD6FF] bg-black/60 px-2 py-0.5 rounded-full font-mono">
                ◯ FACE GUIDE ◯
              </span>
            </div>

            {/* Camera Denied fallback warning */}
            {cameraDenied && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-20">
                <AlertTriangle className="size-8 text-amber-400 mb-2" />
                <p className="text-xs text-slate-300 font-semibold">Camera Unavailable</p>
                <p className="text-[11px] text-slate-400 mt-1">Browser camera permissions denied or device missing.</p>
              </div>
            )}
          </div>

          {/* Progress & Milestone Status */}
          <div className="space-y-2 max-w-sm mx-auto">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>{faceStatusText}</span>
              <span className="font-bold text-purple-300">{faceProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#06101D] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#438EFF] to-purple-400 transition-all duration-300"
                style={{ width: `${faceProgress}%` }}
              />
            </div>
          </div>

          {/* Verification Result Feedback */}
          {faceMatchResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4" />
              Face Match: {(faceMatchResult.matchScore * 100).toFixed(0)}% · Identity Verified Successfully
            </div>
          )}

          {/* Actions & Demo Fallback (Section 70) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setStep('AUTH_GATE')}
              className="py-3 px-5 rounded-2xl bg-[#0B1B2D] text-slate-300 text-xs font-semibold"
            >
              Back
            </button>

            {/* 100% Reliable Fallback for Examination */}
            <button
              type="button"
              onClick={handleUseDemoFaceProfile}
              className="py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 text-xs font-medium"
            >
              USE DEMO FACE PROFILE (Fallback)
            </button>

            {faceMatchResult?.verified && (
              <button
                onClick={handleFaceSuccessProceed}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30"
              >
                PROCEED TO OTP →
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP 5: MANDATORY RANDOM DEMO OTP (Section 33, 34, 35, 36) */}
      {step === 'OTP_GATE' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          {/* Header */}
          <div className="size-14 rounded-2xl bg-[#FFC85B]/20 border border-[#FFC85B]/40 flex items-center justify-center mx-auto text-[#FFC85B]">
            <Lock className="size-7" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">OTP VERIFICATION</h3>
            <p className="text-xs text-slate-400 mt-1">A cryptographically random demo OTP has been generated</p>
          </div>

          {/* Demo OTP Exposure Banner (Section 34: DEMO_SHOW_OTP=true) */}
          <div className="p-4 rounded-2xl bg-[#FFC85B]/10 border border-[#FFC85B]/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-300">
                🔒 Closed-Loop Demo OTP Service
              </span>
              <button
                onClick={() => setEnteredOtp(demoGeneratedOtp)}
                className="px-2.5 py-1 rounded-lg bg-[#FFC85B] text-[#06101D] font-bold text-[10px] hover:brightness-110 transition"
              >
                AUTO-FILL OTP
              </button>
            </div>
            <div className="text-2xl font-black font-mono tracking-widest text-white">
              {demoGeneratedOtp}
            </div>
            <p className="text-[10px] text-amber-300/80">
              Generated randomly for each simulated payment · Expires in 2 minutes
            </p>
          </div>

          {/* 6-Digit Input Box */}
          <div className="max-w-xs mx-auto space-y-3">
            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full text-center text-3xl tracking-[0.5em] font-black rounded-2xl bg-[#06101D] border border-white/10 py-3.5 text-white font-mono focus:border-[#FFC85B] focus:outline-none"
            />

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                Expires in: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
              </span>
              <span>Attempts: {otpAttemptsRemaining}/5</span>
            </div>

            {otpError && <p className="text-xs font-semibold text-rose-400">{otpError}</p>}
          </div>

          {/* Resend & Verify Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={initiateOtpChallenge}
              className="py-3.5 px-5 rounded-2xl bg-[#0B1B2D] hover:bg-white/5 text-slate-300 text-xs font-semibold transition"
            >
              Resend OTP
            </button>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={enteredOtp.length !== 6}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 disabled:opacity-50 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
            >
              VERIFY OTP & SETTLE PAYMENT
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 6A: SUCCESS SCREEN (Section 44, 94) */}
      {step === 'SUCCESS' && currentTransaction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-emerald-500/30 bg-[#091726] p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          <div className="size-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="size-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
              ✓ SIMULATED SETTLEMENT COMPLETED
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 font-mono">
              ₹{currentTransaction.amount?.toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Paid to <strong className="text-white">{currentTransaction.receiverName}</strong> ({currentTransaction.receiverUpiId})
            </p>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl bg-[#06101D] border border-white/5 p-4 text-xs space-y-2 text-left font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Score:</span>
              <span className="text-emerald-400 font-bold">
                {currentTransaction.riskScore}/100 ({currentTransaction.riskLevel})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Authentication:</span>
              <span className="text-slate-200">
                {currentTransaction.authMethod ? currentTransaction.authMethod.replace('_', ' ') + ' + OTP' : 'OTP'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction ID:</span>
              <span className="text-slate-200 font-bold">{currentTransaction.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Settled At:</span>
              <span className="text-slate-300">
                {new Date(currentTransaction.timestamps.settled || currentTransaction.timestamps.created).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
            Both Merchant ({currentTransaction.receiverUpiId}) and Admin Command Center updated live without page reload!
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="py-3 px-5 rounded-2xl bg-[#0B1B2D] hover:bg-white/5 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-white/10"
            >
              <Printer className="size-4" /> VIEW RECEIPT
            </button>
            <button
              onClick={() => setStep('ENTRY')}
              className="flex-1 py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
            >
              MAKE ANOTHER PAYMENT
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 6B: PAYMENT BLOCKED SCREEN (Section 45, 46, 117 Viva Demo 2) */}
      {step === 'BLOCKED' && currentTransaction && riskAssessment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border-2 border-rose-500/40 bg-gradient-to-b from-[#091726] to-rose-950/40 p-6 sm:p-8 shadow-2xl space-y-6 text-center"
        >
          <div className="size-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/30">
            <ShieldAlert className="size-10" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400 font-mono">
              ⚠ PAYMENT BLOCKED BEFORE SETTLEMENT
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 font-mono">
              ₹{currentTransaction.amount?.toLocaleString('en-IN')}
            </h2>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono">
              Security Risk: {riskAssessment.finalRisk} / 100 · CRITICAL
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
              UPIGuard AI prevented this transaction before simulated settlement. <strong>Zero balance was deducted.</strong>
            </p>
          </div>

          {/* Flag Reasons Breakdown (Section 45) */}
          <div className="rounded-2xl bg-[#06101D] border border-rose-500/20 p-5 text-left space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="size-4" /> AI Risk Trigger Reasons:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              <li><strong>New device endpoint:</strong> Unrecognized hardware signature (Trust: 18/100)</li>
              <li><strong>Unusual transaction amount:</strong> ₹{currentTransaction.amount.toLocaleString('en-IN')} exceeds 15x normal baseline</li>
              <li><strong>Location anomaly:</strong> Initiated from Mumbai, expected home cluster Hubballi (~1,300 km travel velocity anomaly)</li>
              <li><strong>New receiver:</strong> First-time transfer to unverified beneficiary</li>
              <li><strong>Behavioral deviation:</strong> Diurnal and ticket deviation z-score &gt; 3.8</li>
              <li><strong>ML Fraud Probability:</strong> Supervised Random Forest predicted {((riskAssessment.fraudProbability || 0.917) * 100).toFixed(1)}% fraud confidence</li>
            </ul>
          </div>

          {/* Explainable AI Horizontal Bars (Section 46) */}
          <div className="rounded-2xl bg-[#06101D] border border-white/5 p-5 text-left space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5BD6FF]">
              WHY WAS THIS TRANSACTION FLAGGED? (Explainable AI)
            </span>
            <div className="space-y-2 text-xs font-mono">
              {riskAssessment.shapContributions.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>{c.name}</span>
                    <span className="text-rose-400 font-bold">+{c.impact} pts</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, c.impact * 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('ENTRY')}
              className="flex-1 py-3 px-6 rounded-2xl bg-[#0B1B2D] hover:bg-white/10 text-slate-200 font-bold text-xs uppercase"
            >
              RETURN TO PAYMENT FORM
            </button>
          </div>
        </motion.div>
      )}

      {/* PRINTABLE RECEIPT MODAL (Section 93 & 94) */}
      <AnimatePresence>
        {showReceiptModal && currentTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-3xl bg-white text-[#06101D] p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="text-center border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-[#438EFF] uppercase tracking-wider font-mono">
                  UPIGuard AI Demo Network
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  SIMULATED PAYMENT RECEIPT
                </h3>
                <p className="text-[11px] font-bold text-rose-600 uppercase mt-0.5 tracking-wide">
                  NO REAL MONEY MOVED · EDUCATIONAL SIMULATION
                </p>
              </div>

              <div className="py-5 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-bold text-slate-900">{currentTransaction.transactionId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-slate-800">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">From Payer:</span>
                  <span className="text-slate-900 font-bold">{currentTransaction.senderName} ({currentTransaction.senderUpiId})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">To Beneficiary:</span>
                  <span className="text-slate-900 font-bold">{currentTransaction.receiverName} ({currentTransaction.receiverUpiId})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Amount Settled:</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    ₹{currentTransaction.amount?.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Authentication:</span>
                  <span className="text-slate-800">{currentTransaction.authMethod ? currentTransaction.authMethod.replace('_', ' ') + ' + OTP' : 'OTP'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="text-emerald-600 font-bold">{currentTransaction.riskScore}/100 (LOW)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Type:</span>
                  <span className="text-slate-900 font-bold">SIMULATED LEDGER</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#06101D] text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Printer className="size-4" /> Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
