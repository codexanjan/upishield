'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Cpu,
  Layers,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Zap,
  Activity,
  Terminal,
  Clock,
  ArrowRight,
  Code,
  Check,
  Info,
  Server,
  Database
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import { UnifiedUpiTransaction, DynamicRiskAssessment } from '@/lib/ai-fraud-engine'

export default function AdminUpiIntegrationsPage() {
  const {
    upiProviders,
    ingestGenericUpi
  } = useUPIGuardStore()

  // Ingestion Simulator State
  const [selectedProviderCode, setSelectedProviderCode] = useState<'APP_A' | 'APP_B' | 'APP_C'>('APP_A')
  const [senderVpa, setSenderVpa] = useState('user.demo@okaxis')
  const [receiverVpa, setReceiverVpa] = useState('nature.basket@icici')
  const [amount, setAmount] = useState<number>(1250)
  const [city, setCity] = useState('Bengaluru')
  const [channel, setChannel] = useState<'INTENT' | 'COLLECT' | 'QR_DYNAMIC'>('INTENT')
  const [note, setNote] = useState('Monthly organic produce')
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestionResult, setIngestionResult] = useState<{
    txn: UnifiedUpiTransaction
    assessment: DynamicRiskAssessment
    providerName: string
  } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Scenario presets for viva presentation
  const loadScenario = (type: 'SAFE' | 'BURST_FRAUD' | 'TAMPERED_QR') => {
    if (type === 'SAFE') {
      setSelectedProviderCode('APP_A')
      setSenderVpa('anjan.sharma@okaxis')
      setReceiverVpa('coffee.day@hdfc')
      setAmount(380)
      setCity('Bengaluru')
      setChannel('INTENT')
      setNote('Artisanal cappuccino with colleagues')
    } else if (type === 'BURST_FRAUD') {
      setSelectedProviderCode('APP_B')
      setSenderVpa('rohan.m@okicici')
      setReceiverVpa('scammer.refund@okaxis')
      setAmount(49500)
      setCity('Kolkata')
      setChannel('COLLECT')
      setNote('Urgent electricity bill cancellation fee')
    } else {
      setSelectedProviderCode('APP_C')
      setSenderVpa('priya.v@oksbi')
      setReceiverVpa('claim.bonus@okhdfcbank')
      setAmount(18000)
      setCity('New Delhi')
      setChannel('QR_DYNAMIC')
      setNote('Festival lucky jackpot winner claim')
    }
  }

  // Handle transaction submission to provider-agnostic common UPI API
  const handleIngest = async () => {
    setIsIngesting(true)
    const provider = upiProviders.find((p) => p.app_code === selectedProviderCode) || upiProviders[0]

    const commonPayload: UnifiedUpiTransaction = {
      id: `UPI-TX-${Date.now().toString().slice(-6)}`,
      source_app:
        selectedProviderCode === 'APP_A'
          ? 'GooglePay'
          : selectedProviderCode === 'APP_B'
          ? 'PhonePe'
          : 'Paytm',
      sender_user_id: 1,
      sender_vpa: senderVpa,
      receiver_vpa: receiverVpa,
      receiver_name: receiverVpa.split('@')[0],
      amount: Number(amount),
      currency: 'INR',
      timestamp: new Date().toISOString(),
      device_id: 'DEV-FINGERPRINT-X99',
      location: {
        city: city,
        latitude: 12.9716,
        longitude: 77.5946
      },
      channel: channel,
      payment_note: note
    }

    try {
      // 1. Process via reactive store
      const result = ingestGenericUpi(commonPayload)

      // 2. Also dispatch to backend API route
      await fetch('/api/v1/upi/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_app_code: selectedProviderCode,
          transaction: commonPayload
        })
      }).catch((e) => console.log('API sync fallback', e))

      setTimeout(() => {
        setIsIngesting(false)
        setIngestionResult({
          txn: commonPayload,
          assessment: result.assessment,
          providerName: provider.app_name
        })
        setNotice(
          `Transaction processed through Common UPI API. Decision: ${result.assessment.decision} (Risk Score: ${result.assessment.overall_risk_score}/100)`
        )
      }, 700)
    } catch (e) {
      setIsIngesting(false)
      setNotice('Ingestion completed with simulated risk evaluation.')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PROVIDER-AGNOSTIC INTEGRATION
              </span>
              <span className="text-xs text-white/50">Objective 3 Architecture</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Cross-UPI Application Integrations</h1>
            <p className="text-sm text-white/60">
              Generic multi-app gateway supporting diverse payment rails through a unified transaction schema and decoupled AI fraud engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <Info className="size-3.5" />
              DEMO / SIMULATED ENVIRONMENT
            </span>
          </div>
        </div>

        {/* Notice Banner */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10 text-xs text-[#b8f55e] flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Zap className="size-4 shrink-0 text-[#b8f55e]" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-white/40 hover:text-white text-xs">
              ✕
            </button>
          </motion.div>
        )}

        {/* Academic Boundary Disclosure Callout */}
        <div className="p-4 rounded-2xl border border-white/10 bg-[#0a1718] text-xs text-white/70 space-y-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldCheck className="size-4 text-[#b8f55e]" />
            Provider-Agnostic Gateway Architecture (Academic Disclaimer)
          </div>
          <p className="text-white/60 leading-relaxed">
            In compliance with project specifications, UPIGuard AI creates a generic, provider-neutral integration layer. Rather than claiming unauthorized proprietary integrations with specific banks or commercial apps, external sources connect through standard simulated endpoints (<code className="text-[#b8f55e]">UPI App A</code>, <code className="text-[#b8f55e]">UPI App B</code>, <code className="text-[#b8f55e]">UPI App C</code>). All payloads are normalized into a single unified JSON schema for multi-model AI evaluation.
          </p>
        </div>

        {/* 3 Connected UPI Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upiProviders.map((prov) => {
            const isHealthy = prov.api_health === 'HEALTHY'
            return (
              <div
                key={prov.id}
                className="p-5 rounded-2xl border border-white/10 bg-[#0a1718] hover:border-white/20 transition-all space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/70">
                        {prov.app_code}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        DEMO
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{prov.app_name}</h3>
                    <p className="text-[11px] font-mono text-white/40 truncate">Key: {prov.api_key}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      isHealthy
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {prov.api_health}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-[10px] text-white/40 block">Processed</span>
                    <span className="text-lg font-mono font-bold text-white">
                      {prov.transactions_processed.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-0.5">
                    <span className="text-[10px] text-rose-300/70 block">Fraud</span>
                    <span className="text-lg font-mono font-bold text-rose-400">
                      {prov.fraud_detected.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                    <span className="text-[10px] text-emerald-300/70 block">Legitimate</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {prov.legitimate_count.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 font-mono">
                  <span>Latency: ~{prov.avg_response_time_ms}ms</span>
                  <span>
                    Last Txn:{' '}
                    {new Date(prov.last_transaction_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ingestion Pipeline Architecture Flow */}
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0a1718] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Multi-App Ingestion & Fraud Detection Pipeline</h3>
              <p className="text-xs text-white/50">Decoupled dataflow mandatory for Objective 3 cross-platform scalability</p>
            </div>
            <span className="text-xs text-[#b8f55e] font-mono">Zero Code Duplication</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
            {[
              { step: '1', title: 'UPI Sources', desc: 'App A / B / C payloads', color: 'border-blue-500/30' },
              { step: '2', title: 'Common UPI API', desc: 'Normalized schema', color: 'border-cyan-500/30' },
              { step: '3', title: 'Feature Extraction', desc: '12 behavior signals', color: 'border-purple-500/30' },
              { step: '4', title: 'AI Models', desc: 'XGBoost & IF trees', color: 'border-amber-500/30' },
              { step: '5', title: 'Risk Fusion', desc: 'Ensemble score (0-100)', color: 'border-rose-500/30' },
              { step: '6', title: 'Dynamic Cutoff', desc: 'Adaptive Bayesian tier', color: 'border-[#b8f55e]/30' },
              { step: '7', title: 'Fraud Decision', desc: 'Approve / Flag / Block', color: 'border-emerald-500/30' }
            ].map((node, i) => (
              <div key={i} className={`p-3 rounded-xl border ${node.color} bg-white/5 flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#b8f55e]">Step {node.step}</span>
                  {i < 6 && <span className="text-xs text-white/30">→</span>}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{node.title}</h4>
                  <p className="text-[10px] text-white/50">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Ingestion Simulator Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Form */}
          <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#0a1718] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="size-4 text-[#b8f55e]" />
                  Simulate Multi-App UPI Ingestion
                </h3>
                <p className="text-xs text-white/50">Inject real payload into the generic ingestion engine to test AI risk scoring</p>
              </div>

              {/* Scenario Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => loadScenario('SAFE')}
                  className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] hover:bg-emerald-500/20 cursor-pointer"
                >
                  Safe P2P
                </button>
                <button
                  onClick={() => loadScenario('BURST_FRAUD')}
                  className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[11px] hover:bg-rose-500/20 cursor-pointer"
                >
                  Phish Collect
                </button>
                <button
                  onClick={() => loadScenario('TAMPERED_QR')}
                  className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] hover:bg-amber-500/20 cursor-pointer"
                >
                  Tampered QR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/60 font-semibold">Originating UPI App</label>
                <select
                  value={selectedProviderCode}
                  onChange={(e) => setSelectedProviderCode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white focus:outline-none focus:border-[#b8f55e]/50 cursor-pointer"
                >
                  <option value="APP_A">UPI App A (Simulated Consumer Rail)</option>
                  <option value="APP_B">UPI App B (Merchant Gateway Rail)</option>
                  <option value="APP_C">UPI App C (Neobank QR Network)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-semibold">Payment Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white focus:outline-none focus:border-[#b8f55e]/50 cursor-pointer"
                >
                  <option value="INTENT">P2P Peer Intent</option>
                  <option value="COLLECT">Merchant / User Collect Request</option>
                  <option value="QR_DYNAMIC">Dynamic Bharat QR Scan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-semibold">Sender UPI Handle</label>
                <input
                  type="text"
                  value={senderVpa}
                  onChange={(e) => setSenderVpa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white font-mono focus:outline-none focus:border-[#b8f55e]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-semibold">Receiver VPA / Merchant</label>
                <input
                  type="text"
                  value={receiverVpa}
                  onChange={(e) => setReceiverVpa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white font-mono focus:outline-none focus:border-[#b8f55e]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-semibold">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white font-mono font-bold focus:outline-none focus:border-[#b8f55e]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-semibold">Location / Geo City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white focus:outline-none focus:border-[#b8f55e]/50"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-white/60 font-semibold">Transaction Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#071014] text-white focus:outline-none focus:border-[#b8f55e]/50"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleIngest}
                disabled={isIngesting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#b8f55e] text-[#071014] hover:bg-[#c9f97f] flex items-center gap-2 shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Zap className={`size-4 ${isIngesting ? 'animate-bounce' : ''}`} />
                {isIngesting ? 'Routing via AI Engine...' : 'Ingest & Evaluate Transaction'}
              </button>
            </div>
          </div>

          {/* Real-time Trace & Evaluation Output */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#0a1718] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-[#b8f55e]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Live AI Decision Trace</h4>
                </div>
                <span className="text-[10px] font-mono text-white/40">Inference Gateway</span>
              </div>

              {ingestionResult ? (
                <div className="space-y-4 pt-3">
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Decision</span>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          ingestionResult.assessment.decision === 'BLOCK'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : ingestionResult.assessment.decision === 'HOLD'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : ingestionResult.assessment.decision === 'VERIFY'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ingestionResult.assessment.decision}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Overall Risk Score</span>
                      <span className="text-xl font-mono font-bold text-white">
                        {ingestionResult.assessment.overall_risk_score} / 100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Adaptive Threshold</span>
                      <span className="text-xs font-mono text-white/80">
                        {ingestionResult.assessment.adaptive_threshold}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Source App</span>
                      <span className="text-xs font-bold text-[#b8f55e]">
                        {ingestionResult.providerName}
                      </span>
                    </div>
                  </div>

                  {/* SHAP Contributions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-white/70">Primary Risk Driver:</span>
                    <p className="text-xs text-rose-400 font-medium">
                      {ingestionResult.assessment.explainable_ai.primary_risk_driver || 'Nominal behavior profile'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-white/70">Top Contributing Factors:</span>
                    <div className="space-y-1 pt-1">
                      {ingestionResult.assessment.explainable_ai.shap_contributions.slice(0, 3).map((factor, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                          <span className="text-white/80">{factor.feature_name}</span>
                          <span className={`font-mono font-bold ${factor.impact_score > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {factor.impact_score > 0 ? `+${factor.impact_score}` : factor.impact_score} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-white/40 space-y-2">
                  <Cpu className="size-8 mx-auto opacity-30" />
                  <p className="text-xs">No active transaction evaluated yet.</p>
                  <p className="text-[10px] text-white/30">Select a scenario or fill the form on the left and click Ingest.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 text-[11px] text-white/40 font-mono flex items-center justify-between">
              <span>Decoupled Inference Engine</span>
              <span>Latency: ~18ms</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
