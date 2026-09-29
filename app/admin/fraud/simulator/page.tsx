'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Laptop,
  MapPin,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import { calculateUpiGuardMasterRisk, UpiGuardRiskOutput } from '@/lib/ai-fraud-engine'

interface SimulatorPreset {
  key: string
  name: string
  category: 'BENIGN' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  expectedRisk: number
  expectedDecision: 'ALLOW' | 'VERIFY' | 'HOLD' | 'BLOCK'
  amount: number
  receiverUpi: string
  receiverName: string
  isNewDevice: boolean
  deviceTrust: number
  locationCity: string
  normalCity: string
  velocityCount: number
  description: string
  scenarioDetails: string
}

export default function FraudSimulatorPage() {
  const router = useRouter()
  const { triggerScenario, clearScenario, resetDemoEnvironment } = useUPIGuardStore()

  const presets: SimulatorPreset[] = [
    {
      key: 'NORMAL_PAYMENT',
      name: 'Normal Payment (Viva Demo 1)',
      category: 'BENIGN',
      expectedRisk: 8,
      expectedDecision: 'ALLOW',
      amount: 250,
      receiverUpi: 'coffee@upiguard',
      receiverName: 'UPIGuard Coffee',
      isNewDevice: false,
      deviceTrust: 96,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 1,
      description: 'Morning espresso payment at trusted local cafe.',
      scenarioDetails: 'Known device keystore, familiar Hubballi geofence, ticket size aligned with baseline.'
    },
    {
      key: 'SAFE_MERCHANT',
      name: 'Standard Electronics Purchase (Viva Setup)',
      category: 'BENIGN',
      expectedRisk: 18,
      expectedDecision: 'ALLOW',
      amount: 5000,
      receiverUpi: 'abc@upiguard',
      receiverName: 'ABC Electronics',
      isNewDevice: false,
      deviceTrust: 94,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 1,
      description: 'Customer purchasing verified electronics item via QR.',
      scenarioDetails: 'Verified merchant identity, normal diurnal time, trusted hardware endpoint.'
    },
    {
      key: 'MEDIUM_RISK',
      name: 'Medium Risk Adaptive Auth (Viva Demo 3)',
      category: 'MEDIUM',
      expectedRisk: 52,
      expectedDecision: 'VERIFY',
      amount: 12000,
      receiverUpi: 'fresh.decor@okhdfc',
      receiverName: 'Fresh Home Decor',
      isNewDevice: false,
      deviceTrust: 90,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 1,
      description: 'Unusual amount to first-time beneficiary during evening.',
      scenarioDetails: 'Known device and location, but ticket size is 4x standard and recipient is new. Requires PIN/Face + OTP.'
    },
    {
      key: 'HIGH_VALUE',
      name: 'High Value Ticket Spike',
      category: 'HIGH',
      expectedRisk: 78,
      expectedDecision: 'HOLD',
      amount: 49000,
      receiverUpi: 'abc@upiguard',
      receiverName: 'ABC Electronics',
      isNewDevice: false,
      deviceTrust: 92,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 2,
      description: 'Single payment nearing maximum daily UPI threshold.',
      scenarioDetails: 'Known merchant, but severe amount anomaly (+35 pts). Step-up authentication required.'
    },
    {
      key: 'NEW_DEVICE',
      name: 'Unrecognized Device Fingerprint',
      category: 'HIGH',
      expectedRisk: 74,
      expectedDecision: 'HOLD',
      amount: 8500,
      receiverUpi: 'abc@upiguard',
      receiverName: 'ABC Electronics',
      isNewDevice: true,
      deviceTrust: 18,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 1,
      description: 'Login from newly formatted phone with missing hardware attestation.',
      scenarioDetails: 'Endpoint trust score 18/100 triggers Device Risk warning (+28 pts).'
    },
    {
      key: 'LOCATION_ANOMALY',
      name: 'Geographic City Anomaly',
      category: 'HIGH',
      expectedRisk: 76,
      expectedDecision: 'HOLD',
      amount: 15000,
      receiverUpi: 'abc@upiguard',
      receiverName: 'ABC Electronics',
      isNewDevice: false,
      deviceTrust: 90,
      locationCity: 'Mumbai',
      normalCity: 'Hubballi',
      velocityCount: 1,
      description: 'Payment initiated from Mumbai (~1,300 km from Hubballi home cluster).',
      scenarioDetails: 'Geofence departure without prior travel declaration (+25 pts).'
    },
    {
      key: 'RAPID_TRANSACTIONS',
      name: 'High-Frequency Velocity Burst',
      category: 'HIGH',
      expectedRisk: 79,
      expectedDecision: 'HOLD',
      amount: 4500,
      receiverUpi: 'coffee@upiguard',
      receiverName: 'UPIGuard Coffee',
      isNewDevice: false,
      deviceTrust: 92,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 6,
      description: '6 consecutive payments in under 60 seconds.',
      scenarioDetails: 'Automated script / BOT rapid collect signature detected (+30 pts).'
    },
    {
      key: 'SUSPICIOUS_QR',
      name: 'Malicious QR Parameter Injection',
      category: 'HIGH',
      expectedRisk: 84,
      expectedDecision: 'HOLD',
      amount: 3200,
      receiverUpi: 'scam.redirect@upi',
      receiverName: 'Tampered QR Standee',
      isNewDevice: false,
      deviceTrust: 90,
      locationCity: 'Hubballi',
      normalCity: 'Hubballi',
      velocityCount: 1,
      description: 'Physical QR standee sticker replaced with malicious redirect URI.',
      scenarioDetails: 'Payload analysis flags invalid query parameters violating NPCI Bharat QR standard.'
    },
    {
      key: 'IMPOSSIBLE_TRAVEL',
      name: 'Impossible Travel Velocity',
      category: 'CRITICAL',
      expectedRisk: 92,
      expectedDecision: 'BLOCK',
      amount: 22000,
      receiverUpi: 'electronics.delhi@icici',
      receiverName: 'Delhi Retail Store',
      isNewDevice: true,
      deviceTrust: 25,
      locationCity: 'Delhi',
      normalCity: 'Hubballi',
      velocityCount: 3,
      description: 'Payment in Delhi 15 minutes after in-person payment in Hubballi.',
      scenarioDetails: 'Haversine velocity > 2,800 km/h violates physical flight limits. Instant automated block.'
    },
    {
      key: 'ACCOUNT_TAKEOVER',
      name: 'Account Takeover (Viva Demo 2 — Blocked)',
      category: 'CRITICAL',
      expectedRisk: 95,
      expectedDecision: 'BLOCK',
      amount: 75000,
      receiverUpi: 'scammer.refund@okaxis',
      receiverName: 'Overseas Support (Flagged)',
      isNewDevice: true,
      deviceTrust: 18,
      locationCity: 'Mumbai',
      normalCity: 'Hubballi',
      velocityCount: 4,
      description: '₹75,000 wire to flagged VPA from unknown device in Mumbai.',
      scenarioDetails: 'Multivariate divergence across amount, device, location, and recipient reputation. Blocked before settlement!'
    }
  ]

  const [selectedPreset, setSelectedPreset] = useState<SimulatorPreset>(presets[9])
  const [computedRisk, setComputedRisk] = useState<UpiGuardRiskOutput>(() =>
    calculateUpiGuardMasterRisk({
      amount: presets[9].amount,
      senderUpiId: 'anjan@upiguard',
      receiverUpiId: presets[9].receiverUpi,
      receiverName: presets[9].receiverName,
      isNewDevice: presets[9].isNewDevice,
      locationCity: presets[9].locationCity,
      normalCity: presets[9].normalCity,
      deviceTrust: presets[9].deviceTrust,
      velocityCount: presets[9].velocityCount
    })
  )

  const handleSelectPreset = (p: SimulatorPreset) => {
    setSelectedPreset(p)
    const result = calculateUpiGuardMasterRisk({
      amount: p.amount,
      senderUpiId: 'anjan@upiguard',
      receiverUpiId: p.receiverUpi,
      receiverName: p.receiverName,
      isNewDevice: p.isNewDevice,
      locationCity: p.locationCity,
      normalCity: p.normalCity,
      deviceTrust: p.deviceTrust,
      velocityCount: p.velocityCount
    })
    setComputedRisk(result)
  }

  const handleLaunchScenarioInUserApp = () => {
    triggerScenario(selectedPreset.key)
    router.push(
      `/pay?receiver_upi=${encodeURIComponent(selectedPreset.receiverUpi)}&receiver_name=${encodeURIComponent(
        selectedPreset.receiverName
      )}&amount=${selectedPreset.amount}&source=QR`
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                UPIGUARD AI VIVA TESTING SUITE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Flame className="size-8 text-[#FF647B]" />
              Interactive Fraud Simulator
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Inject synthetic fraud signals, simulate multivariate attack vectors, and preview explainable AI risk scoring in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetDemoEnvironment}
              className="px-4 py-2 rounded-xl bg-[#091726] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
            >
              <RotateCcw className="size-3.5" /> Reset Demo State
            </button>
            <button
              onClick={handleLaunchScenarioInUserApp}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] text-[#06101D] text-xs font-extrabold shadow-lg shadow-[#438EFF]/30 hover:brightness-110 transition flex items-center gap-2"
            >
              <Play className="size-4 fill-current" /> Execute in User Terminal
            </button>
          </div>
        </div>

        {/* Viva Quick Launch Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => handleSelectPreset(presets[0])}
            className="cursor-pointer p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Viva Demo 1</span>
              <h4 className="text-sm font-bold text-white">Safe Payment (₹250)</h4>
              <p className="text-[11px] text-slate-400">Low Risk · Face/PIN + OTP ➔ Approved</p>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-400">8/100</span>
          </div>

          <div
            onClick={() => handleSelectPreset(presets[2])}
            className="cursor-pointer p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Viva Demo 3</span>
              <h4 className="text-sm font-bold text-white">Medium Risk (₹12,000)</h4>
              <p className="text-[11px] text-slate-400">Adaptive Auth ➔ Recalculated ➔ Approved</p>
            </div>
            <span className="text-xl font-bold font-mono text-amber-400">52/100</span>
          </div>

          <div
            onClick={() => handleSelectPreset(presets[9])}
            className="cursor-pointer p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/15 transition flex items-center justify-between shadow-lg shadow-rose-500/10"
          >
            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Viva Demo 2</span>
              <h4 className="text-sm font-bold text-white">Account Takeover (₹75,000)</h4>
              <p className="text-[11px] text-slate-400">Critical Risk ➔ Blocked Before Settlement</p>
            </div>
            <span className="text-xl font-bold font-mono text-rose-400">95/100</span>
          </div>
        </div>

        {/* 2-Column Layout: Left = 10 Presets List, Right = Live Telemetry & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Preset Cards */}
          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Simulation Scenario Preset ({presets.length})
            </h3>
            {presets.map((p) => {
              const isSelected = selectedPreset.key === p.key
              return (
                <div
                  key={p.key}
                  onClick={() => handleSelectPreset(p)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#0B1B2D] border-[#5BD6FF] shadow-lg shadow-[#5BD6FF]/10'
                      : 'bg-[#091726] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2.5 rounded-full ${
                          p.category === 'BENIGN'
                            ? 'bg-emerald-400'
                            : p.category === 'MEDIUM'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-white">{p.name}</h4>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        p.expectedRisk <= 39
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : p.expectedRisk <= 69
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      Risk: {p.expectedRisk} ({p.expectedDecision})
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2">{p.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-400 font-mono">
                    <span>Amount: ₹{p.amount.toLocaleString('en-IN')}</span>
                    <span>•</span>
                    <span>City: {p.locationCity}</span>
                    <span>•</span>
                    <span>Device: {p.isNewDevice ? 'Unknown Endpoint' : 'Known Laptop'}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Live Risk Engine Telemetry & Explainability */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#5BD6FF]">
                    SIMULATOR TELEMETRY INSPECTOR
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">
                    {selectedPreset.name}
                  </h3>
                </div>

                <div className="text-right">
                  <div
                    className={`text-3xl font-black font-mono ${
                      computedRisk.finalRisk >= 90
                        ? 'text-rose-400'
                        : computedRisk.finalRisk >= 70
                        ? 'text-rose-400'
                        : computedRisk.finalRisk >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {computedRisk.finalRisk} / 100
                  </div>
                  <span
                    className={`text-xs font-bold uppercase font-mono ${
                      computedRisk.finalRisk >= 90
                        ? 'text-rose-400'
                        : computedRisk.finalRisk >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {computedRisk.riskLevel} RISK · {computedRisk.decision}
                  </span>
                </div>
              </div>

              {/* Scenario Context Parameters */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#06101D] p-4 rounded-2xl border border-white/5">
                <div>
                  <span className="text-slate-500">Transaction Sum:</span>
                  <div className="text-white font-bold">₹{selectedPreset.amount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-500">Receiver VPA:</span>
                  <div className="text-[#5BD6FF] truncate">{selectedPreset.receiverUpi}</div>
                </div>
                <div>
                  <span className="text-slate-500">Device Keystore:</span>
                  <div className={selectedPreset.isNewDevice ? 'text-rose-400' : 'text-emerald-400'}>
                    {selectedPreset.isNewDevice ? 'New Endpoint (Trust 18)' : 'Known Endpoint (Trust 94)'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Geographic Cluster:</span>
                  <div className={selectedPreset.locationCity !== 'Hubballi' ? 'text-rose-400' : 'text-emerald-400'}>
                    {selectedPreset.locationCity} (Home: {selectedPreset.normalCity})
                  </div>
                </div>
              </div>

              {/* Weighted 7-Component Normalized Breakdown (Section 20) */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Weighted Component Breakdown (Section 20 Formula)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">Amount (20%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.amount} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">Behavior (20%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.behavior} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">Device (20%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.device} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">Location (15%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.location} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">Receiver (10%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.receiver} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">Velocity (10%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.velocity} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-white/5">
                    <span className="text-[10px] text-slate-500">ML Model (5%)</span>
                    <div className="text-base font-bold text-white">{computedRisk.components.ml} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#06101D] border border-emerald-500/20">
                    <span className="text-[10px] text-slate-500">ML Confidence</span>
                    <div className="text-base font-bold text-emerald-400">
                      {(computedRisk.fraudProbability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* SHAP-Style Horizontal Waterfall Bars (Section 46) */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5BD6FF]">
                  Explainable AI Waterfall (SHAP Feature Importance)
                </span>
                <div className="space-y-2 text-xs font-mono">
                  {computedRisk.shapContributions.map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>{c.name}</span>
                        <span className={c.impact > 10 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          +{c.impact} pts ({c.description})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            c.impact > 15 ? 'bg-rose-500' : c.impact > 8 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, c.impact * 4.5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch in User Payment Terminal Button */}
              <button
                onClick={handleLaunchScenarioInUserApp}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] hover:brightness-110 text-[#06101D] font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#438EFF]/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Play className="size-5 fill-current" />
                EXECUTE {selectedPreset.name.toUpperCase()} IN USER APP
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
