'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  Sliders,
  MapPin,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Flame,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Smartphone,
  Sparkles,
  Info,
  Clock,
  RotateCcw,
  CheckCircle2,
  X,
  Radio,
  Search,
  ChevronRight,
  UserCheck,
  Scan,
  Compass,
  Repeat,
  Gem,
  Building2
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { useUPIGuardStore, VirtualCard, CardTransaction, CardTheme, CardType } from '@/lib/upiguard-store'

export default function VirtualCardsPage() {
  const {
    virtualCards,
    cardTransactions,
    cardSubscriptions,
    activeCardId,
    setActiveCard,
    createCard,
    updateCard,
    freezeCard,
    unfreezeCard,
    freezeAllCards,
    temporarilyLockCard,
    regenerateCard,
    deleteCard,
    updateCardLimits,
    updateCardSecurity,
    updateCardLocationPolicy,
    updateCardCategoryPolicy,
    simulateCardPayment,
    confirmCardTransaction,
    verifyCardAuth,
    requestCardOtp,
    verifyCardOtp,
    settleCardPayment,
    refundCardPayment,
    resetCardDemo,
    accounts,
    activeUserUpi
  } = useUPIGuardStore()

  // Selected active tab in card management
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'security' | 'locations' | 'subscriptions' | 'transactions' | 'statement'>('overview')

  // Modals & Panels
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsAuthMethod, setDetailsAuthMethod] = useState<'PIN' | 'FACE'>('PIN')
  const [detailsPinInput, setDetailsPinInput] = useState('')
  const [detailsAuthed, setDetailsAuthed] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createStep, setCreateStep] = useState(0) // 0: Form, 1: Animated generation
  const [createForm, setCreateForm] = useState({
    nickname: 'My Shopping Card',
    cardType: 'VIRTUAL_CREDIT' as CardType,
    theme: 'Aurora' as CardTheme,
    purpose: 'General Spending',
    creditLimit: 100000,
    dailyLimit: 25000,
    monthlyLimit: 50000,
    onlineLimit: 25000,
    contactlessLimit: 5000,
    locationProtection: true,
    deviceProtection: true,
    fraudProtection: true,
    requireAuth: true,
    otpRequired: true,
    internationalSimulation: false
  })

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<VirtualCard>>({})

  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [lockMinutes, setLockMinutes] = useState(60)

  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Payment Simulator State
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [simStep, setSimStep] = useState<'INPUT' | 'RISK_BREAKDOWN' | 'WAS_THIS_YOU' | 'AUTH' | 'OTP' | 'RESULT'>('INPUT')
  const [simForm, setSimForm] = useState({
    merchantName: 'ABC Electronics',
    merchantId: 'merch_abc_01',
    amount: 85000,
    category: 'Electronics',
    paymentChannel: 'Online' as 'Online' | 'POS' | 'Contactless' | 'QR' | 'In-App',
    city: 'Mumbai',
    country: 'India',
    device: 'New Device',
    description: 'Laptop Purchase'
  })

  const [activeSimTxnId, setActiveSimTxnId] = useState<string | null>(null)
  const [simRiskData, setSimRiskData] = useState<{
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    decision: 'ALLOW' | 'VERIFY' | 'BLOCK'
    riskFactors: Array<{ name: string; score: number; description: string; importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>
  } | null>(null)
  const [simAuthMethod, setSimAuthMethod] = useState<'PIN' | 'FACE_SCAN'>('PIN')
  const [simPinInput, setSimPinInput] = useState('')
  const [simOtpChallenge, setSimOtpChallenge] = useState<{ demoOtp: string; expiresIn: number } | null>(null)
  const [simOtpInput, setSimOtpInput] = useState('')
  const [simResult, setSimResult] = useState<{ status: 'APPROVED' | 'BLOCKED'; message: string; tx?: CardTransaction } | null>(null)
  const [simError, setSimError] = useState<string | null>(null)

  // Search and Filter for Transactions
  const [txSearch, setTxSearch] = useState('')
  const [txFilterRisk, setTxFilterRisk] = useState<string>('ALL')

  // Find currently active card or default to first non-deleted card
  const activeCardsList = useMemo(() => {
    return virtualCards.filter((c) => c.status !== 'DELETED')
  }, [virtualCards])

  const currentCard = useMemo(() => {
    return activeCardsList.find((c) => c.cardId === activeCardId) || activeCardsList[0] || null
  }, [activeCardsList, activeCardId])

  // Aggregate Metrics (Section 4)
  const metrics = useMemo(() => {
    const activeCount = activeCardsList.filter((c) => c.status === 'ACTIVE').length
    const totalCredit = activeCardsList.reduce((sum, c) => sum + c.creditLimit, 0)
    const usedCredit = activeCardsList.reduce((sum, c) => sum + c.usedCredit, 0)
    const availableCredit = activeCardsList.reduce((sum, c) => sum + c.availableCredit, 0)
    const avgSecurity = activeCardsList.length > 0
      ? Math.round(activeCardsList.reduce((sum, c) => sum + c.securityScore, 0) / activeCardsList.length)
      : 94
    const highestRisk = activeCardsList.reduce((max, c) => (c.riskScore > max ? c.riskScore : max), 0)
    const riskLabel = highestRisk > 60 ? 'HIGH' : highestRisk > 35 ? 'MEDIUM' : 'LOW'
    const utilization = totalCredit > 0 ? (usedCredit / totalCredit) * 100 : 0

    return {
      activeCount,
      totalCredit,
      usedCredit,
      availableCredit,
      avgSecurity,
      riskLabel,
      utilization
    }
  }, [activeCardsList])

  // Filtered transactions for current card
  const filteredTransactions = useMemo(() => {
    if (!currentCard) return []
    return cardTransactions
      .filter((t) => t.cardId === currentCard.cardId)
      .filter((t) => {
        if (!txSearch) return true
        const q = txSearch.toLowerCase()
        return (
          t.merchantName.toLowerCase().includes(q) ||
          t.merchantCategory.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q) ||
          t.location.city.toLowerCase().includes(q)
        )
      })
      .filter((t) => {
        if (txFilterRisk === 'ALL') return true
        return t.riskLevel === txFilterRisk
      })
  }, [cardTransactions, currentCard, txSearch, txFilterRisk])

  // Card theme visual styling helper
  const getThemeStyle = (theme: CardTheme) => {
    switch (theme) {
      case 'Cyber':
        return 'from-emerald-950 via-[#06241b] to-teal-900 border-emerald-500/40 text-emerald-100 shadow-emerald-900/30'
      case 'Aurora':
        return 'from-violet-950 via-[#1c0b3b] to-fuchsia-950 border-fuchsia-500/40 text-fuchsia-100 shadow-fuchsia-950/40'
      case 'Titanium':
        return 'from-slate-900 via-zinc-800 to-slate-900 border-zinc-500/40 text-zinc-100 shadow-zinc-900/40'
      case 'Minimal':
        return 'from-[#0b1016] via-[#101923] to-[#070b10] border-cyan-500/30 text-white shadow-cyan-950/20'
      case 'Electric':
        return 'from-blue-950 via-[#0d1a45] to-indigo-950 border-blue-400/40 text-blue-100 shadow-blue-900/40'
      case 'Midnight':
      default:
        return 'from-[#091726] via-[#0b2038] to-[#06101D] border-[#5BD6FF]/40 text-white shadow-cyan-900/30'
    }
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Handle Card Creation with Animated Process (Section 7)
  const handleStartCreateCard = () => {
    setCreateStep(1)
    setTimeout(() => {
      createCard({
        userId: activeUserUpi,
        cardType: createForm.cardType,
        nickname: createForm.nickname,
        theme: createForm.theme,
        purpose: createForm.purpose,
        displayNumber: `VG-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        maskedNumber: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
        syntheticToken: `VG-SEC-${Math.floor(100000 + Math.random() * 900000)}-DEMO`,
        expiryMonth: '12',
        expiryYear: '30',
        demoCvv: Math.floor(100 + Math.random() * 900).toString(),
        status: 'ACTIVE',
        creditLimit: createForm.creditLimit,
        dailyLimit: createForm.dailyLimit,
        monthlyLimit: createForm.monthlyLimit,
        onlineLimit: createForm.onlineLimit,
        contactlessLimit: createForm.contactlessLimit,
        locationProtection: createForm.locationProtection,
        deviceProtection: createForm.deviceProtection,
        aiFraudProtection: createForm.fraudProtection,
        transactionAlerts: true,
        authenticationRequired: createForm.requireAuth,
        otpRequired: createForm.otpRequired,
        autoFreezeOnCriticalRisk: false,
        travelMode: false,
        homeLocation: 'Hubballi',
        allowedCities: ['Hubballi', 'Dharwad', 'Bengaluru'],
        blockedCities: ['Unknown Foreign Node'],
        allowedCategories: ['Electronics', 'Shopping', 'Travel', 'Food', 'Subscriptions', 'Automotive', 'Dining'],
        blockedCategories: ['Gambling / Risky Betting', 'Anonymous Crypto'],
        categoryLimits: {
          Shopping: 35000,
          Travel: 25000,
          Dining: 10000,
          Electronics: 80000
        }
      })
      setCreateStep(0)
      setCreateModalOpen(false)
    }, 2800)
  }

  // Payment Simulator Handlers
  const handleRunSimulation = () => {
    if (!currentCard) return
    setSimError(null)

    const res = simulateCardPayment({
      cardId: currentCard.cardId,
      merchantName: simForm.merchantName,
      merchantId: simForm.merchantId,
      amount: simForm.amount,
      category: simForm.category,
      paymentChannel: simForm.paymentChannel,
      location: { city: simForm.city, country: simForm.country },
      deviceId: simForm.device,
      description: simForm.description
    })

    if (!res.success) {
      setSimError(res.message || 'Payment simulation failed validation')
      return
    }

    setActiveSimTxnId(res.transactionId || null)
    setSimRiskData({
      riskScore: res.riskScore || 20,
      riskLevel: res.riskLevel || 'LOW',
      decision: res.decision || 'VERIFY',
      riskFactors: res.riskFactors || []
    })

    // Advance to Risk Breakdown and "WAS THIS YOU?"
    setSimStep('WAS_THIS_YOU')
  }

  const handleConfirmWasThisYou = (isMe: boolean) => {
    if (!activeSimTxnId) return
    const res = confirmCardTransaction(activeSimTxnId, isMe)
    if (!isMe) {
      setSimResult({
        status: 'BLOCKED',
        message: 'Transaction reported as fraud. Simulated card protected, security incident logged with SOC, and payment authorization blocked.'
      })
      setSimStep('RESULT')
    } else {
      setSimStep('AUTH')
    }
  }

  const handleVerifyAuthMethod = () => {
    if (!activeSimTxnId) return
    if (simAuthMethod === 'PIN' && simPinInput !== '2580') {
      setSimError('Invalid demo PIN. Use demo PIN 2580.')
      return
    }
    setSimError(null)
    verifyCardAuth(activeSimTxnId, simAuthMethod, simPinInput)

    // Request 6-digit OTP
    const otpRes = requestCardOtp(activeSimTxnId)
    setSimOtpChallenge({ demoOtp: otpRes.demoOtp, expiresIn: otpRes.expiresIn })
    setSimOtpInput('')
    setSimStep('OTP')
  }

  const handleVerifyOtp = () => {
    if (!activeSimTxnId || !simOtpChallenge) return
    if (simOtpInput.trim() !== simOtpChallenge.demoOtp) {
      setSimError(`Incorrect OTP. Enter the generated demo OTP: ${simOtpChallenge.demoOtp}`)
      return
    }
    setSimError(null)
    verifyCardOtp(activeSimTxnId, simOtpInput.trim())

    // Settle payment
    const settleRes = settleCardPayment(activeSimTxnId)
    if (settleRes.success) {
      setSimResult({
        status: 'APPROVED',
        message: `Simulated card payment of ₹${simForm.amount.toLocaleString('en-IN')} approved and settled. Available credit updated.`,
        tx: settleRes.transaction
      })
    } else {
      setSimResult({
        status: 'BLOCKED',
        message: settleRes.message || 'Payment blocked during final risk settlement.'
      })
    }
    setSimStep('RESULT')
  }

  // Quick Preset Simulator loader
  const loadPreset = (preset: 'NORMAL' | 'MAJOR_CAR' | 'SUSPICIOUS_MUMBAI' | 'IMPOSSIBLE_TRAVEL' | 'LIMIT_EXCEEDED') => {
    switch (preset) {
      case 'NORMAL':
        setSimForm({
          merchantName: 'ABC Electronics',
          merchantId: 'merch_abc_01',
          amount: 2500,
          category: 'Electronics',
          paymentChannel: 'Online',
          city: 'Hubballi',
          country: 'India',
          device: 'Anjan-Laptop (Trusted)',
          description: 'Wireless Mouse Purchase'
        })
        break
      case 'MAJOR_CAR':
        setSimForm({
          merchantName: 'ABC Motors Hubballi',
          merchantId: 'merch_motors_01',
          amount: 850000,
          category: 'Automotive',
          paymentChannel: 'POS',
          city: 'Hubballi',
          country: 'India',
          device: 'POS Terminal 9941',
          description: 'Vehicle Down Payment Simulation'
        })
        break
      case 'SUSPICIOUS_MUMBAI':
        setSimForm({
          merchantName: 'Unknown Online Store',
          merchantId: 'merch_suspicious_99',
          amount: 85000,
          category: 'Electronics',
          paymentChannel: 'Online',
          city: 'Mumbai',
          country: 'India',
          device: 'Unrecognized Browser Node',
          description: 'High-Risk Overnight Hardware Order'
        })
        break
      case 'IMPOSSIBLE_TRAVEL':
        setSimForm({
          merchantName: 'Apple Store Aerocity',
          merchantId: 'merch_apple_del',
          amount: 89900,
          category: 'Electronics',
          paymentChannel: 'POS',
          city: 'Delhi',
          country: 'India',
          device: 'POS-DEL-9941',
          description: 'Impossible physical travel anomaly'
        })
        break
      case 'LIMIT_EXCEEDED':
        setSimForm({
          merchantName: 'Luxury Boutique Deluxe',
          merchantId: 'merch_lux_01',
          amount: 2500000,
          category: 'Shopping',
          paymentChannel: 'Online',
          city: 'Hubballi',
          country: 'India',
          device: 'Anjan-Laptop (Trusted)',
          description: 'Exceeds available credit limit'
        })
        break
    }
  }

  return (
    <UserLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Closed-Loop Simulation Header Banner (Section 1) */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-[#06101D] to-indigo-950/40 p-4 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-cyan-950/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  UPIGuard AI Demo Card
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  Closed-Loop Simulation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  NO REAL CARD TRANSACTIONS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthetic tokenized credit card ecosystem for final-year engineering defense and live fraud simulation. Zero real banking movement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                loadPreset('NORMAL')
                setSimStep('INPUT')
                setSimulatorOpen(true)
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Zap className="size-4" /> SIMULATE CARD PAYMENT
            </button>
            <button
              onClick={() => {
                setCreateStep(0)
                setCreateModalOpen(true)
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-1.5"
            >
              <Plus className="size-4 text-cyan-400" /> CREATE CARD
            </button>
            <button
              onClick={resetCardDemo}
              title="Reset Card Demo Environment"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* Top Summary Bar (Section 4) */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Cards</span>
            <div className="text-2xl font-black text-white mt-1 font-mono">{metrics.activeCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Closed-loop profiles</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Credit Limit</span>
            <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">
              ₹{metrics.totalCredit.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Authorized demo credit</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Used Credit</span>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
              ₹{metrics.usedCredit.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{metrics.utilization.toFixed(1)}% utilized</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</span>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              ₹{metrics.availableCredit.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for simulation</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Card Risk</span>
            <div className={`text-2xl font-black mt-1 font-mono ${metrics.riskLabel === 'HIGH' ? 'text-rose-400' : metrics.riskLabel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics.riskLabel}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Multi-vector analysis</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Score</span>
            <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">{metrics.avgSecurity}/100</div>
            <p className="text-[11px] text-emerald-400 font-bold mt-0.5">Optimal Protection</p>
          </div>
        </div>

        {/* Credit Utilization Bar (Section 39) */}
        <div className="rounded-2xl border border-white/5 bg-[#091726]/50 p-4 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <TrendingUp className="size-4 text-cyan-400" /> Card Credit Utilization
            </span>
            <span className="font-mono font-bold text-slate-300">
              ₹{metrics.usedCredit.toLocaleString('en-IN')} / ₹{metrics.totalCredit.toLocaleString('en-IN')} ({metrics.utilization.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                metrics.utilization > 80
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : metrics.utilization > 50
                  ? 'bg-gradient-to-r from-cyan-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, metrics.utilization)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>0% Safe</span>
            <span>50% Moderate</span>
            <span>75% High</span>
            <span>90%+ Warning Threshold</span>
          </div>
        </div>

        {/* Main Interactive Stage: Left (Card Visual & Quick Actions), Right (Detailed Tabs) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Card + Quick Controls (Section 5, 11, 52) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {activeCardsList.map((c) => (
                <button
                  key={c.cardId}
                  onClick={() => setActiveCard(c.cardId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    c.cardId === currentCard?.cardId
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <CreditCard className="size-3.5" />
                  {c.nickname}
                  {c.status === 'FROZEN' && <span className="size-2 rounded-full bg-rose-500" />}
                </button>
              ))}
            </div>

            {/* Visual Credit Card Component */}
            {currentCard && (
              <div
                className={`relative w-full aspect-[1.586/1] rounded-3xl p-6 sm:p-7 border bg-gradient-to-br ${getThemeStyle(
                  currentCard.theme
                )} shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 hover:scale-[1.01]`}
              >
                {/* Background holographic watermark */}
                <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute right-4 bottom-4 opacity-10 font-black text-6xl tracking-tighter pointer-events-none select-none">
                  DEMO
                </div>

                {/* Card Top: Chip + Antenna + Status Badge */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Metallic Chip Visual */}
                    <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 p-1 flex flex-col justify-between shadow-sm">
                      <div className="w-full h-0.5 bg-amber-800/40 rounded-full" />
                      <div className="w-full h-0.5 bg-amber-800/40 rounded-full" />
                      <div className="w-full h-0.5 bg-amber-800/40 rounded-full" />
                    </div>
                    {/* Contactless symbol */}
                    <Radio className="size-5 text-slate-300/80 rotate-90" />
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 block font-mono">
                      UPIGuard AI
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      {currentCard.cardType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Card Middle: Synthetic Display Number */}
                <div className="my-auto py-2 relative z-10">
                  <div className="font-mono text-xl sm:text-2xl font-bold tracking-[0.2em] text-white/95 drop-shadow-md">
                    {detailsAuthed ? currentCard.displayNumber : currentCard.maskedNumber}
                  </div>
                  <div className="text-[10px] text-cyan-300/70 font-mono tracking-wider mt-1 flex items-center gap-1.5">
                    <span>{currentCard.syntheticToken}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-slate-300">DEMO ONLY</span>
                  </div>
                </div>

                {/* Card Bottom: Holder, Expiry, Brand */}
                <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      CARDHOLDER
                    </span>
                    <span className="font-bold text-xs sm:text-sm tracking-wider uppercase text-white drop-shadow-sm">
                      ANJAN SHETTY
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      VALID THRU
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-white">
                      {currentCard.expiryMonth}/{currentCard.expiryYear}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black tracking-wider text-slate-200 block">
                      VISA DEMO
                    </span>
                    <span className="text-[8px] font-extrabold text-cyan-400 tracking-wider uppercase block">
                      CLOSED-LOOP
                    </span>
                  </div>
                </div>

                {/* Frozen Overlay */}
                {currentCard.status === 'FROZEN' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                    <Lock className="size-10 text-rose-400 mb-2 animate-pulse" />
                    <span className="text-base font-black uppercase tracking-wider text-rose-400">
                      CARD FROZEN
                    </span>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      All simulated transactions are blocked. Unfreeze card to re-enable authorization.
                    </p>
                    <button
                      onClick={() => unfreezeCard(currentCard.cardId)}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase"
                    >
                      UNFREEZE CARD
                    </button>
                  </div>
                )}

                {/* Temporarily Locked Overlay */}
                {currentCard.status === 'LOCKED' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                    <Clock className="size-10 text-amber-400 mb-2 animate-bounce" />
                    <span className="text-base font-black uppercase tracking-wider text-amber-400">
                      CARD TEMPORARILY LOCKED
                    </span>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      Locked until {currentCard.lockedUntil ? new Date(currentCard.lockedUntil).toLocaleTimeString() : 'Manual Unlock'}.
                    </p>
                    <button
                      onClick={() => unfreezeCard(currentCard.cardId)}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#06101D] font-extrabold text-xs uppercase"
                    >
                      UNLOCK NOW
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Controls Grid (Section 52) */}
            {currentCard && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    if (detailsAuthed) {
                      setDetailsAuthed(false)
                    } else {
                      setShowDetailsModal(true)
                    }
                  }}
                  className="p-3 rounded-2xl bg-[#091726] border border-white/10 hover:border-cyan-500/40 text-left transition group"
                >
                  <div className="size-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                    {detailsAuthed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </div>
                  <span className="text-xs font-bold text-white block">
                    {detailsAuthed ? 'Hide Details' : 'Show Details'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">CVV & Token</span>
                </button>

                <button
                  onClick={() => {
                    if (currentCard.status === 'FROZEN') {
                      unfreezeCard(currentCard.cardId)
                    } else {
                      setFreezeModalOpen(true)
                    }
                  }}
                  className="p-3 rounded-2xl bg-[#091726] border border-white/10 hover:border-rose-500/40 text-left transition group"
                >
                  <div className="size-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                    {currentCard.status === 'FROZEN' ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                  </div>
                  <span className="text-xs font-bold text-white block">
                    {currentCard.status === 'FROZEN' ? 'Unfreeze' : 'Freeze Card'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">Instant Block</span>
                </button>

                <button
                  onClick={() => setLockModalOpen(true)}
                  className="p-3 rounded-2xl bg-[#091726] border border-white/10 hover:border-amber-500/40 text-left transition group"
                >
                  <div className="size-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                    <Clock className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-white block">Timed Lock</span>
                  <span className="text-[10px] text-slate-400 block font-mono">15m – 24h</span>
                </button>

                <button
                  onClick={() => setRegenerateModalOpen(true)}
                  className="p-3 rounded-2xl bg-[#091726] border border-white/10 hover:border-purple-500/40 text-left transition group"
                >
                  <div className="size-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                    <RefreshCw className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-white block">Regenerate</span>
                  <span className="text-[10px] text-slate-400 block font-mono">New Token/CVV</span>
                </button>
              </div>
            )}

            {/* Quick Actions Bar 2: Edit, Freeze All, Delete */}
            {currentCard && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditForm({ ...currentCard })
                    setEditModalOpen(true)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                >
                  <Sliders className="size-3.5 text-cyan-400" /> Edit Card
                </button>

                <button
                  onClick={freezeAllCards}
                  className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  <ShieldAlert className="size-3.5" /> Freeze All
                </button>

                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition"
                  title="Delete/Revoke Card"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}

            {/* Revealed Credentials Box when Authenticated (Section 9) */}
            {detailsAuthed && currentCard && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 backdrop-blur-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-400" /> Authenticated Demo Credentials
                  </span>
                  <button
                    onClick={() => setDetailsAuthed(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Hide
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-[#091726] p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">TOKEN</span>
                    <span className="font-mono font-bold text-white text-[11px] truncate block">
                      {currentCard.displayNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(currentCard.displayNumber, 'num')}
                      className="mt-1 text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'num' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      Copy
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#091726] p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">EXPIRY</span>
                    <span className="font-mono font-bold text-white text-[11px] block">
                      {currentCard.expiryMonth}/{currentCard.expiryYear}
                    </span>
                    <button
                      onClick={() => handleCopy(`${currentCard.expiryMonth}/${currentCard.expiryYear}`, 'exp')}
                      className="mt-1 text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'exp' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      Copy
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#091726] p-2 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">DEMO CVV</span>
                    <span className="font-mono font-bold text-amber-400 text-[11px] block">
                      {currentCard.demoCvv}
                    </span>
                    <button
                      onClick={() => handleCopy(currentCard.demoCvv, 'cvv')}
                      className="mt-1 text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'cvv' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      Copy
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-cyan-200/80 italic font-mono bg-cyan-900/30 p-2 rounded-lg border border-cyan-500/20">
                  ⚠️ "These are simulated card credentials and cannot be used for real payments."
                </p>
              </motion.div>
            )}
          </div>

          {/* Right Column: In-Depth Card Management Tabs (Section 3) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tab Navigation Header */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10">
              {[
                { id: 'overview', label: 'Overview', icon: CreditCard },
                { id: 'limits', label: 'Spending Limits', icon: SlidersHorizontal },
                { id: 'security', label: 'Security & AI', icon: ShieldCheck },
                { id: 'locations', label: 'Locations & Travel', icon: MapPin },
                { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
                { id: 'transactions', label: 'Transactions', icon: FileText },
                { id: 'statement', label: 'Statement', icon: Download }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && currentCard && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{currentCard.nickname}</h3>
                      <p className="text-xs text-slate-400">{currentCard.purpose}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      {currentCard.cardType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-mono">STATUS</span>
                      <span className="font-bold text-emerald-400 capitalize">{currentCard.status}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-mono">HOME BASELINE</span>
                      <span className="font-bold text-white">{currentCard.homeLocation}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-mono">TRAVEL MODE</span>
                      <span className={`font-bold ${currentCard.travelMode ? 'text-amber-400' : 'text-slate-400'}`}>
                        {currentCard.travelMode ? 'ON (Mumbai/Singapore)' : 'OFF'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-mono">DAILY LIMIT</span>
                      <span className="font-bold text-white">₹{currentCard.dailyLimit.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-mono">ONLINE LIMIT</span>
                      <span className="font-bold text-white">₹{currentCard.onlineLimit.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-mono">SECURITY SCORE</span>
                      <span className="font-bold text-indigo-400 font-mono">{currentCard.securityScore} / 100</span>
                    </div>
                  </div>

                  {/* Card Theme Picker (Section 11) */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-300 block mb-2">Card Style & Theme</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {(['Midnight', 'Cyber', 'Aurora', 'Titanium', 'Minimal', 'Electric'] as CardTheme[]).map((thm) => (
                        <button
                          key={thm}
                          onClick={() => updateCard(currentCard.cardId, { theme: thm })}
                          className={`p-2 rounded-xl text-center text-xs font-bold border transition ${
                            currentCard.theme === thm
                              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {thm}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Card Transactions Preview */}
                <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="size-4 text-cyan-400" /> Recent Card Transactions
                    </h4>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      View All ({filteredTransactions.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {filteredTransactions.slice(0, 3).map((tx) => (
                      <div
                        key={tx.transactionId}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-lg flex items-center justify-center ${
                            tx.status === 'SETTLED' || tx.status === 'AUTHORIZED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            <CreditCard className="size-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{tx.merchantName}</span>
                            <span className="text-[10px] text-slate-400">
                              {tx.merchantCategory} • {tx.location.city} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-white block">
                            ₹{tx.amount.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${
                            tx.status === 'SETTLED' || tx.status === 'AUTHORIZED' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Limits (Section 17, 18) */}
            {activeTab === 'limits' && currentCard && (
              <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Card Spending Limits</h3>
                    <p className="text-xs text-slate-400">Controls evaluated before every transaction authorization</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    Available: ₹{currentCard.availableCredit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-bold">Total Credit Limit (₹)</label>
                    <input
                      type="number"
                      value={currentCard.creditLimit}
                      onChange={(e) => updateCardLimits(currentCard.cardId, { creditLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-bold">Daily Spending Limit (₹)</label>
                    <input
                      type="number"
                      value={currentCard.dailyLimit}
                      onChange={(e) => updateCardLimits(currentCard.cardId, { dailyLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-bold">Monthly Spending Limit (₹)</label>
                    <input
                      type="number"
                      value={currentCard.monthlyLimit}
                      onChange={(e) => updateCardLimits(currentCard.cardId, { monthlyLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-bold">Online Spending Limit (₹)</label>
                    <input
                      type="number"
                      value={currentCard.onlineLimit}
                      onChange={(e) => updateCardLimits(currentCard.cardId, { onlineLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-bold">Contactless Simulation Limit (₹)</label>
                    <input
                      type="number"
                      value={currentCard.contactlessLimit}
                      onChange={(e) => updateCardLimits(currentCard.cardId, { contactlessLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Category Specific Limits</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(currentCard.categoryLimits || {}).map(([cat, lim]) => (
                      <div key={cat} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                        <span className="text-[10px] text-slate-400 block">{cat}</span>
                        <span className="font-mono font-bold text-cyan-300">₹{lim.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Security & AI Policies (Section 16, 53) */}
            {activeTab === 'security' && currentCard && (
              <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-base font-bold text-white">Card Security & AI Safeguards</h3>
                  <p className="text-xs text-slate-400">Configure biometric, location intelligence, and autonomous auto-freeze triggers</p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'fraudProtection', label: 'AI Fraud Protection', desc: 'Real-time multi-vector machine learning risk evaluation' },
                    { key: 'locationProtection', label: 'Location Intelligence', desc: 'Enforce geofencing baseline and flag impossible travel speeds' },
                    { key: 'deviceProtection', label: 'Device Intelligence', desc: 'Capture browser fingerprint, IP trust score, and hardware token' },
                    { key: 'authenticationRequired', label: 'Require Step-Up Authentication', desc: 'Mandatory Demo PIN or Face Scan before authorization' },
                    { key: 'otpRequired', label: 'Dynamic One-Time Password (OTP)', desc: 'Generate unique 6-digit random verification code per payment' },
                    { key: 'autoFreeze', label: 'Auto-Freeze on Critical Risk', desc: 'Instantly lock simulated card when risk score reaches 90+' }
                  ].map((item) => {
                    const isChecked = (currentCard as any)[item.key]
                    return (
                      <div
                        key={item.key}
                        onClick={() => updateCardSecurity(currentCard.cardId, { [item.key]: !isChecked })}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition"
                      >
                        <div>
                          <span className="text-xs font-bold text-white block">{item.label}</span>
                          <span className="text-[11px] text-slate-400">{item.desc}</span>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${isChecked ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                          <div className={`size-5 rounded-full bg-white transition-transform ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Locations & Travel Intelligence (Section 27-33, 56, 57) */}
            {activeTab === 'locations' && currentCard && (
              <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Card Location Intelligence</h3>
                    <p className="text-xs text-slate-400">Baseline geographic monitoring & Travel Mode policy</p>
                  </div>
                  <button
                    onClick={() => updateCardLocationPolicy(currentCard.cardId, { travelMode: !currentCard.travelMode, travelDestination: currentCard.travelMode ? undefined : 'Mumbai' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border uppercase transition ${
                      currentCard.travelMode
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Travel Mode: {currentCard.travelMode ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                {/* Travel Mode Advisory */}
                {currentCard.travelMode && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                    <Compass className="size-4 text-amber-400 shrink-0" />
                    <span>Travel mode active for <strong>{currentCard.travelDestination || 'Mumbai'}</strong>. Transactions from this region will not be penalized with location anomaly risk.</span>
                  </div>
                )}

                {/* Visual Swipes & Location Grid */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-2 rounded-full bg-emerald-400" />
                      <div>
                        <span className="font-bold text-white block">Home Baseline: {currentCard.homeLocation}</span>
                        <span className="text-[10px] text-slate-400">Hubballi & Dharwad frequent transaction clusters</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">NORMAL 0% RISK</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-2 rounded-full bg-amber-400" />
                      <div>
                        <span className="font-bold text-white block">Mumbai Anomaly Node</span>
                        <span className="text-[10px] text-slate-400">550 km from typical location baseline</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {currentCard.travelMode ? 'AUTHORIZED VIA TRAVEL MODE' : '+25 RISK PENALTY'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-2 rounded-full bg-rose-400" />
                      <div>
                        <span className="font-bold text-white block">Delhi Speed Check (Impossible Travel Demo)</span>
                        <span className="text-[10px] text-slate-400">1,150 km in 28 mins (Velocity 2,460 km/h)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">CRITICAL FRAUD (+45)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Subscriptions (Section 44, 45) */}
            {activeTab === 'subscriptions' && currentCard && (
              <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Simulated Recurring Subscriptions</h3>
                    <p className="text-xs text-slate-400">Auto-debit recurring charges attached to this card profile</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {cardSubscriptions.length} Active Services
                  </span>
                </div>

                <div className="space-y-2">
                  {cardSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{sub.merchantName}</span>
                        <span className="text-[10px] text-slate-400">
                          {sub.frequency} • Next bill: {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-cyan-300">
                          ₹{sub.amount.toLocaleString('en-IN')}/{sub.frequency === 'Monthly' ? 'mo' : 'yr'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Transactions History (Section 46, 47) */}
            {activeTab === 'transactions' && (
              <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Card Transaction Ledger</h3>
                    <p className="text-xs text-slate-400">Closed-loop card authorizations and simulated settlements</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="size-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search merchant, ID..."
                        value={txSearch}
                        onChange={(e) => setTxSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                    <select
                      value={txFilterRisk}
                      onChange={(e) => setTxFilterRisk(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#091726] border border-white/10 text-xs text-slate-300 outline-none"
                    >
                      <option value="ALL">All Risk</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase font-mono">
                        <th className="pb-2">TXN ID</th>
                        <th className="pb-2">Merchant</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Location</th>
                        <th className="pb-2">Risk</th>
                        <th className="pb-2">Auth</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTransactions.map((t) => (
                        <tr key={t.transactionId} className="hover:bg-white/5 transition">
                          <td className="py-2.5 font-mono text-cyan-400 font-bold">{t.transactionId}</td>
                          <td className="py-2.5 text-white font-medium">{t.merchantName}</td>
                          <td className="py-2.5 font-mono font-bold text-white">₹{t.amount.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 text-slate-400">{t.location.city}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              t.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {t.riskScore}/100
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-300 font-mono text-[10px]">{t.authenticationMethod || 'N/A'}</td>
                          <td className="py-2.5">
                            <span className={`font-bold uppercase text-[10px] ${
                              t.status === 'SETTLED' || t.status === 'AUTHORIZED' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            {(t.status === 'SETTLED' || t.status === 'AUTHORIZED') && (
                              <button
                                onClick={() => refundCardPayment(t.transactionId)}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-cyan-400 font-bold uppercase"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Statement & Export (Section 48, 84) */}
            {activeTab === 'statement' && currentCard && (
              <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Simulated Card Statement</h3>
                    <p className="text-xs text-slate-400">Statement period: Current Billing Cycle (Sept 2026)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const jsonStr = JSON.stringify({ card: currentCard, transactions: filteredTransactions }, null, 2)
                        const blob = new Blob([jsonStr], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `upiguard_statement_${currentCard.cardId}.json`
                        a.click()
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase flex items-center gap-1.5 border border-white/10"
                    >
                      <Download className="size-3.5 text-cyan-400" /> Export JSON
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase flex items-center gap-1.5"
                    >
                      <FileText className="size-3.5" /> Print / PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">CREDIT LIMIT</span>
                    <span className="font-mono font-bold text-white">₹{currentCard.creditLimit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">CLOSING USED</span>
                    <span className="font-mono font-bold text-amber-400">₹{currentCard.usedCredit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">REMAINING AVAILABLE</span>
                    <span className="font-mono font-bold text-emerald-400">₹{currentCard.availableCredit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">TOTAL TRANSACTIONS</span>
                    <span className="font-mono font-bold text-cyan-400">{filteredTransactions.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Show Card Details Auth Gate (Section 9)                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDetailsModal && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-cyan-500/30 bg-[#091726] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="size-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Authenticate to Reveal Card</h3>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                To inspect sensitive synthetic CVV and token data, complete one security verification step.
              </p>

              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setDetailsAuthMethod('PIN')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    detailsAuthMethod === 'PIN' ? 'bg-cyan-500 text-[#06101D]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Demo PIN (2580)
                </button>
                <button
                  onClick={() => setDetailsAuthMethod('FACE')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    detailsAuthMethod === 'FACE' ? 'bg-cyan-500 text-[#06101D]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Simulated Face Scan
                </button>
              </div>

              {detailsAuthMethod === 'PIN' ? (
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-bold">Enter 4-Digit Demo PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={detailsPinInput}
                    onChange={(e) => setDetailsPinInput(e.target.value)}
                    placeholder="Enter 2580"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-center text-lg tracking-[0.3em] outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-cyan-400 block text-center">Demo PIN is 2580</span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
                  <Scan className="size-12 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Biometric Face Scanner Active</span>
                  <span className="text-[10px] text-slate-400">Click verify below to complete simulated match</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (detailsAuthMethod === 'PIN' && detailsPinInput !== '2580') {
                      alert('Invalid Demo PIN. Use 2580')
                      return
                    }
                    setDetailsAuthed(true)
                    setShowDetailsModal(false)
                    setDetailsPinInput('')
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] text-xs font-extrabold uppercase shadow-lg shadow-cyan-500/20"
                >
                  Verify & Reveal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: Create Virtual Card with Animated Generation (Section 7)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#091726] p-6 shadow-2xl space-y-4"
            >
              {createStep === 0 ? (
                <>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-5 text-cyan-400" />
                      <h3 className="text-base font-bold text-white">Create Virtual Demo Card</h3>
                    </div>
                    <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="size-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2 space-y-1">
                      <label className="text-slate-300 font-bold">Card Nickname</label>
                      <input
                        type="text"
                        value={createForm.nickname}
                        onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Card Type</label>
                      <select
                        value={createForm.cardType}
                        onChange={(e) => setCreateForm({ ...createForm, cardType: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-[#091726] border border-white/10 text-white outline-none focus:border-cyan-400"
                      >
                        <option value="VIRTUAL_CREDIT">Virtual Credit</option>
                        <option value="VIRTUAL_SHOPPING">Virtual Shopping</option>
                        <option value="VIRTUAL_TRAVEL">Virtual Travel</option>
                        <option value="VIRTUAL_SUBSCRIPTION">Virtual Subscription</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Visual Theme</label>
                      <select
                        value={createForm.theme}
                        onChange={(e) => setCreateForm({ ...createForm, theme: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-[#091726] border border-white/10 text-white outline-none focus:border-cyan-400"
                      >
                        <option value="Midnight">Midnight</option>
                        <option value="Cyber">Cyber</option>
                        <option value="Aurora">Aurora</option>
                        <option value="Titanium">Titanium</option>
                        <option value="Minimal">Minimal</option>
                        <option value="Electric">Electric</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Credit Limit (₹)</label>
                      <input
                        type="number"
                        value={createForm.creditLimit}
                        onChange={(e) => setCreateForm({ ...createForm, creditLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Monthly Budget (₹)</label>
                      <input
                        type="number"
                        value={createForm.monthlyLimit}
                        onChange={(e) => setCreateForm({ ...createForm, monthlyLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartCreateCard}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] text-xs font-extrabold uppercase shadow-lg shadow-cyan-500/20"
                    >
                      CREATE DEMO CARD
                    </button>
                  </div>
                </>
              ) : (
                /* Animated generation sequence (Section 7) */
                <div className="py-8 text-center space-y-4">
                  <div className="relative size-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                    <CreditCard className="size-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-wider">
                      Synthesizing Virtual Card
                    </h4>
                    <p className="text-xs text-cyan-400 font-mono mt-1 animate-pulse">
                      Creating card → Encrypting demo profile → Configuring spending controls → Enabling location intelligence → Ready
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: Edit Card with Live Preview (Section 10, 51)                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editModalOpen && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#091726] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="size-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Edit Card Settings & Live Preview</h3>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Left: Settings Inputs */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Card Nickname</label>
                    <input
                      type="text"
                      value={editForm.nickname || ''}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Theme</label>
                    <select
                      value={editForm.theme || 'Midnight'}
                      onChange={(e) => setEditForm({ ...editForm, theme: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-[#091726] border border-white/10 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="Midnight">Midnight</option>
                      <option value="Cyber">Cyber</option>
                      <option value="Aurora">Aurora</option>
                      <option value="Titanium">Titanium</option>
                      <option value="Minimal">Minimal</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Daily Limit (₹)</label>
                      <input
                        type="number"
                        value={editForm.dailyLimit || 0}
                        onChange={(e) => setEditForm({ ...editForm, dailyLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Monthly Limit (₹)</label>
                      <input
                        type="number"
                        value={editForm.monthlyLimit || 0}
                        onChange={(e) => setEditForm({ ...editForm, monthlyLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Live Virtual Card Preview
                  </span>
                  <div
                    className={`w-full aspect-[1.586/1] rounded-2xl p-5 border bg-gradient-to-br ${getThemeStyle(
                      editForm.theme || 'Midnight'
                    )} shadow-xl flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-6 rounded bg-amber-400/80 border border-amber-300/40" />
                      <span className="text-[10px] font-mono text-cyan-300 uppercase font-black">
                        UPIGuard AI
                      </span>
                    </div>
                    <div className="font-mono text-lg font-bold tracking-widest text-white">
                      {currentCard.maskedNumber}
                    </div>
                    <div className="flex items-end justify-between text-xs">
                      <span className="font-bold uppercase text-white truncate max-w-[120px]">
                        {editForm.nickname || 'CARD'}
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {currentCard.expiryMonth}/{currentCard.expiryYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateCard(currentCard.cardId, editForm)
                    setEditModalOpen(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] text-xs font-extrabold uppercase shadow-lg shadow-cyan-500/20"
                >
                  SAVE CHANGES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: FULL CARD PAYMENT SIMULATOR (Section 19 - 26, 118, 119)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {simulatorOpen && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl border border-cyan-500/30 bg-[#091726] p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Closed-Loop Card Payment Simulator</h3>
                </div>
                <button onClick={() => setSimulatorOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              {simError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>{simError}</span>
                </div>
              )}

              {/* STEP 1: Input Form & Presets */}
              {simStep === 'INPUT' && (
                <div className="space-y-4 text-xs">
                  {/* Viva Demo Presets */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Viva Demo Presets (1-Click)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => loadPreset('NORMAL')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/40 text-left transition"
                      >
                        <span className="font-bold text-white block">Normal Purchase</span>
                        <span className="text-[10px] text-emerald-400">₹2,500 (Low Risk)</span>
                      </button>
                      <button
                        onClick={() => loadPreset('MAJOR_CAR')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/40 text-left transition"
                      >
                        <span className="font-bold text-white block">Major Vehicle Demo</span>
                        <span className="text-[10px] text-amber-400">₹8,50,000 (Viva Test)</span>
                      </button>
                      <button
                        onClick={() => loadPreset('SUSPICIOUS_MUMBAI')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/40 text-left transition"
                      >
                        <span className="font-bold text-white block">Critical Fraud Attempt</span>
                        <span className="text-[10px] text-rose-400">₹85,000 (Mumbai Untrusted)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-slate-300 font-bold">Merchant Name</label>
                      <input
                        type="text"
                        value={simForm.merchantName}
                        onChange={(e) => setSimForm({ ...simForm, merchantName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Amount (₹)</label>
                      <input
                        type="number"
                        value={simForm.amount}
                        onChange={(e) => setSimForm({ ...simForm, amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none focus:border-cyan-400 text-sm font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Category</label>
                      <select
                        value={simForm.category}
                        onChange={(e) => setSimForm({ ...simForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#091726] border border-white/10 text-white outline-none"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Travel">Travel</option>
                        <option value="Dining">Dining</option>
                        <option value="Gaming">Gaming (Prohibited)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Payment Channel</label>
                      <select
                        value={simForm.paymentChannel}
                        onChange={(e) => setSimForm({ ...simForm, paymentChannel: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-[#091726] border border-white/10 text-white outline-none"
                      >
                        <option value="Online">Online Gateway</option>
                        <option value="POS">POS Simulation</option>
                        <option value="Contactless">Contactless Simulation</option>
                        <option value="In-App">In-App Simulation</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Location City</label>
                      <input
                        type="text"
                        value={simForm.city}
                        onChange={(e) => setSimForm({ ...simForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-slate-300 font-bold">Device Profile</label>
                      <input
                        type="text"
                        value={simForm.device}
                        onChange={(e) => setSimForm({ ...simForm, device: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRunSimulation}
                    className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20"
                  >
                    AUTHORIZE PAYMENT PIPELINE
                  </button>
                </div>
              )}

              {/* STEP 2: "WAS THIS YOU?" Confirmation (Section 21, 110) */}
              {simStep === 'WAS_THIS_YOU' && simRiskData && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        AI RISK EVALUATION
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        simRiskData.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                        simRiskData.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        RISK SCORE: {simRiskData.riskScore}/100 ({simRiskData.riskLevel})
                      </span>
                    </div>

                    <div className="text-center py-2">
                      <h4 className="text-lg font-black text-white">WAS THIS YOU?</h4>
                      <p className="text-xs text-slate-400 mt-1">Please confirm if you initiated this card charge:</p>
                      <div className="text-2xl font-black text-white font-mono mt-2">
                        ₹{simForm.amount.toLocaleString('en-IN')}
                      </div>
                      <span className="text-xs text-cyan-400 font-bold block">{simForm.merchantName}</span>
                      <span className="text-[10px] text-slate-400 block">{simForm.city} • {simForm.device}</span>
                    </div>

                    {/* Risk Factor Breakdown */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Detection Factors</span>
                      {simRiskData.riskFactors.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white/5">
                          <span className="text-slate-300">{f.name}: {f.description}</span>
                          <span className="font-mono text-amber-400 font-bold">+{f.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleConfirmWasThisYou(false)}
                      className="flex-1 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs uppercase"
                    >
                      NO, THIS WAS NOT ME (BLOCK)
                    </button>
                    <button
                      onClick={() => handleConfirmWasThisYou(true)}
                      className="flex-1 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase shadow-md shadow-cyan-500/20"
                    >
                      YES, THIS WAS ME
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Authentication Gate (Section 22) */}
              {simStep === 'AUTH' && (
                <div className="space-y-4 text-xs">
                  <div className="text-center py-2">
                    <UserCheck className="size-10 text-cyan-400 mx-auto mb-1" />
                    <h4 className="text-base font-black text-white">Enhanced Biometric / PIN Gate</h4>
                    <p className="text-xs text-slate-400">Choose authentication method for simulated card transaction</p>
                  </div>

                  <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                    <button
                      onClick={() => setSimAuthMethod('PIN')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                        simAuthMethod === 'PIN' ? 'bg-cyan-500 text-[#06101D]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Demo PIN (2580)
                    </button>
                    <button
                      onClick={() => setSimAuthMethod('FACE_SCAN')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                        simAuthMethod === 'FACE_SCAN' ? 'bg-cyan-500 text-[#06101D]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Biometric Face Scan
                    </button>
                  </div>

                  {simAuthMethod === 'PIN' ? (
                    <div className="space-y-2">
                      <label className="text-slate-300 font-bold block text-center">Enter 4-Digit Demo PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={simPinInput}
                        onChange={(e) => setSimPinInput(e.target.value)}
                        placeholder="2580"
                        className="w-48 mx-auto px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-center text-xl tracking-[0.3em] outline-none focus:border-cyan-400 block"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                      <Scan className="size-10 text-cyan-400 mx-auto animate-pulse" />
                      <span className="text-xs font-bold text-white block">Face Scanner Ready</span>
                      <span className="text-[10px] text-slate-400 block">Click continue to confirm biological match</span>
                    </div>
                  )}

                  <button
                    onClick={handleVerifyAuthMethod}
                    className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase"
                  >
                    CONTINUE TO OTP VERIFICATION
                  </button>
                </div>
              )}

              {/* STEP 4: Random 6-Digit OTP (Section 23) */}
              {simStep === 'OTP' && simOtpChallenge && (
                <div className="space-y-4 text-xs">
                  <div className="text-center py-2">
                    <ShieldCheck className="size-10 text-cyan-400 mx-auto mb-1" />
                    <h4 className="text-base font-black text-white">Dynamic 6-Digit OTP</h4>
                    <p className="text-xs text-slate-400">Server-generated one-time token for card authorization</p>
                  </div>

                  {/* Display Generated Demo OTP Badge */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-center space-y-1">
                    <span className="text-[10px] text-cyan-300 uppercase font-mono tracking-wider block">
                      DEMO SIMULATED SMS DISPATCH
                    </span>
                    <span className="text-2xl font-black font-mono tracking-[0.2em] text-white">
                      {simOtpChallenge.demoOtp}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Valid for 3 minutes • One-time use</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 font-bold block text-center">Enter 6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={simOtpInput}
                      onChange={(e) => setSimOtpInput(e.target.value)}
                      placeholder={simOtpChallenge.demoOtp}
                      className="w-56 mx-auto px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-center text-xl tracking-[0.25em] outline-none focus:border-cyan-400 block"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase shadow-md shadow-cyan-500/20"
                  >
                    AUTHORIZE & SETTLE
                  </button>
                </div>
              )}

              {/* STEP 5: Final Result (Section 50) */}
              {simStep === 'RESULT' && simResult && (
                <div className="space-y-4 text-xs text-center py-4">
                  <div className={`size-16 rounded-full mx-auto flex items-center justify-center ${
                    simResult.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {simResult.status === 'APPROVED' ? <Check className="size-8" /> : <ShieldAlert className="size-8" />}
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-wider">
                      {simResult.status === 'APPROVED' ? 'CARD PAYMENT APPROVED' : 'TRANSACTION BLOCKED'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">{simResult.message}</p>
                  </div>

                  {simResult.tx && (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-left space-y-1 font-mono text-[11px] max-w-sm mx-auto">
                      <div className="flex justify-between">
                        <span className="text-slate-400">TXN REF:</span>
                        <span className="text-cyan-400 font-bold">{simResult.tx.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">AMOUNT:</span>
                        <span className="text-white font-bold">₹{simResult.tx.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MERCHANT:</span>
                        <span className="text-white">{simResult.tx.merchantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SETTLEMENT:</span>
                        <span className="text-emerald-400 font-bold">CLOSED-LOOP COMPLETE</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSimulatorOpen(false)
                      setActiveTab('transactions')
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06101D] font-extrabold text-xs uppercase"
                  >
                    View in Transactions
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: Freeze Card Confirmation (Section 12)                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {freezeModalOpen && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#091726] p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="size-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <Lock className="size-6" />
              </div>
              <h3 className="text-lg font-black text-white">FREEZE VIRTUAL CARD?</h3>
              <p className="text-xs text-slate-300">
                You will temporarily stop all simulated card transactions on <strong>{currentCard.nickname}</strong>.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setFreezeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    freezeCard(currentCard.cardId)
                    setFreezeModalOpen(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold uppercase shadow-lg shadow-rose-500/20"
                >
                  FREEZE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 6: Regenerate Card Confirmation (Section 14)                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {regenerateModalOpen && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#091726] p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="size-12 rounded-full bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                <RefreshCw className="size-6" />
              </div>
              <h3 className="text-lg font-black text-white">REGENERATE DEMO CARD?</h3>
              <p className="text-xs text-slate-300">
                Generate a new demo card profile? This will invalidate the current simulated card credentials and issue a new token and demo CVV.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setRegenerateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    regenerateCard(currentCard.cardId)
                    setRegenerateModalOpen(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-extrabold uppercase shadow-lg shadow-purple-500/20"
                >
                  REGENERATE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 7: Timed Lock Dropdown (Section 13)                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {lockModalOpen && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#091726] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Temporarily Lock Card</h3>
                </div>
                <button onClick={() => setLockModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: '15 Minutes', mins: 15 },
                  { label: '1 Hour', mins: 60 },
                  { label: '6 Hours', mins: 360 },
                  { label: '24 Hours', mins: 1440 }
                ].map((item) => (
                  <button
                    key={item.mins}
                    onClick={() => {
                      temporarilyLockCard(currentCard.cardId, item.mins)
                      setLockModalOpen(false)
                    }}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left text-white font-bold flex items-center justify-between transition"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 8: Delete Card Confirmation (Section 15)                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteModalOpen && currentCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#091726] p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="size-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <Trash2 className="size-6" />
              </div>
              <h3 className="text-lg font-black text-white">DELETE DEMO CARD?</h3>
              <p className="text-xs text-slate-300">
                This will soft-delete the card from active rotation. Historical transactions remain preserved in audit logs.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    deleteCard(currentCard.cardId)
                    setDeleteModalOpen(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold uppercase shadow-lg shadow-rose-500/20"
                >
                  DELETE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UserLayout>
  )
}
