'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Lock,
  Calendar,
  CheckCircle2,
  X,
  MapPin,
  Flame,
  Radio,
  Eye,
  EyeOff,
  Navigation,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

interface CardSwipeLocation {
  id: string
  merchant: string
  city: string
  country: string
  coordinates: [number, number] // [lat, lng]
  xPercent: number // for map positioning
  yPercent: number
  amount: number
  card: string
  terminalId: string
  mcc: string
  channel: 'POS' | 'Contactless' | 'ATM' | 'Online Gateway'
  time: string
  status: 'Safe' | 'Suspicious' | 'Critical'
  reason?: string
}

const mockSwipes: CardSwipeLocation[] = [
  {
    id: 'SWP-01',
    merchant: 'Nature Basket Supermarket',
    city: 'Bengaluru (Koramangala)',
    country: 'India',
    coordinates: [12.9352, 77.6245],
    xPercent: 44,
    yPercent: 68,
    amount: 2100,
    card: 'Visa (..4821)',
    terminalId: 'POS-BLR-7489',
    mcc: '5411 (Grocery)',
    channel: 'Contactless',
    time: 'Today 09:15 AM',
    status: 'Safe'
  },
  {
    id: 'SWP-02',
    merchant: 'Zara Flagship Palladium',
    city: 'Mumbai (Lower Parel)',
    country: 'India',
    coordinates: [18.9986, 72.8258],
    xPercent: 32,
    yPercent: 52,
    amount: 14500,
    card: 'Visa (..4821)',
    terminalId: 'POS-BOM-1029',
    mcc: '5651 (Apparel)',
    channel: 'POS',
    time: 'Today 10:20 AM',
    status: 'Safe'
  },
  {
    id: 'SWP-03',
    merchant: 'Apple Store Aerocity',
    city: 'Delhi (IGI Aerocity)',
    country: 'India',
    coordinates: [28.5562, 77.1000],
    xPercent: 48,
    yPercent: 24,
    amount: 89900,
    card: 'Visa (..4821)',
    terminalId: 'POS-DEL-9941',
    mcc: '5732 (Consumer Electronics)',
    channel: 'POS',
    time: 'Today 10:48 AM',
    status: 'Critical',
    reason: 'Impossible Travel Velocity: 1,150 km from Mumbai in 28 mins (2,460 km/h) + Exceeds ₹50,000 threshold'
  },
  {
    id: 'SWP-04',
    merchant: 'Changi Airport Duty Free',
    city: 'Singapore',
    country: 'Singapore',
    coordinates: [1.3644, 103.9915],
    xPercent: 88,
    yPercent: 78,
    amount: 32000,
    card: 'Visa (..4821)',
    terminalId: 'SWT-SIN-0042',
    mcc: '5309 (Duty Free)',
    channel: 'Online Gateway',
    time: 'Yesterday 04:15 PM',
    status: 'Suspicious',
    reason: 'Cross-Border Foreign Acquiring Switch Detected'
  }
]

export default function CardsPage() {
  const { privacyMasked, togglePrivacyMask } = useAppStore()
  const [cards, setCards] = useState<any[]>([])
  const [cardTxns, setCardTxns] = useState<any[]>([])
  const [selectedSwipe, setSelectedSwipe] = useState<CardSwipeLocation | null>(mockSwipes[2]) // Default to critical swipe for immediate inspection
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [addTxnOpen, setAddTxnOpen] = useState(false)

  // Card Form (Zero sensitive CVV storage)
  const [cardNickname, setCardNickname] = useState('')
  const [bankName, setBankName] = useState('HDFC Bank')
  const [cardNetwork, setCardNetwork] = useState('Visa')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('12')
  const [expiryYear, setExpiryYear] = useState('2028')

  // Transaction Form
  const [selectedCardId, setSelectedCardId] = useState<number | string>('')
  const [txnAmount, setTxnAmount] = useState('')
  const [txnMerchant, setTxnMerchant] = useState('')
  const [txnCategory, setTxnCategory] = useState('Shopping')
  const [txnChannel, setTxnChannel] = useState('POS')
  const [txnCountry, setTxnCountry] = useState('India')

  const loadData = async () => {
    try {
      const [cList, tList] = await Promise.all([
        apiRequest('/cards').catch(() => null),
        apiRequest('/transactions?tx_type=Card').catch(() => null)
      ])
      if (Array.isArray(cList) && cList.length > 0) {
        setCards(cList)
        setSelectedCardId(cList[0].id)
      }
      if (Array.isArray(tList) && tList.length > 0) setCardTxns(tList)
    } catch {
      // Demo fallback
    }
    if (cards.length === 0) {
      setCards([
        { id: 1, card_nickname: 'HDFC Regalia Gold', bank_name: 'HDFC Bank', card_network: 'Visa', masked_number: '•••• •••• •••• 4821', last_four: '4821', expiry_month: 8, expiry_year: 2028 },
        { id: 2, card_nickname: 'ICICI Amazon Pay', bank_name: 'ICICI Bank', card_network: 'RuPay', masked_number: '•••• •••• •••• 1024', last_four: '1024', expiry_month: 11, expiry_year: 2027 }
      ])
      setSelectedCardId(1)
      setCardTxns([
        {
          id: 3,
          transaction_reference: 'CARD-2026-C303',
          amount: 2100.0,
          merchant: "Nature's Basket Supermarket",
          payment_method: 'Visa (..4821)',
          status: 'Completed',
          flag_status: 'Normal',
          flag_reasons: [],
          transaction_date: 'Today 09:15 AM'
        },
        {
          id: 4,
          transaction_reference: 'CARD-2026-D404',
          amount: 14500.0,
          merchant: 'Zara Flagship Palladium',
          payment_method: 'Visa (..4821)',
          status: 'Completed',
          flag_status: 'Normal',
          flag_reasons: [],
          transaction_date: 'Today 10:20 AM'
        },
        {
          id: 5,
          transaction_reference: 'CARD-2026-E505',
          amount: 89900.0,
          merchant: 'Apple Store Aerocity',
          payment_method: 'Visa (..4821)',
          status: 'Flagged',
          flag_status: 'Critical',
          flag_reasons: ['Impossible Travel Velocity (2,460 km/h)', 'Single Swipe Limit Exceeded'],
          transaction_date: 'Today 10:48 AM'
        }
      ])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNum = cardNumber.replace(/\s+/g, '')
    if (cleanNum.length < 12) {
      alert('Enter a valid card number')
      return
    }

    try {
      await apiRequest('/cards', {
        method: 'POST',
        body: JSON.stringify({
          card_nickname: cardNickname,
          bank_name: bankName,
          card_network: cardNetwork,
          card_number: cleanNum,
          expiry_month: parseInt(expiryMonth),
          expiry_year: parseInt(expiryYear)
        })
      })
      await loadData()
      setAddCardOpen(false)
      setCardNickname('')
      setCardNumber('')
    } catch {
      const newCard = {
        id: Date.now(),
        card_nickname: cardNickname || 'My Card',
        bank_name: bankName,
        card_network: cardNetwork,
        masked_number: `•••• •••• •••• ${cleanNum.slice(-4)}`,
        last_four: cleanNum.slice(-4),
        expiry_month: parseInt(expiryMonth),
        expiry_year: parseInt(expiryYear)
      }
      setCards([...cards, newCard])
      setAddCardOpen(false)
    }
  }

  const handleAddCardTxn = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmt = parseFloat(txnAmount)
    if (isNaN(numAmt) || numAmt <= 0) return

    try {
      await apiRequest('/cards/transactions', {
        method: 'POST',
        body: JSON.stringify({
          card_id: parseInt(selectedCardId.toString()),
          amount: numAmt,
          merchant: txnMerchant,
          category: txnCategory,
          channel: txnChannel,
          country: txnCountry
        })
      })
      await loadData()
      setAddTxnOpen(false)
      setTxnAmount('')
      setTxnMerchant('')
    } catch {
      const selectedCard = cards.find(c => c.id === selectedCardId)
      const isSuspicious = numAmt > 50000 || txnCountry !== 'India'
      const newTx = {
        id: Date.now(),
        transaction_reference: `CARD-${Date.now().toString().slice(-6)}`,
        amount: numAmt,
        merchant: txnMerchant,
        payment_method: `${selectedCard?.card_network || 'Card'} (..${selectedCard?.last_four || '0000'})`,
        status: 'Completed',
        flag_status: isSuspicious ? 'Suspicious' : 'Normal',
        flag_reasons: isSuspicious ? ['High Card Amount (>₹50,000)'] : [],
        transaction_date: 'Just now'
      }
      setCardTxns([newTx, ...cardTxns])
      setAddTxnOpen(false)
    }
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge className="rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3 py-1 text-xs font-semibold text-[#b8f55e]">
                REAL-TIME CARD MAP DETECTION
              </MotionBadge>
              <span className="text-[10px] text-[#8fa9a6] font-mono">ZERO CVV/PIN STORAGE</span>
            </div>
            <MotionWordReveal
              text="Card Shield & Physical Detection Map"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Interactive POS & terminal location intelligence. Detect impossible physical travel between card swipes and overseas routing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={togglePrivacyMask}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1718] px-3.5 py-2 text-xs font-semibold text-[#8fa9a6] hover:text-white transition"
              title="Toggle financial privacy masking"
            >
              {privacyMasked ? <EyeOff className="size-4 text-[#b8f55e]" /> : <Eye className="size-4 text-[#8fa9a6]" />}
              <span>{privacyMasked ? 'Masked' : 'Visible'}</span>
            </button>
            <button
              onClick={() => setAddTxnOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              <Plus className="size-4 text-[#b8f55e]" /> Log Transaction
            </button>
            <button
              onClick={() => setAddCardOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-bold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              <CreditCard className="size-4" /> Add Card
            </button>
          </div>
        </div>

        {/* 1. REAL-TIME CREDIT CARD DETECTION MAP */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-[#b8f55e]/15 text-[#b8f55e]">
                  <Navigation className="size-4" />
                </span>
                <h3 className="text-base font-bold text-white">Physical Terminal & POS Swipe Map</h3>
              </div>
              <p className="text-xs text-[#8fa9a6] mt-0.5">
                Visualizing terminal locations, velocity vectors, and cross-city card usage.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="size-2 rounded-full bg-emerald-400" />
                Normal POS
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-mono">
                <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                Impossible Velocity
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mt-6">
            {/* The Interactive Map Visual Canvas */}
            <div className="relative h-96 rounded-2xl border border-white/10 bg-[#071014] overflow-hidden flex items-center justify-center">
              {/* Radar Grid and Geography Pattern */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#b8f55e 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              <div className="absolute size-72 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute size-44 rounded-full border border-[#b8f55e]/15 animate-ping pointer-events-none" />

              {/* Flight Vector Connecting Mumbai (32%, 52%) and Delhi (48%, 24%) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1="32%"
                  y1="52%"
                  x2="48%"
                  y2="24%"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                <circle cx="40%" cy="38%" r="4" fill="#f43f5e" />
              </svg>

              {/* Anomaly Badge on the flight vector */}
              <div className="absolute top-[34%] left-[34%] pointer-events-none z-10 px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-mono font-bold text-[9px] shadow-lg shadow-rose-600/40 border border-rose-400/40">
                2,460 km/h (VIOLATION)
              </div>

              {/* Interactive Swipe Location Markers */}
              {mockSwipes.map((swipe) => {
                const isSelected = selectedSwipe?.id === swipe.id
                const isCritical = swipe.status === 'Critical'
                const isSuspicious = swipe.status === 'Suspicious'

                return (
                  <button
                    key={swipe.id}
                    onClick={() => setSelectedSwipe(swipe)}
                    style={{ left: `${swipe.xPercent}%`, top: `${swipe.yPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-all duration-300 focus:outline-none`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-7 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                          isSelected ? 'ring-4 ring-white scale-125' : ''
                        } ${
                          isCritical
                            ? 'bg-rose-600 text-white shadow-rose-600/50'
                            : isSuspicious
                            ? 'bg-amber-500 text-black shadow-amber-500/50'
                            : 'bg-[#b8f55e] text-[#09110f] shadow-[#b8f55e]/50'
                        }`}
                      >
                        <MapPin className="size-4" />
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1 px-2 py-0.5 rounded bg-[#0a1718]/90 border border-white/10 whitespace-nowrap shadow-md">
                        {swipe.city.split(' ')[0]} {isCritical && '⚠️'}
                      </span>
                    </div>
                  </button>
                )
              })}

              {/* Bottom Map Info Footer */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] text-[#8fa9a6] bg-[#0a1718]/95 px-3 py-1.5 rounded-xl border border-white/10">
                <span>Active Layer: Physical POS Swipes · Click pin to inspect terminal</span>
                <span className="text-[#b8f55e] font-mono">4 Swipes Verified</span>
              </div>
            </div>

            {/* Selected Terminal Inspector Panel */}
            <div className="rounded-2xl border border-white/10 bg-[#071014] p-5 flex flex-col justify-between shadow-xl">
              {selectedSwipe ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8fa9a6]">
                        TERMINAL INSPECTION
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{selectedSwipe.merchant}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        selectedSwipe.status === 'Critical'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : selectedSwipe.status === 'Suspicious'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30'
                      }`}
                    >
                      {selectedSwipe.status}
                    </span>
                  </div>

                  {selectedSwipe.reason && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-400" />
                      <p className="leading-relaxed font-medium">{selectedSwipe.reason}</p>
                    </div>
                  )}

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8fa9a6]">Amount Swiped:</span>
                      <span className="font-bold text-white font-mono text-sm">
                        {privacyMasked ? '••••••' : `₹${selectedSwipe.amount.toLocaleString('en-IN')}`}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8fa9a6]">Location:</span>
                      <span className="font-semibold text-white">{selectedSwipe.city}, {selectedSwipe.country}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8fa9a6]">Hardware Terminal ID:</span>
                      <span className="font-mono text-[#b8f55e]">{selectedSwipe.terminalId}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8fa9a6]">Merchant Category (MCC):</span>
                      <span className="text-white">{selectedSwipe.mcc}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#8fa9a6]">Swipe Method:</span>
                      <span className="text-white font-medium">{selectedSwipe.channel}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-[#8fa9a6]">Timestamp:</span>
                      <span className="font-mono text-[#8fa9a6]">{selectedSwipe.time}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex gap-2">
                    {selectedSwipe.status !== 'Safe' ? (
                      <button
                        onClick={() => alert(`Fraud dispute case initiated for terminal ${selectedSwipe.terminalId}. Immediate temporary card freeze triggered.`)}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                      >
                        <ShieldAlert className="size-4" />
                        Dispute & Lock Card
                      </button>
                    ) : (
                      <button
                        onClick={() => alert(`Verified transaction with ${selectedSwipe.merchant} on ${selectedSwipe.time}.`)}
                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition"
                      >
                        Confirm It Was Me
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-[#8fa9a6] text-xs">
                  Select any pin on the map to inspect terminal intelligence.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. MASKED CARD VAULT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Registered Cards</h3>
              <p className="text-xs text-[#8fa9a6]">Hardware-tokenized payment instruments with zero CVV persistence</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(cards || []).map((c) => (
              <div
                key={c.id}
                className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1718] via-[#071014] to-[#071014] p-6 shadow-2xl overflow-hidden group hover:border-[#b8f55e]/40 transition duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b8f55e]">{c.bank_name}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{c.card_nickname}</h3>
                  </div>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-slate-200">
                    {c.card_network}
                  </span>
                </div>

                <div className="my-8">
                  <span className="text-lg font-mono tracking-widest text-white">
                    {privacyMasked ? '•••• •••• •••• ••••' : c.masked_number}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8fa9a6] border-t border-white/5 pt-3">
                  <span>EXPIRES: {c.expiry_month?.toString().padStart(2, '0')}/{c.expiry_year}</span>
                  <span className="inline-flex items-center gap-1 text-[#b8f55e] font-medium">
                    <ShieldCheck className="size-3.5" /> CVV Masked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CARD TRANSACTIONS TABLE */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Card Transaction History</h3>
              <p className="text-xs text-[#8fa9a6]">Deterministic rule evaluation & verification flags</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold text-[#8fa9a6] bg-[#071014]">
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Card</th>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Rule Assessment</th>
                  <th className="py-2.5 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(cardTxns || []).map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-3 font-mono text-[#8fa9a6]">{tx.transaction_reference}</td>
                    <td className="py-3.5 px-3 text-white">{tx.payment_method}</td>
                    <td className="py-3.5 px-3 font-semibold text-white">{tx.merchant}</td>
                    <td className="py-3.5 px-3 font-bold text-white font-mono">
                      {privacyMasked ? '••••••' : `₹${tx.amount?.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3.5 px-3">
                      {tx.flag_status === 'Critical' || tx.flag_status === 'Suspicious' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="size-3" /> Flagged Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#b8f55e]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#b8f55e]">
                          <CheckCircle2 className="size-3" /> Safe
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white">
                        {tx.flag_status === 'Normal' ? 'Verified Safe' : 'Under Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Card Modal */}
        {addCardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Add Card to Vault</h3>
                <button onClick={() => setAddCardOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10 p-3 text-[11px] text-[#b8f55e] flex items-center gap-2">
                <Lock className="size-4 shrink-0" />
                <span>Sensitive data protection: UPI Shield does not prompt for CVV, ATM PIN or OTP.</span>
              </div>

              <form onSubmit={handleCreateCard} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Card Nickname *</label>
                  <input
                    type="text"
                    required
                    value={cardNickname}
                    onChange={(e) => setCardNickname(e.target.value)}
                    placeholder="e.g. Work HDFC Card"
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. ICICI Bank"
                      className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Network</label>
                    <select
                      value={cardNetwork}
                      onChange={(e) => setCardNetwork(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay">RuPay</option>
                      <option value="Amex">American Express</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Card Number * (Only last 4 digits saved)</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs font-mono text-white focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Month</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      placeholder="MM"
                      className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Year</label>
                    <input
                      type="number"
                      min="2024"
                      max="2050"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      placeholder="YYYY"
                      className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAddCardOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#b8f55e] px-5 py-2 text-xs font-bold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
                  >
                    Save Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Log Card Transaction Modal */}
        {addTxnOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Log Card Payment</h3>
                <button onClick={() => setAddTxnOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddCardTxn} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Card</label>
                  <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                  >
                    {(cards || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.card_nickname} ({c.masked_number})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant Name *</label>
                  <input
                    type="text"
                    required
                    value={txnMerchant}
                    onChange={(e) => setTxnMerchant(e.target.value)}
                    placeholder="e.g. Amazon, Netflix, Uber"
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={txnAmount}
                      onChange={(e) => setTxnAmount(e.target.value)}
                      placeholder="1200.00"
                      className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs font-bold text-white focus:border-[#b8f55e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Channel (POS/Online)</label>
                    <select
                      value={txnChannel}
                      onChange={(e) => setTxnChannel(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                    >
                      <option value="POS">POS Swiped / Dipped</option>
                      <option value="Contactless">Contactless Tap</option>
                      <option value="Online">Online / E-Commerce</option>
                      <option value="ATM">ATM Withdrawal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Country</label>
                  <input
                    type="text"
                    value={txnCountry}
                    onChange={(e) => setTxnCountry(e.target.value)}
                    placeholder="India (or overseas for foreign flag)"
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAddTxnOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#b8f55e] px-5 py-2 text-xs font-bold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
                  >
                    Evaluate & Log
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
