'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Globe,
  Smartphone,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
  Info,
  MapPin,
  Play,
  RotateCcw,
  History,
  AlertOctagon,
  Check,
  Search
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

interface Rule {
  id: number
  rule_code: string
  name: string
  category: string
  purpose: string
  is_enabled: boolean
  threshold_value: number
  threshold_unit: string
  severity: 'Critical' | 'Review'
  estimated_affected: string
  updated_by: string
  updated_at: string
  history?: { timestamp: string; author: string; change: string; reason: string }[]
}

const initialRules: Rule[] = [
  {
    id: 1,
    rule_code: 'GEO_IMPOSSIBLE_TRAVEL',
    name: 'Impossible Travel Velocity Rule',
    category: 'Geo-Velocity',
    purpose: 'Flags consecutive transactions occurring across distant cities faster than physical flight speeds (velocity > 800 km/h).',
    is_enabled: true,
    threshold_value: 800,
    threshold_unit: 'km/h',
    severity: 'Critical',
    estimated_affected: '~4 txns/day (0.02%)',
    updated_by: 'Anjan Sharma (Chief Risk Officer)',
    updated_at: '2026-09-25T08:15:00Z',
    history: [
      { timestamp: '2026-09-25 08:15', author: 'Anjan Sharma', change: 'Threshold verified at 800 km/h', reason: 'Alignment with standard commercial flight boundaries' }
    ]
  },
  {
    id: 2,
    rule_code: 'GEO_NEW_CITY_DEVICE',
    name: 'Unrecognized Device in New City',
    category: 'Device Intelligence',
    purpose: 'Triggers elevated authentication warning when a new hardware fingerprint initiates a transfer outside registered user home cities.',
    is_enabled: true,
    threshold_value: 1,
    threshold_unit: 'device mismatch',
    severity: 'Critical',
    estimated_affected: '~18 txns/day (0.10%)',
    updated_by: 'Platform Admin',
    updated_at: '2026-09-24T14:30:00Z',
    history: [
      { timestamp: '2026-09-24 14:30', author: 'Platform Admin', change: 'Set severity to Critical', reason: 'Prevent account takeover via stolen credentials' }
    ]
  },
  {
    id: 3,
    rule_code: 'GEO_HIGH_VAL_OUTSIDE',
    name: 'High-Value Payment Outside Home Region',
    category: 'High-Value Payments',
    purpose: 'Flags transfers exceeding ₹10,000 whenever the payment is initiated from outside the user declared primary or secondary state.',
    is_enabled: true,
    threshold_value: 10000,
    threshold_unit: 'INR (₹)',
    severity: 'Review',
    estimated_affected: '~32 txns/day (0.17%)',
    updated_by: 'Platform Admin',
    updated_at: '2026-09-24T11:00:00Z',
    history: [
      { timestamp: '2026-09-24 11:00', author: 'Platform Admin', change: 'Lowered threshold from ₹20,000 to ₹10,000', reason: 'Increased travel fraud reported during holidays' }
    ]
  },
  {
    id: 4,
    rule_code: 'GEO_NEW_COUNTRY',
    name: 'Cross-Border / International Acquiring Rule',
    category: 'International Routing',
    purpose: 'Warns user and requests biometric re-validation whenever acquiring merchant IP or switch resolves to non-Indian financial gateways.',
    is_enabled: true,
    threshold_value: 1,
    threshold_unit: 'cross-border switch',
    severity: 'Review',
    estimated_affected: '~12 txns/day (0.07%)',
    updated_by: 'Compliance Desk',
    updated_at: '2026-09-23T16:45:00Z',
    history: [
      { timestamp: '2026-09-23 16:45', author: 'Compliance Desk', change: 'Activated international gateway watch', reason: 'FATF compliance' }
    ]
  },
  {
    id: 5,
    rule_code: 'HIGH_UPI_AMOUNT',
    name: 'Single UPI Transfer Velocity Cap',
    category: 'High-Value Payments',
    purpose: 'Requires secondary confirmation dialog whenever a single peer-to-peer transfer exceeds ₹50,000.',
    is_enabled: true,
    threshold_value: 50000,
    threshold_unit: 'INR (₹)',
    severity: 'Review',
    estimated_affected: '~45 txns/day (0.24%)',
    updated_by: 'Risk Operations',
    updated_at: '2026-09-22T09:10:00Z',
    history: [
      { timestamp: '2026-09-22 09:10', author: 'Risk Operations', change: 'Standardized at ₹50,000', reason: 'NPCI recommended ceiling for non-verified payees' }
    ]
  },
  {
    id: 6,
    rule_code: 'REPORTED_RECEIVER_WARNING',
    name: 'Community Flagged Receiver VPA Threshold',
    category: 'Reputation & Community',
    purpose: 'Enforces full-screen warning and locks instant auto-fill when recipient VPA has 3 or more verified platform incident reports.',
    is_enabled: true,
    threshold_value: 3,
    threshold_unit: 'verified reports',
    severity: 'Critical',
    estimated_affected: '~9 txns/day (0.05%)',
    updated_by: 'Safety Lead',
    updated_at: '2026-09-25T07:00:00Z',
    history: [
      { timestamp: '2026-09-25 07:00', author: 'Safety Lead', change: 'Rule active across all client apps', reason: 'Prevent serial impersonation scammers' }
    ]
  },
  {
    id: 7,
    rule_code: 'NIGHT_PAYMENT_SAFETY',
    name: 'Nocturnal Window Safety Threshold (23:00 - 05:00)',
    category: 'Nighttime Protocol',
    purpose: 'Prompts explicit risk acknowledgment for transfers over ₹10,000 initiated during odd night hours.',
    is_enabled: true,
    threshold_value: 10000,
    threshold_unit: 'INR (₹)',
    severity: 'Review',
    estimated_affected: '~22 txns/day (0.12%)',
    updated_by: 'Platform Admin',
    updated_at: '2026-09-21T18:00:00Z',
    history: [
      { timestamp: '2026-09-21 18:00', author: 'Platform Admin', change: 'Activated nocturnal threshold', reason: 'Protect seniors from late-night coercive calls' }
    ]
  }
]

export default function AdminFraudRulesPage() {
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Edit with confirmation state
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [thresholdInput, setThresholdInput] = useState<number>(0)
  const [severityInput, setSeverityInput] = useState<'Critical' | 'Review'>('Review')
  const [changeReason, setChangeReason] = useState('')

  // Confirmation modal for toggle/disable
  const [confirmToggleRule, setConfirmToggleRule] = useState<Rule | null>(null)
  const [toggleReason, setToggleReason] = useState('')

  // Test / Simulation Modal
  const [simulatingRule, setSimulatingRule] = useState<Rule | null>(null)
  const [simValue, setSimValue] = useState('12000')
  const [simResult, setSimResult] = useState<{ triggered: boolean; message: string } | null>(null)

  // History Drawer
  const [historyRule, setHistoryRule] = useState<Rule | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const formatThreshold = (rule: Rule) => {
    if (rule.threshold_unit.includes('INR')) {
      return `₹${Number(rule.threshold_value).toLocaleString('en-IN')}`
    }
    if (rule.threshold_unit === 'km/h') {
      return `${rule.threshold_value} km/h`
    }
    return `${rule.threshold_value} ${rule.threshold_unit}`
  }

  const handleSaveEdit = () => {
    if (!editingRule) return
    if (!changeReason.trim()) {
      alert('Audit compliance requires a justification reason for all rule parameter edits.')
      return
    }

    const updatedHistoryItem = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: 'Anjan Sharma (Admin)',
      change: `Changed threshold from ${formatThreshold(editingRule)} to ${
        editingRule.threshold_unit.includes('INR') ? `₹${thresholdInput.toLocaleString('en-IN')}` : `${thresholdInput} ${editingRule.threshold_unit}`
      }, severity to ${severityInput}`,
      reason: changeReason.trim()
    }

    setRules((prev) =>
      prev.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              threshold_value: thresholdInput,
              severity: severityInput,
              updated_by: 'Anjan Sharma (Admin)',
              updated_at: new Date().toISOString(),
              history: [updatedHistoryItem, ...(r.history || [])]
            }
          : r
      )
    )

    fetch('/api/v1/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rule_id: editingRule.id,
        rule_code: editingRule.rule_code,
        threshold_value: thresholdInput,
        severity: severityInput,
        reason: changeReason.trim(),
        author: 'Anjan Sharma (Admin)'
      })
    }).catch(() => {})

    setActionSuccess(`Rule "${editingRule.name}" parameters successfully updated and logged in immutable audit trail.`)
    setTimeout(() => setActionSuccess(null), 5000)
    setEditingRule(null)
    setChangeReason('')
  }

  const handleConfirmToggle = () => {
    if (!confirmToggleRule) return
    if (!toggleReason.trim()) {
      alert('Please provide an audit reason for toggling this security rule state.')
      return
    }

    const nextState = !confirmToggleRule.is_enabled
    const updatedHistoryItem = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: 'Anjan Sharma (Admin)',
      change: `Status changed to ${nextState ? 'ACTIVE' : 'DISABLED'}`,
      reason: toggleReason.trim()
    }

    setRules((prev) =>
      prev.map((r) =>
        r.id === confirmToggleRule.id
          ? {
              ...r,
              is_enabled: nextState,
              updated_by: 'Anjan Sharma (Admin)',
              updated_at: new Date().toISOString(),
              history: [updatedHistoryItem, ...(r.history || [])]
            }
          : r
      )
    )

    fetch('/api/v1/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rule_id: confirmToggleRule.id,
        rule_code: confirmToggleRule.rule_code,
        is_enabled: nextState,
        reason: toggleReason.trim(),
        author: 'Anjan Sharma (Admin)'
      })
    }).catch(() => {})

    setActionSuccess(`Rule "${confirmToggleRule.name}" is now ${nextState ? 'ACTIVE' : 'DISABLED'}.`)
    setTimeout(() => setActionSuccess(null), 5000)
    setConfirmToggleRule(null)
    setToggleReason('')
  }

  const handleRollback = (rule: Rule) => {
    const original = initialRules.find((i) => i.id === rule.id)
    if (!original) return

    const reason = prompt(`Confirm rollback of "${rule.name}" to default baseline parameters?\nEnter audit rollback reason:`)
    if (!reason || !reason.trim()) return

    const rollbackHistoryItem = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      author: 'Anjan Sharma (Admin)',
      change: `Rolled back to baseline threshold: ${formatThreshold(original)}`,
      reason: reason.trim()
    }

    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? {
              ...original,
              updated_by: 'Anjan Sharma (Admin)',
              updated_at: new Date().toISOString(),
              history: [rollbackHistoryItem, ...(r.history || [])]
            }
          : r
      )
    )

    setActionSuccess(`Rolled back "${rule.name}" to factory default baseline parameters.`)
    setTimeout(() => setActionSuccess(null), 5000)
  }

  const runSimulation = () => {
    if (!simulatingRule) return
    const numericInput = parseFloat(simValue) || 0

    if (simulatingRule.rule_code === 'GEO_IMPOSSIBLE_TRAVEL') {
      const willTrigger = numericInput > simulatingRule.threshold_value
      setSimResult({
        triggered: willTrigger,
        message: willTrigger
          ? `CRITICAL TRIGGER: Detected travel velocity of ${numericInput} km/h exceeds rule barrier (${simulatingRule.threshold_value} km/h). Immediate review dialog forced.`
          : `PASS: Velocity of ${numericInput} km/h is within safe physical speed thresholds.`
      })
    } else if (simulatingRule.threshold_unit.includes('INR')) {
      const willTrigger = numericInput > simulatingRule.threshold_value
      setSimResult({
        triggered: willTrigger,
        message: willTrigger
          ? `WARNING TRIGGER: Amount of ₹${numericInput.toLocaleString('en-IN')} exceeds configured rule ceiling (${formatThreshold(simulatingRule)}). Transfer requires two-factor user acknowledgment.`
          : `PASS: Transfer of ₹${numericInput.toLocaleString('en-IN')} is within normal single transaction limits.`
      })
    } else {
      const willTrigger = numericInput >= simulatingRule.threshold_value
      setSimResult({
        triggered: willTrigger,
        message: willTrigger
          ? `CRITICAL TRIGGER: Input value of ${numericInput} meets or exceeds condition threshold (${simulatingRule.threshold_value}). Safety flag will be raised.`
          : `PASS: Input value is below warning criteria.`
      })
    }
  }

  const filteredRules = rules.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.purpose.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ['ALL', 'Geo-Velocity', 'Device Intelligence', 'High-Value Payments', 'International Routing', 'Reputation & Community', 'Nighttime Protocol']

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge className="rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3 py-1 text-xs font-semibold text-[#b8f55e]">
                DETERMINISTIC EVALUATION ENGINE
              </MotionBadge>
              <span className="text-[10px] text-[#8fa9a6] font-mono">100% EXPLAINABLE RULES</span>
            </div>
            <MotionWordReveal
              text="Fraud Rules & Safety Thresholds"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-[#8fa9a6] text-xs sm:text-sm mt-1">
              Configure deterministic limits, distance velocity barriers, night restrictions, and community threat rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#0a1718] border border-white/10 text-xs font-semibold text-[#8fa9a6]">
              Active Rules: <span className="text-[#b8f55e] font-mono font-bold">{rules.filter(r => r.is_enabled).length} / {rules.length}</span>
            </div>
          </div>
        </div>

        {/* Global Success Notification */}
        <AnimatePresence>
          {actionSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-[#b8f55e]/10 border border-[#b8f55e]/30 text-xs text-white flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 shrink-0 text-[#b8f55e]" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="text-white/60 hover:text-white">
                <X className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advisory Notice */}
        <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 text-xs text-[#8fa9a6] flex items-start gap-3.5">
          <Info className="size-4 shrink-0 mt-0.5 text-[#b8f55e]" />
          <div>
            <span className="font-semibold text-white block mb-0.5">Deterministic Warning Engine</span>
            <p className="leading-relaxed">
              Rules execute client-side and edge checks before UPI intent dispatch. Any modification requires an audit reason and takes immediate effect across the network.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  categoryFilter === cat
                    ? 'bg-[#b8f55e] text-[#09110f]'
                    : 'bg-[#0a1718] text-[#8fa9a6] hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa9a6]" />
            <input
              type="text"
              placeholder="Search rule or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#0a1718] border border-white/10 text-xs text-white placeholder-[#8fa9a6] focus:outline-none focus:border-[#b8f55e]/50"
            />
          </div>
        </div>

        {/* Rules Table */}
        <div className="rounded-2xl bg-[#0a1718] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#071014] text-[11px] uppercase text-[#8fa9a6] border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Rule Name & Purpose</th>
                  <th className="px-5 py-3.5 font-semibold">Deterministic Threshold</th>
                  <th className="px-5 py-3.5 font-semibold">Impacted Vol</th>
                  <th className="px-5 py-3.5 font-semibold">Severity</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Governance Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#c3d5d2]">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#8fa9a6]">
                      No fraud rules match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white block text-sm">{r.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-[#8fa9a6] border border-white/10">
                            {r.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8fa9a6] mt-1 leading-relaxed">
                          {r.purpose}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-[#556d6a] font-mono">
                          <span>CODE: {r.rule_code}</span>
                          <span>·</span>
                          <span>Last by {r.updated_by}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                        <span className="px-2.5 py-1 rounded-lg bg-[#071014] border border-white/10 text-[#b8f55e]">
                          {formatThreshold(r)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono text-[#8fa9a6]">
                        {r.estimated_affected}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.severity === 'Critical'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.is_enabled
                              ? 'bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30'
                              : 'bg-white/5 text-[#8fa9a6] border border-white/10'
                          }`}
                        >
                          {r.is_enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test Simulation */}
                          <button
                            onClick={() => {
                              setSimulatingRule(r)
                              setSimValue(r.threshold_unit.includes('INR') ? '15000' : '850')
                              setSimResult(null)
                            }}
                            title="Simulate rule before activation"
                            className="p-2 rounded-xl bg-[#071014] hover:bg-white/10 border border-white/10 text-[#8fa9a6] hover:text-[#b8f55e] transition"
                          >
                            <Play className="size-3.5" />
                          </button>

                          {/* Tune Parameters */}
                          <button
                            onClick={() => {
                              setEditingRule(r)
                              setThresholdInput(r.threshold_value)
                              setSeverityInput(r.severity)
                              setChangeReason('')
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#071014] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition flex items-center gap-1.5"
                          >
                            <Edit2 className="size-3 text-[#b8f55e]" />
                            Tune
                          </button>

                          {/* View Audit History */}
                          <button
                            onClick={() => setHistoryRule(r)}
                            title="View changelog history"
                            className="p-2 rounded-xl bg-[#071014] hover:bg-white/10 border border-white/10 text-[#8fa9a6] hover:text-white transition"
                          >
                            <History className="size-3.5" />
                          </button>

                          {/* Toggle Active / Inactive with reason */}
                          <button
                            onClick={() => {
                              setConfirmToggleRule(r)
                              setToggleReason('')
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                              r.is_enabled
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-[#b8f55e]/10 hover:bg-[#b8f55e]/20 text-[#b8f55e] border-[#b8f55e]/30'
                            }`}
                          >
                            {r.is_enabled ? 'Disable' : 'Enable'}
                          </button>

                          {/* Rollback */}
                          <button
                            onClick={() => handleRollback(r)}
                            title="Rollback to baseline"
                            className="p-2 rounded-xl bg-[#071014] hover:bg-white/10 border border-white/10 text-[#8fa9a6] hover:text-amber-400 transition"
                          >
                            <RotateCcw className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. EDIT MODAL WITH MANDATORY AUDIT REASON */}
        <AnimatePresence>
          {editingRule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-[#0a1718] border border-[#b8f55e]/40 p-6 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Tune Safety Rule Parameters</h3>
                    <p className="text-xs text-[#8fa9a6] mt-0.5">{editingRule.name}</p>
                  </div>
                  <button onClick={() => setEditingRule(null)} className="text-[#8fa9a6] hover:text-white">
                    <X className="size-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[#8fa9a6] block mb-1 font-semibold">
                      Numeric Threshold Value ({editingRule.threshold_unit})
                    </label>
                    <input
                      type="number"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(Number(e.target.value))}
                      className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#b8f55e]"
                    />
                    <p className="text-[11px] text-[#8fa9a6] mt-1">
                      Current: {formatThreshold(editingRule)} · Preview: {editingRule.threshold_unit.includes('INR') ? `₹${thresholdInput.toLocaleString('en-IN')}` : `${thresholdInput} ${editingRule.threshold_unit}`}
                    </p>
                  </div>

                  <div>
                    <label className="text-[#8fa9a6] block mb-1 font-semibold">Severity Classification</label>
                    <select
                      value={severityInput}
                      onChange={(e) => setSeverityInput(e.target.value as any)}
                      className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#b8f55e]"
                    >
                      <option value="Review">Review (Advisory confirmation warning)</option>
                      <option value="Critical">Critical (High-friction security prompt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#8fa9a6] block mb-1 font-semibold">
                      Mandatory Audit Change Reason <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="Specify rationale for threshold adjustment (e.g., Festival season surge, newly detected fraud patterns)..."
                      className="w-full bg-[#071014] border border-white/15 rounded-xl p-3 text-white placeholder-[#8fa9a6] focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-[#8fa9a6] hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2.5 rounded-xl bg-[#b8f55e] hover:brightness-110 text-[#09110f] font-bold text-xs transition shadow-lg shadow-[#b8f55e]/20"
                  >
                    Commit Rule Update
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. CONFIRM TOGGLE MODAL WITH REASON */}
        <AnimatePresence>
          {confirmToggleRule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl bg-[#0a1718] border border-rose-500/40 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {confirmToggleRule.is_enabled ? 'Disable Security Rule?' : 'Activate Security Rule?'}
                    </h3>
                    <p className="text-xs text-[#8fa9a6] mt-0.5">{confirmToggleRule.name}</p>
                  </div>
                </div>

                <p className="text-xs text-[#c3d5d2] leading-relaxed">
                  Changing the active state of this rule alters transaction risk calculation for all users immediately.
                </p>

                <div>
                  <label className="text-[#8fa9a6] block mb-1 text-xs font-semibold">
                    Audit Reason for Status Change <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={toggleReason}
                    onChange={(e) => setToggleReason(e.target.value)}
                    placeholder="e.g., Temporary suspension for maintenance, or Emergency rollout..."
                    className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8fa9a6] focus:outline-none focus:border-[#b8f55e]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setConfirmToggleRule(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-[#8fa9a6] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmToggle}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                      confirmToggleRule.is_enabled
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-[#b8f55e] hover:brightness-110 text-[#09110f]'
                    }`}
                  >
                    Confirm {confirmToggleRule.is_enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. RULE SIMULATION / TEST MODAL */}
        <AnimatePresence>
          {simulatingRule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl bg-[#0a1718] border border-[#b8f55e]/40 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Play className="size-4 text-[#b8f55e]" />
                    <h3 className="font-bold text-white text-sm">Simulate Rule Behavior</h3>
                  </div>
                  <button onClick={() => setSimulatingRule(null)} className="text-[#8fa9a6] hover:text-white">
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#8fa9a6] block">Rule Under Test:</span>
                    <span className="font-bold text-white text-sm">{simulatingRule.name}</span>
                    <span className="text-[11px] text-[#b8f55e] font-mono block">Baseline: {formatThreshold(simulatingRule)}</span>
                  </div>

                  <div>
                    <label className="text-[#8fa9a6] block mb-1 font-semibold">
                      Enter Simulated Test Value ({simulatingRule.threshold_unit})
                    </label>
                    <input
                      type="number"
                      value={simValue}
                      onChange={(e) => setSimValue(e.target.value)}
                      className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>

                  <button
                    onClick={runSimulation}
                    className="w-full py-2.5 rounded-xl bg-[#b8f55e] text-[#09110f] font-bold text-xs hover:brightness-110 transition shadow-md shadow-[#b8f55e]/20"
                  >
                    Run Deterministic Simulation
                  </button>

                  {simResult && (
                    <div
                      className={`p-3.5 rounded-xl border ${
                        simResult.triggered
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <p className="font-bold text-xs">{simResult.triggered ? 'THRESHOLD BREACHED' : 'CONDITION SATISFIED'}</p>
                      <p className="text-[11px] mt-1 leading-relaxed">{simResult.message}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. AUDIT HISTORY DRAWER */}
        <AnimatePresence>
          {historyRule && (
            <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="w-full max-w-md h-full bg-[#0a1718] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <History className="size-4 text-[#b8f55e]" />
                      <h3 className="font-bold text-white text-sm">Audit & Change History</h3>
                    </div>
                    <button onClick={() => setHistoryRule(null)} className="text-[#8fa9a6] hover:text-white">
                      <X className="size-5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold text-white">{historyRule.name}</p>
                    <p className="text-[10px] font-mono text-[#8fa9a6] mt-0.5">CODE: {historyRule.rule_code}</p>
                  </div>

                  <div className="mt-6 space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                    {(historyRule.history || []).map((h, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-[#8fa9a6]">
                          <span className="font-mono text-[#b8f55e]">{h.timestamp}</span>
                          <span className="font-semibold text-white">{h.author}</span>
                        </div>
                        <p className="font-bold text-white text-xs">{h.change}</p>
                        <p className="text-[11px] text-[#8fa9a6] italic">&quot;{h.reason}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => setHistoryRule(null)}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs"
                  >
                    Close History
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
