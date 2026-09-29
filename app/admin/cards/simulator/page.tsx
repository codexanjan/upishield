'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Scan,
  Lock,
  ChevronRight,
  TrendingUp,
  MapPin,
  Smartphone,
  Info
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore, CardTransaction } from '@/lib/upiguard-store'

interface SimulatorPreset {
  id: string
  name: string
  merchant: string
  amount: number
  category: string
  channel: 'Online' | 'POS' | 'Contactless' | 'In-App'
  city: string
  device: string
  expectedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  expectedOutcome: string
  description: string
}

const PRESETS: SimulatorPreset[] = [
  {
    id: 'NORMAL_CARD_PURCHASE',
    name: 'NORMAL CARD PURCHASE',
    merchant: 'ABC Electronics Hubballi',
    amount: 2500,
    category: 'Electronics',
    channel: 'Online',
    city: 'Hubballi',
    device: 'Anjan-Laptop (Trusted)',
    expectedRisk: 'LOW',
    expectedOutcome: 'Approved instantly with biometric OTP',
    description: 'Routine home-city purchase at verified local merchant.'
  },
  {
    id: 'LARGE_CARD_PURCHASE',
    name: 'CAR DOWN PAYMENT (VIVA TEST)',
    merchant: 'ABC Motors Hubballi',
    amount: 850000,
    category: 'Automotive',
    channel: 'POS',
    city: 'Hubballi',
    device: 'POS-HBL-9941',
    expectedRisk: 'MEDIUM',
    expectedOutcome: 'Step-Up Auth → Major Purchase Interconnection',
    description: 'Legitimate high-value vehicle transaction with enhanced multi-factor auth.'
  },
  {
    id: 'SUSPICIOUS_MUMBAI',
    name: 'NEW LOCATION ANOMALY',
    merchant: 'Zara Flagship Palladium',
    amount: 35000,
    category: 'Shopping',
    channel: 'POS',
    city: 'Mumbai',
    device: 'Unknown POS Terminal',
    expectedRisk: 'HIGH',
    expectedOutcome: 'Location penalty flagged (+25) unless Travel Mode ON',
    description: 'Out-of-region card swipe without active travel policy authorization.'
  },
  {
    id: 'IMPOSSIBLE_TRAVEL',
    name: 'IMPOSSIBLE PHYSICAL TRAVEL',
    merchant: 'Apple Store Aerocity',
    amount: 89900,
    category: 'Electronics',
    channel: 'POS',
    city: 'Delhi',
    device: 'POS-DEL-9941',
    expectedRisk: 'CRITICAL',
    expectedOutcome: 'Flagged for supersonic travel velocity (2,460 km/h)',
    description: 'Card swiped in Delhi 28 mins after transaction in Mumbai.'
  },
  {
    id: 'CATEGORY_VIOLATION',
    name: 'PROHIBITED CATEGORY POLICY',
    merchant: 'Offshore Betting Casino',
    amount: 15000,
    category: 'Gaming',
    channel: 'Online',
    city: 'Hubballi',
    device: 'Anjan-Laptop (Trusted)',
    expectedRisk: 'HIGH',
    expectedOutcome: 'Hard decline: Category explicitly blocked on card',
    description: 'Card policy strictly blocks gambling and unverified betting categories.'
  },
  {
    id: 'LIMIT_EXCEEDED',
    name: 'SPENDING LIMIT EXCEEDED',
    merchant: 'Prestige Jewelers',
    amount: 12500000,
    category: 'Shopping',
    channel: 'POS',
    city: 'Hubballi',
    device: 'POS-HBL-1029',
    expectedRisk: 'LOW',
    expectedOutcome: 'Declined before risk engine: Insufficient credit limit',
    description: 'Purchase exceeds available line of credit (Max ₹10,00,000).'
  },
  {
    id: 'CRITICAL_FRAUD',
    name: 'CRITICAL FRAUD / NEW MOTORS',
    merchant: 'Unknown Online Store Motors',
    amount: 850000,
    category: 'Automotive',
    channel: 'Online',
    city: 'Mumbai',
    device: 'Anonymous Linux Node',
    expectedRisk: 'CRITICAL',
    expectedOutcome: 'Score 95+ → "Was This You?" → Blocked & Auto-Frozen',
    description: 'Extreme multi-vector anomaly: new merchant + new device + unannounced location.'
  }
]

export default function AdminCardSimulatorPage() {
  const {
    virtualCards,
    activeCardId,
    simulateCardPayment,
    confirmCardTransaction,
    verifyCardAuth,
    requestCardOtp,
    verifyCardOtp,
    settleCardPayment,
    resetCardDemo
  } = useUPIGuardStore()

  const [selectedCardId, setSelectedCardId] = useState(activeCardId || virtualCards[0]?.cardId || '')
  const [selectedPreset, setSelectedPreset] = useState<SimulatorPreset>(PRESETS[1]) // Default to Car down payment
  const [currentStep, setCurrentStep] = useState<'READY' | 'ANALYZED' | 'WAS_THIS_YOU' | 'AUTH' | 'OTP' | 'FINISHED'>('READY')
  const [activeTxnId, setActiveTxnId] = useState<string | null>(null)
  const [riskBreakdown, setRiskBreakdown] = useState<any>(null)
  const [otpInfo, setOtpInfo] = useState<{ demoOtp: string } | null>(null)
  const [resultMsg, setResultMsg] = useState<{ status: 'APPROVED' | 'BLOCKED'; text: string } | null>(null)
  const [executionLog, setExecutionLog] = useState<string[]>([])

  const addLog = (msg: string) => {
    setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const handleRunPreset = () => {
    setResultMsg(null)
    setExecutionLog([])
    addLog(`Initiating card simulation for preset: ${selectedPreset.name}`)
    addLog(`Card: ${selectedCardId} | Amount: ₹${selectedPreset.amount.toLocaleString('en-IN')}`)

    const res = simulateCardPayment({
      cardId: selectedCardId,
      merchantName: selectedPreset.merchant,
      amount: selectedPreset.amount,
      category: selectedPreset.category,
      paymentChannel: selectedPreset.channel,
      location: { city: selectedPreset.city, country: 'India' },
      deviceId: selectedPreset.device,
      description: selectedPreset.description
    })

    if (!res.success) {
      addLog(`PRE-AUTH DECLINE: ${res.message}`)
      setResultMsg({ status: 'BLOCKED', text: res.message || 'Declined during limit check' })
      setCurrentStep('FINISHED')
      return
    }

    addLog(`Pre-auth validation passed. AI Risk Engine computed score: ${res.riskScore}/100 (${res.riskLevel})`)
    setActiveTxnId(res.transactionId || null)
    setRiskBreakdown(res)
    setCurrentStep('WAS_THIS_YOU')
  }

  const handleConfirmWasThisYou = (confirmed: boolean) => {
    if (!activeTxnId) return
    if (!confirmed) {
      addLog(`User selected: NO, THIS WAS NOT ME. SOC Alert triggered, transaction blocked.`)
      confirmCardTransaction(activeTxnId, false)
      setResultMsg({
        status: 'BLOCKED',
        text: 'User disputed simulated charge. Transaction blocked, card protected, security incident logged.'
      })
      setCurrentStep('FINISHED')
    } else {
      addLog(`User confirmed: YES, THIS WAS ME. Proceeding to multi-factor authentication step.`)
      confirmCardTransaction(activeTxnId, true)
      verifyCardAuth(activeTxnId, 'FACE_SCAN')
      addLog(`Biometric Face Scan verified matching facial geometry signature.`)
      
      const otpRes = requestCardOtp(activeTxnId)
      setOtpInfo({ demoOtp: otpRes.demoOtp })
      addLog(`Generated dynamic 6-digit random OTP: ${otpRes.demoOtp}`)
      setCurrentStep('OTP')
    }
  }

  const handleCompleteOtp = () => {
    if (!activeTxnId || !otpInfo) return
    addLog(`Verifying server-hashed OTP: ${otpInfo.demoOtp}`)
    verifyCardOtp(activeTxnId, otpInfo.demoOtp)
    
    addLog(`Executing closed-loop authorization and ledger settlement...`)
    const settle = settleCardPayment(activeTxnId)
    if (settle.success) {
      addLog(`Simulated settlement successful. Available credit deducted, expense logged, Major Purchase linked.`)
      setResultMsg({
        status: 'APPROVED',
        text: `Transaction ${activeTxnId} authorized and settled for ₹${selectedPreset.amount.toLocaleString('en-IN')}. Interconnected across Expenses, Budgets, and Personal Finance.`
      })
    } else {
      addLog(`Settlement rejected: ${settle.message}`)
      setResultMsg({ status: 'BLOCKED', text: settle.message })
    }
    setCurrentStep('FINISHED')
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ADMIN EVALUATION LAB
              </span>
              <span className="text-xs text-slate-400 font-mono">1-CLICK VIVA PRESETS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Virtual Card Viva Simulator
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute standard and adversarial card payment attack vectors to verify multi-layer fraud defenses live.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetCardDemo()
                setExecutionLog([])
                setCurrentStep('READY')
                setResultMsg(null)
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase flex items-center gap-1.5 border border-white/10"
            >
              <RotateCcw className="size-3.5" /> Reset State
            </button>
            <Link
              href="/admin/cards"
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase"
            >
              Back to Fleet
            </Link>
          </div>
        </div>

        {/* 2-Column Stage: Presets on Left, Interactive Pipeline & Logs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Presets List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Card Instrument
              </span>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#091726] border border-white/10 text-xs text-cyan-300 outline-none"
              >
                {virtualCards.map((c) => (
                  <option key={c.cardId} value={c.cardId}>
                    {c.nickname} (Limit ₹{(c.creditLimit / 100000).toFixed(1)}L)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {PRESETS.map((p) => {
                const isSelected = selectedPreset.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPreset(p)
                      setCurrentStep('READY')
                      setResultMsg(null)
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-cyan-400/50 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
                        : 'border-white/5 bg-[#091726] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        p.expectedRisk === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                        p.expectedRisk === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {p.expectedRisk} RISK
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-1.5 font-mono">
                      <span className="text-slate-300">{p.merchant}</span>
                      <span className="font-bold text-cyan-300">₹{p.amount.toLocaleString('en-IN')}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1">{p.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Execution Stage & Terminal Log */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Preset Summary Banner */}
            <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Configured Test Payload
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Channel: {selectedPreset.channel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">AMOUNT</span>
                  <span className="font-mono font-bold text-white">₹{selectedPreset.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">LOCATION</span>
                  <span className="font-bold text-white">{selectedPreset.city}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">CATEGORY</span>
                  <span className="font-bold text-white">{selectedPreset.category}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">DEVICE</span>
                  <span className="font-bold text-white truncate block">{selectedPreset.device}</span>
                </div>
              </div>

              {currentStep === 'READY' && (
                <button
                  onClick={handleRunPreset}
                  className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <Zap className="size-4" /> EXECUTE PIPELINE SIMULATION
                </button>
              )}
            </div>

            {/* Interactive Step 2: "WAS THIS YOU?" Confirmation */}
            {currentStep === 'WAS_THIS_YOU' && riskBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 backdrop-blur-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="text-xs font-black text-amber-400 uppercase">
                    USER CONFIRMATION STEP: "WAS THIS YOU?"
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    Score: {riskBreakdown.riskScore}/100
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Transaction requires explicit verification from cardholder for <strong>₹{selectedPreset.amount.toLocaleString('en-IN')}</strong> at <strong>{selectedPreset.merchant}</strong>.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleConfirmWasThisYou(false)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs uppercase"
                  >
                    NO, NOT ME (TRIGGER SOC ALERT)
                  </button>
                  <button
                    onClick={() => handleConfirmWasThisYou(true)}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase shadow-md"
                  >
                    YES, THIS WAS ME
                  </button>
                </div>
              </motion.div>
            )}

            {/* Interactive Step 3: Random OTP Verification */}
            {currentStep === 'OTP' && otpInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 backdrop-blur-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-black text-cyan-400 uppercase">
                    DYNAMIC 6-DIGIT RANDOM OTP GATE
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Biometric Scan Passed
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#091726] border border-cyan-500/30 text-center font-mono">
                  <span className="text-[10px] text-slate-400 uppercase block">Generated OTP</span>
                  <span className="text-2xl font-black tracking-[0.25em] text-white">{otpInfo.demoOtp}</span>
                </div>

                <button
                  onClick={handleCompleteOtp}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase shadow-md"
                >
                  VERIFY OTP & AUTHORIZE SETTLEMENT
                </button>
              </motion.div>
            )}

            {/* Step 4: Final Outcome */}
            {currentStep === 'FINISHED' && resultMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 backdrop-blur-xl space-y-2 ${
                  resultMsg.status === 'APPROVED'
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm uppercase">
                  {resultMsg.status === 'APPROVED' ? <CheckCircle2 className="size-5 text-emerald-400" /> : <ShieldAlert className="size-5 text-rose-400" />}
                  <span>{resultMsg.status === 'APPROVED' ? 'Simulation Completed: Approved' : 'Simulation Completed: Blocked'}</span>
                </div>
                <p className="text-xs">{resultMsg.text}</p>
                <button
                  onClick={() => setCurrentStep('READY')}
                  className="mt-2 text-xs font-bold text-cyan-400 hover:underline"
                >
                  Run Another Preset →
                </button>
              </motion.div>
            )}

            {/* Real-Time Terminal Log */}
            <div className="rounded-2xl border border-white/5 bg-[#091726]/90 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase border-b border-white/5 pb-2">
                <span>SYSTEM EXECUTION AUDIT TELEMETRY</span>
                <span>STATE: {currentStep}</span>
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1 text-[11px]">
                {executionLog.length === 0 ? (
                  <span className="text-slate-500 italic">Select a preset above and click Execute to start live trace...</span>
                ) : (
                  executionLog.map((log, i) => (
                    <div key={i} className="text-slate-300">
                      <span className="text-cyan-400">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
