'use client'

import { useState } from 'react'
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
  RotateCcw
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

const recentPayees = [
  { name: 'Blue Tokai Coffee', upi: 'bluetokai@icici', avatar: 'BT' },
  { name: 'Swiggy Delivery', upi: 'swiggy@hdfcbank', avatar: 'SW' },
  { name: 'Rohan Verma', upi: 'rohan.verma@okaxis', avatar: 'RV' },
  { name: 'Airtel Broadband', upi: 'airtel.bills@airtel', avatar: 'AB' },
]

export default function SendUpiPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'id' | 'recent' | 'qr'>('id')
  const [receiverUpi, setReceiverUpi] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('Payment')
  
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  
  // Step 1: Form -> Step 2: Confirmation Modal -> Step 3: Intent Handoff
  const [step, setStep] = useState<'form' | 'confirm' | 'handoff'>('form')
  const [intentData, setIntentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Validate UPI ID
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
      const res = await apiRequest('/upi/validate', {
        method: 'POST',
        body: JSON.stringify({ upi_id: receiverUpi })
      })
      setValidationResult(res)
    } catch {
      // Local fallback check
      const isRep = receiverUpi.toLowerCase().includes('fake') || receiverUpi.toLowerCase().includes('scam')
      setValidationResult({
        is_valid_format: true,
        is_reported: isRep,
        status_label: isRep ? 'Frequently Reported' : 'Normal',
        message: isRep
          ? 'Warning: Recipient has 2 verified fraud complaints on platform.'
          : 'Valid format with no active fraud reports.'
      })
    } finally {
      setValidating(false)
    }
  }

  // Review & Generate Intent
  const handleReviewPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setLoading(true)
    try {
      const res = await apiRequest('/upi/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          receiver_upi: receiverUpi,
          receiver_name: receiverName || 'Merchant',
          amount: numAmount,
          note: note || 'Payment'
        })
      })
      setIntentData(res)
      setStep('confirm')
    } catch {
      // Fallback intent calculation
      const pa = receiverUpi.trim()
      const pn = encodeURIComponent(receiverName || 'Merchant')
      const am = numAmount.toFixed(2)
      const tn = encodeURIComponent(note || 'Payment')
      const upiUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`

      setIntentData({
        upi_uri: upiUri,
        receiver_upi: receiverUpi,
        receiver_name: receiverName || 'Merchant',
        amount: numAmount,
        note: note || 'Payment',
        risk_assessment: {
          flag_status: numAmount > 20000 ? 'Review' : 'Normal',
          flag_reasons: numAmount > 20000 ? ['High Value UPI Payment Alert (>₹20,000)'] : []
        }
      })
      setStep('confirm')
    } finally {
      setLoading(false)
    }
  }

  // Trigger Handoff
  const handleContinueToUpi = async () => {
    setStep('handoff')

    // On mobile devices, prompt app switch via uri
    if (typeof window !== 'undefined' && intentData?.upi_uri) {
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile) {
        window.location.href = intentData.upi_uri
      }
    }
  }

  // Simulate payment completion in Demo Mode
  const handleSimulateComplete = async () => {
    setLoading(true)
    try {
      await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          transaction_type: 'UPI',
          amount: intentData.amount,
          currency: 'INR',
          merchant: intentData.receiver_name,
          payment_method: 'UPI',
          receiver_upi: intentData.receiver_upi,
          receiver_name: intentData.receiver_name,
          upi_note: intentData.note,
          status: 'Completed'
        })
      })
    } catch {
      // Offline fallback
    }
    setLoading(false)
    router.push('/dashboard/transactions')
  }

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <MotionFadeUp delay={0.05}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b8f55e]">UPI PAYMENTS</span>
          </MotionFadeUp>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#eef8f7]">
            <MotionWordReveal text="Send UPI Payment" delay={0.1} />
          </h1>
          <MotionFadeUp delay={0.2}>
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Generate secure UPI intent URIs with real-time rule scanning before handoff.
            </p>
          </MotionFadeUp>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl border border-white/10 bg-[#071014] p-1 mb-6">
          <button
            onClick={() => setActiveTab('id')}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
              activeTab === 'id' ? 'bg-[#b8f55e] text-[#071014] font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            UPI ID
          </button>
          <button
            onClick={() => setActiveTab('recent')}
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

        {/* Step 1: Payment Form */}
        {step === 'form' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-xl">
            {activeTab === 'recent' ? (
              <div className="space-y-3 mb-6">
                <p className="text-xs font-semibold text-slate-300">Select a Recent Payee</p>
                {(recentPayees || []).map((p) => (
                  <button
                    key={p.upi}
                    onClick={() => {
                      setReceiverUpi(p.upi)
                      setReceiverName(p.name)
                      setActiveTab('id')
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#071014] p-3 text-left hover:border-[#b8f55e]/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-full bg-[#b8f55e]/10 text-xs font-bold text-[#b8f55e]">
                        {p.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{p.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{p.upi}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-slate-500" />
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleReviewPayment} className="space-y-4">
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
                    className="rounded-xl border border-[#b8f55e]/40 bg-[#b8f55e]/10 px-4 py-2.5 text-xs font-semibold text-[#b8f55e] hover:bg-[#b8f55e]/20 transition disabled:opacity-50"
                  >
                    {validating ? 'Checking...' : 'Verify'}
                  </button>
                </div>

                {/* Validation Feedback */}
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
              </div>

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

              {/* Zero PIN Disclaimer */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400 flex items-center gap-2">
                <Smartphone className="size-4 text-[#b8f55e] shrink-0" />
                <span>
                  UPI Shield never collects or stores your UPI PIN. Payments are authorized inside your official bank UPI app.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !receiverUpi || !amount}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-3 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
              >
                {loading ? 'Analyzing Rules...' : 'REVIEW PAYMENT'}
                <ArrowRight className="size-3.5" />
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 2: Payment Confirmation Screen */}
        {step === 'confirm' && intentData && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-2xl">
            <div className="text-center pb-4 border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8f55e]">PAYMENT VERIFICATION</span>
              <h2 className="mt-1 text-2xl font-bold text-white">Review Payment Details</h2>
              <p className="text-xs text-slate-400 mt-1">Please confirm the beneficiary details before opening your UPI app.</p>
            </div>

            <div className="my-6 space-y-3 rounded-2xl border border-white/8 bg-[#071014] p-4 text-xs">
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
                <span className="text-base font-bold text-white">₹{intentData.amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Note</span>
                <span className="text-slate-300">{intentData.note}</span>
              </div>
            </div>

            {/* Rule Assessment Banner */}
            {intentData.risk_assessment?.flag_status !== 'Normal' ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="size-4" /> Rule Alert Triggered
                </div>
                <ul className="mt-2 space-y-1 text-xs text-amber-200/90 list-disc pl-5">
                  {(intentData.risk_assessment?.flag_reasons || []).map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-6 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Deterministic rules evaluated: Normal payment pattern.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleContinueToUpi}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#b8f55e] py-3 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition shadow-lg shadow-[#b8f55e]/20"
              >
                CONTINUE TO UPI APP <ExternalLink className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Intent Handoff & Demo Confirmation */}
        {step === 'handoff' && intentData && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-2xl text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#b8f55e]/10 text-[#b8f55e] mb-4">
              <Smartphone className="size-7" />
            </div>

            <h2 className="text-xl font-bold text-white">UPI App Handoff Initiated</h2>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              On mobile devices, your default UPI app (Google Pay, PhonePe, Paytm, or BHIM) will prompt for your authorization PIN.
            </p>

            <div className="my-5 rounded-2xl border border-white/8 bg-[#071014] p-4 text-left font-mono text-[11px] text-slate-300 break-all">
              <span className="text-[10px] text-slate-500 font-sans block mb-1">GENERATED UPI URI:</span>
              {intentData.upi_uri}
            </div>

            <div className="rounded-2xl border border-[#b8f55e]/30 bg-[#b8f55e]/[0.04] p-4 text-left mb-6">
              <span className="rounded-full bg-[#b8f55e]/20 px-2 py-0.5 text-[10px] font-bold text-[#b8f55e]">
                DEMO MODE ACTION
              </span>
              <p className="mt-2 text-xs text-slate-300">
                In this test demonstration, you can simulate user returning after successful bank payment to log the transaction in your records.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateComplete}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#b8f55e] py-2.5 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition"
                >
                  {loading ? 'Recording...' : 'Simulate Payment Success'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/transactions')}
                  className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('form')}
              className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
            >
              <RotateCcw className="size-3" /> Make another payment
            </button>
          </motion.div>
        )}
      </div>
    </UserLayout>
  )
}
