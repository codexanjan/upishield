'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Cpu, ShieldAlert, BarChart3, Info, ArrowUpRight } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MODEL_PERFORMANCE_METRICS } from '@/lib/ai-fraud-engine'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function AdminExplainabilityPage() {
  const [selectedModel, setSelectedModel] = useState<'ensemble' | 'rf' | 'xgb' | 'isolation_forest'>('ensemble')

  const globalShapImportance = [
    { feature: 'Transaction Amount (Z-Score)', importance: 0.32, impact: 'High Ticket Spikes', fill: '#5BD6FF' },
    { feature: 'Hardware Attestation / New Device', importance: 0.24, impact: 'Unregistered Endpoints', fill: '#438EFF' },
    { feature: 'Geographic City Geofence', importance: 0.18, impact: 'Distance Departure', fill: '#7759E8' },
    { feature: 'Beneficiary Complaint Velocity', importance: 0.14, impact: 'Reported VPA Counts', fill: '#FFC85B' },
    { feature: 'Diurnal Active Hour Baseline', importance: 0.08, impact: 'Late Night Spikes', fill: '#39DDA0' },
    { feature: '60-Sec Velocity Burst Rate', importance: 0.04, impact: 'Rapid Collect Attacks', fill: '#FF647B' },
  ]

  const caseComparison = [
    { name: 'Amount Anomaly', safeTxn: 8, fraudTxn: 95 },
    { name: 'Device Fingerprint', safeTxn: 5, fraudTxn: 92 },
    { name: 'Location Distance', safeTxn: 4, fraudTxn: 88 },
    { name: 'Receiver Reputation', safeTxn: 6, fraudTxn: 94 },
    { name: 'Velocity Count', safeTxn: 5, fraudTxn: 70 },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
            SHAP (SHapley Additive exPlanations)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-center gap-3">
            <Sparkles className="size-8 text-[#5BD6FF]" />
            Explainable AI (XAI) & Attribution
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interpreting machine learning decision boundaries, global feature importance weights, and per-transaction Shapley value attributions.
          </p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-3xl bg-[#091726] border border-[#0B1B2D] shadow-xl">
            <span className="text-xs uppercase font-semibold text-slate-400">Primary Risk Driver</span>
            <div className="text-xl font-bold text-white mt-1">Transaction Amount Anomaly</div>
            <p className="text-xs text-[#5BD6FF] mt-1">32.0% global model weight contribution</p>
          </div>
          <div className="p-5 rounded-3xl bg-[#091726] border border-[#0B1B2D] shadow-xl">
            <span className="text-xs uppercase font-semibold text-slate-400">Model Interpretability</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">TreeSHAP Deterministic</div>
            <p className="text-xs text-slate-400 mt-1">Exact additivity with zero heuristic bias</p>
          </div>
          <div className="p-5 rounded-3xl bg-[#091726] border border-[#0B1B2D] shadow-xl">
            <span className="text-xs uppercase font-semibold text-slate-400">Explainability Latency</span>
            <div className="text-xl font-bold text-purple-300 font-mono mt-1">&lt; 14 ms</div>
            <p className="text-xs text-slate-400 mt-1">Real-time waterfall computed in-stream</p>
          </div>
        </div>

        {/* Global Feature Importance Chart */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Global Feature Importance (SHAP Summary)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalShapImportance} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0B1B2D" />
                <XAxis type="number" stroke="#8fa9a6" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis dataKey="feature" type="category" stroke="#8fa9a6" fontSize={11} width={180} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091726', borderColor: '#5BD6FF', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attribution Weight']}
                />
                <Bar dataKey="importance" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safe vs Fraud Transaction Feature Vector Comparison */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Safe Payment (₹250) vs Fraud Attempt (₹75,000) Feature Vector Comparison
            </h3>
            <span className="text-xs font-mono text-slate-400">Viva Demonstration Test Vectors</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Safe Txn */}
            <div className="p-5 rounded-2xl bg-[#06101D] border border-emerald-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">Safe Payment · ₹250</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  Risk 8 / 100 (LOW)
                </span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-slate-300">
                <li className="flex justify-between"><span>Amount Z-Score:</span> <strong className="text-emerald-400">0.08 (Normal)</strong></li>
                <li className="flex justify-between"><span>Device Keystore:</span> <strong className="text-emerald-400">Known (96/100)</strong></li>
                <li className="flex justify-between"><span>Location Radius:</span> <strong className="text-emerald-400">Hubballi Home</strong></li>
                <li className="flex justify-between"><span>Beneficiary Disputes:</span> <strong className="text-emerald-400">0 Complaints</strong></li>
                <li className="flex justify-between"><span>ML Fraud Confidence:</span> <strong className="text-emerald-400">1.8%</strong></li>
              </ul>
            </div>

            {/* Fraud Txn */}
            <div className="p-5 rounded-2xl bg-[#06101D] border border-rose-500/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-400 uppercase font-mono">Fraud Attack · ₹75,000</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">
                  Risk 95 / 100 (CRITICAL)
                </span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-slate-300">
                <li className="flex justify-between"><span>Amount Z-Score:</span> <strong className="text-rose-400">+4.12 (Extreme Anomaly)</strong></li>
                <li className="flex justify-between"><span>Device Keystore:</span> <strong className="text-rose-400">New / Unverified (18/100)</strong></li>
                <li className="flex justify-between"><span>Location Radius:</span> <strong className="text-rose-400">Mumbai (~1,300 km Anomaly)</strong></li>
                <li className="flex justify-between"><span>Beneficiary Disputes:</span> <strong className="text-rose-400">Blacklist Hit (12+ Reports)</strong></li>
                <li className="flex justify-between"><span>ML Fraud Confidence:</span> <strong className="text-rose-400">91.7% (FRAUD)</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
