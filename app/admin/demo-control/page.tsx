'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  ShieldCheck,
  RefreshCw,
  Users,
  Store,
  DollarSign
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export default function DemoControlPage() {
  const {
    accounts,
    transactions,
    alerts,
    resetDemoEnvironment,
    initiatePayment,
    updateTransactionRisk,
    settlePayment,
    blockPayment
  } = useUPIGuardStore()

  const [notification, setNotification] = useState<string | null>(null)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  const handleReset = () => {
    resetDemoEnvironment()
    setShowConfirmReset(false)
    showToast('✓ Demo environment restored to initial seed state!')
  }

  const handleCreateNormalTxn = () => {
    const txn = initiatePayment({
      senderUpiId: 'anjan@upiguard',
      receiverUpiId: 'coffee@upiguard',
      receiverName: 'UPIGuard Coffee',
      amount: 250,
      note: 'Coffee & Croissant',
      source: 'QR'
    })
    updateTransactionRisk(txn.transactionId, {
      score: 8,
      level: 'LOW',
      decision: 'ALLOW',
      factors: [
        { name: 'Known Device', score: 2, description: 'Matched Anjan-Laptop keystore', importance: 'LOW' },
        { name: 'Known Location', score: 1, description: 'Hubballi home radius verified', importance: 'LOW' }
      ],
      mlProbability: 0.02
    })
    settlePayment(txn.transactionId)
    showToast('✓ Safe payment of ₹250 generated and settled!')
  }

  const handleCreateFraudTxn = () => {
    const txn = initiatePayment({
      senderUpiId: 'anjan@upiguard',
      receiverUpiId: 'scammer.refund@okaxis',
      receiverName: 'Overseas Tech Support',
      amount: 75000,
      note: 'Urgent Wire Transfer',
      source: 'INTENT'
    })
    updateTransactionRisk(txn.transactionId, {
      score: 95,
      level: 'CRITICAL',
      decision: 'BLOCK',
      factors: [
        { name: 'Amount Anomaly', score: 22, description: '₹75,000 exceeds 15x normal baseline', importance: 'CRITICAL' },
        { name: 'New Device', score: 20, description: 'Endpoint trust score 18/100', importance: 'CRITICAL' },
        { name: 'Location Anomaly', score: 15, description: 'Mumbai origin (~1,300 km from Hubballi)', importance: 'HIGH' },
        { name: 'New Receiver', score: 12, description: 'Flagged VPA blacklist hit', importance: 'CRITICAL' }
      ],
      mlProbability: 0.917
    })
    blockPayment(txn.transactionId, 'CRITICAL_RISK_POLICY_PREVENTION')
    showToast('⚠ Critical fraud transaction of ₹75,000 simulated & blocked!')
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-semibold text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="size-4 text-emerald-400" />
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Database className="size-8 text-[#5BD6FF]" />
            Demo Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage closed-loop demo environment, trigger instant scenarios, and reset all balances and ledgers.
          </p>
        </div>

        {/* Current State Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#091726] border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Anjan Balance</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              ₹{accounts['anjan@upiguard']?.balance?.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#091726] border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">ABC Electronics</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              ₹{accounts['abc@upiguard']?.balance?.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#091726] border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Transactions</span>
            <div className="text-xl font-bold font-mono text-[#5BD6FF] mt-1">{transactions.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#091726] border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Alerts</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">{alerts.length}</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Scenario Triggers */}
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Play className="size-4 text-[#5BD6FF]" /> One-Click Scenario Injections
            </h3>
            <p className="text-xs text-slate-400">
              Instantly create simulated transactions in the background to demonstrate real-time updates.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleCreateNormalTxn}
                className="w-full py-3 px-4 rounded-2xl bg-[#06101D] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                    CREATE NORMAL TRANSACTION (₹250)
                  </div>
                  <div className="text-[11px] text-slate-400">Low risk · Coffee spend · Instantly settled</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">Risk 8</span>
              </button>

              <button
                onClick={handleCreateFraudTxn}
                className="w-full py-3 px-4 rounded-2xl bg-[#06101D] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-rose-300">
                    CREATE CRITICAL FRAUD TRANSACTION (₹75,000)
                  </div>
                  <div className="text-[11px] text-slate-400">Account takeover · Mumbai anomaly · Blocked</div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">Risk 95</span>
              </button>
            </div>
          </div>

          {/* Environment Reset */}
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="size-4 text-amber-400" /> Environment Restoration
            </h3>
            <p className="text-xs text-slate-400">
              Restore initial seed state for Anjan (₹100,000), ABC Electronics (₹50,000), and reset all telemetry.
            </p>

            <div className="pt-4">
              {!showConfirmReset ? (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition"
                >
                  RESET DEMO ENVIRONMENT...
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 space-y-3">
                  <p className="text-xs font-bold text-rose-200">
                    Confirm complete demo reset? All transactions and balance adjustments will be restored to seed.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-medium text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
                    >
                      Yes, Reset All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
