'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'
import {
  Store,
  QrCode,
  IndianRupee,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Share2,
  Download,
  Wifi,
  Radio,
  Receipt
} from 'lucide-react'
import { MerchantLayout } from '@/components/layout/merchant-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export default function MerchantDashboardPage() {
  const {
    accounts,
    activeMerchantUpi,
    setActiveMerchant,
    activePaymentRequest,
    createMerchantQrRequest,
    clearActivePaymentRequest,
    transactions
  } = useUPIGuardStore()

  const merchant = accounts[activeMerchantUpi] || accounts['abc@upiguard']

  // Form State
  const [amount, setAmount] = useState('5000')
  const [note, setNote] = useState('Electronics Purchase')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copiedPayload, setCopiedPayload] = useState(false)
  
  // Real-time Payment Received State
  const [lastReceivedPayment, setLastReceivedPayment] = useState<any>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // Quick Amount presets
  const presetAmounts = ['250', '1250', '5000', '12000', '75000']

  // Generate QR code when active payment request exists or when generated
  useEffect(() => {
    if (activePaymentRequest && activePaymentRequest.qrPayload) {
      QRCode.toDataURL(activePaymentRequest.qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#06101D',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR', err))
    } else {
      setQrDataUrl(null)
    }
  }, [activePaymentRequest])

  // Listen to realtime payment settlement for this merchant
  useEffect(() => {
    const handleEvent = (e: any) => {
      const { type, payload } = e.detail || {}
      if (type === 'payment:settled' && payload?.receiverUpi === activeMerchantUpi) {
        setLastReceivedPayment(payload.transaction)
        setShowCelebration(true)
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          })
        } catch {}
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('upiguard_event', handleEvent)
      return () => window.removeEventListener('upiguard_event', handleEvent)
    }
  }, [activeMerchantUpi])

  const handleGenerateQr = () => {
    const num = Number(amount) || 5000
    createMerchantQrRequest(activeMerchantUpi, num, note)
    setLastReceivedPayment(null)
    setShowCelebration(false)
  }

  const handleCopyPayload = () => {
    if (activePaymentRequest?.qrPayload) {
      navigator.clipboard.writeText(activePaymentRequest.qrPayload)
      setCopiedPayload(true)
      setTimeout(() => setCopiedPayload(false), 2000)
    }
  }

  // Filter merchant transactions
  const merchantTransactions = transactions.filter(
    (t) => t.receiverUpiId === activeMerchantUpi
  )

  return (
    <MerchantLayout>
      <div className="space-y-8">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[#0B1B2D] bg-gradient-to-r from-[#091726] to-[#0B1B2D] p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#438EFF]/20 border border-[#438EFF]/40 text-[#5BD6FF]">
                  <span className="size-2 rounded-full bg-[#5BD6FF] animate-pulse" />
                  UPIGuard AI Terminal · Closed-Loop Demo
                </span>
                <span className="text-xs text-slate-400 font-mono">Location: {merchant.location}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
                {merchant.name}
              </h1>
              <p className="mt-1 text-sm text-slate-300 font-mono">
                UPI ID: <span className="text-[#5BD6FF] font-semibold">{merchant.upiId}</span>
              </p>
            </div>

            {/* Balance Card */}
            <div className="flex flex-col items-start md:items-end p-5 rounded-2xl bg-[#06101D]/70 border border-white/10 shadow-inner">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Available Demo Balance</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                  ₹{merchant.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1">Simulated balance · Auto-credits on payment</span>
            </div>
          </div>
        </div>

        {/* Payment Received Celebration Banner (Section 13) */}
        <AnimatePresence>
          {showCelebration && lastReceivedPayment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-950/80 to-[#091726] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="size-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="size-9 text-emerald-400 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                      ✓ Instant Settlement Completed
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-1">
                      ₹{lastReceivedPayment.amount?.toLocaleString('en-IN')} Received
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
                      <span>
                        Payer: <strong className="text-white">{lastReceivedPayment.senderName}</strong> ({lastReceivedPayment.senderUpiId})
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        Risk: {lastReceivedPayment.riskLevel} ({lastReceivedPayment.riskScore}/100)
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">Ref: {lastReceivedPayment.transactionId}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCelebration(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition border border-white/15"
                >
                  Dismiss Banner
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: Left = Payment Request Form, Right = Dynamic QR Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Create Payment Request */}
          <div className="lg:col-span-6 rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <QrCode className="size-5 text-[#5BD6FF]" />
                  CREATE PAYMENT REQUEST
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Generate UPI-compliant synthetic QR for customer scan</p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-[#5BD6FF]/10 text-[#5BD6FF] border border-[#5BD6FF]/20">
                Dynamic QR
              </span>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-2xl bg-[#06101D] border border-white/10 py-3.5 pl-10 pr-4 text-2xl font-black text-white font-mono placeholder:text-slate-600 focus:border-[#5BD6FF] focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                      amount === p
                        ? 'bg-[#438EFF] text-white border border-[#5BD6FF]'
                        : 'bg-[#0B1B2D] hover:bg-white/5 text-slate-300 border border-white/5'
                    }`}
                  >
                    ₹{Number(p).toLocaleString('en-IN')}
                    {p === '5000' && ' (Viva Demo)'}
                    {p === '75000' && ' (Fraud Test)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Transaction Note / Purpose
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Electronics Purchase"
                className="w-full rounded-2xl bg-[#06101D] border border-white/10 py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-[#5BD6FF] focus:outline-none"
              />
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateQr}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] hover:brightness-110 text-[#06101D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#438EFF]/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <QrCode className="size-5" />
              GENERATE PAYMENT QR
            </button>

            {/* Instructions box */}
            <div className="rounded-2xl bg-[#06101D]/60 border border-white/5 p-4 text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300">Viva Examination Live Workflow:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Click <strong>Generate Payment QR</strong> above with ₹5,000.</li>
                <li>In <strong>Window A (User App)</strong>, open <em>Scan & Pay</em> and scan this QR.</li>
                <li>Watch the AI risk analysis and complete authentication + OTP.</li>
                <li>This screen will automatically detect payment and update balance!</li>
              </ol>
            </div>
          </div>

          {/* Right: Dynamic QR Display Area */}
          <div className="lg:col-span-6 rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center text-center">
            {activePaymentRequest && qrDataUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                {/* Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  Waiting for payment... ● LIVE
                </div>

                <div className="text-center mb-4">
                  <div className="text-3xl font-black text-white font-mono">
                    ₹{activePaymentRequest.amount?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm font-bold text-slate-300 uppercase mt-0.5">
                    {merchant.name}
                  </div>
                  <div className="text-xs text-[#5BD6FF] font-mono">
                    {merchant.upiId}
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="p-4 rounded-3xl bg-white shadow-2xl border-4 border-[#5BD6FF]/30 relative group">
                  <img
                    src={qrDataUrl}
                    alt="UPI Payment QR Code"
                    className="size-60 rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center" />
                </div>

                {/* Raw URI and copy button */}
                <div className="w-full mt-4 p-3 rounded-2xl bg-[#06101D] border border-white/5 flex items-center justify-between gap-2 text-left">
                  <div className="truncate text-[11px] text-slate-400 font-mono">
                    {activePaymentRequest.qrPayload}
                  </div>
                  <button
                    onClick={handleCopyPayload}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0"
                    title="Copy UPI QR string"
                  >
                    {copiedPayload ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  </button>
                </div>

                {/* Reset / Clear Request */}
                <button
                  onClick={clearActivePaymentRequest}
                  className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Clear QR Request
                </button>
              </motion.div>
            ) : (
              <div className="py-16 px-4 flex flex-col items-center">
                <div className="size-20 rounded-3xl bg-[#06101D] border border-white/10 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
                  <QrCode className="size-10 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-white">No Active Payment Request</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                  Enter an amount and click <strong>Generate Payment QR</strong> to create an instant synthetic UPI QR code.
                </p>
                <button
                  onClick={handleGenerateQr}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-[#0B1B2D] hover:bg-[#438EFF]/20 border border-white/10 hover:border-[#5BD6FF]/40 text-xs font-semibold text-[#5BD6FF] transition"
                >
                  Generate ₹5,000 Viva QR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settlement History Table */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="size-5 text-[#5BD6FF]" />
                Recent Merchant Settlements
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Live real-time closed-loop payment ledger for {merchant.name}</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Recorded: {merchantTransactions.length}
            </span>
          </div>

          {merchantTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Payer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Risk Evaluation</th>
                    <th className="py-3 px-4">Auth Mode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {merchantTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 text-white font-semibold">{t.transactionId}</td>
                      <td className="py-3 px-4 text-slate-300">{t.senderName} ({t.senderUpiId})</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        ₹{t.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.riskLevel === 'LOW'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : t.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {t.riskLevel} ({t.riskScore}/100)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {t.authMethod ? t.authMethod.replace('_', ' ') + ' + OTP' : 'OTP'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> SETTLED
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {new Date(t.timestamps.settled || t.timestamps.created).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500">
              No simulated payments received yet for {merchant.name}. Generate a QR code above and scan from the User App!
            </div>
          )}
        </div>
      </div>
    </MerchantLayout>
  )
}
