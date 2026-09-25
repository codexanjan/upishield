'use client'

import { useEffect, useState } from 'react'
import {
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  X
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

export default function BudgetsPage() {
  const [budgetStatus, setBudgetStatus] = useState<any>({
    total_budget: 35000.0,
    total_spent: 27420.0,
    overall_percentage: 78.3,
    budgets: [
      { id: 1, category: 'Food', limit_amount: 9000.0, spent_amount: 8400.0, percentage: 93.3, status_color: 'orange' },
      { id: 2, category: 'Groceries', limit_amount: 6000.0, spent_amount: 5120.0, percentage: 85.3, status_color: 'amber' },
      { id: 3, category: 'Shopping', limit_amount: 8000.0, spent_amount: 6200.0, percentage: 77.5, status_color: 'amber' },
      { id: 4, category: 'Bills', limit_amount: 5000.0, spent_amount: 4200.0, percentage: 84.0, status_color: 'amber' },
      { id: 5, category: 'Travel', limit_amount: 4000.0, spent_amount: 3500.0, percentage: 87.5, status_color: 'orange' },
      { id: 6, category: 'Entertainment', limit_amount: 3000.0, spent_amount: 3450.0, percentage: 115.0, status_color: 'red' }
    ]
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [category, setCategory] = useState('Food')
  const [limitAmount, setLimitAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      const data = await apiRequest('/budgets/status').catch(() => null)
      if (data && Array.isArray(data.budgets) && data.budgets.length > 0) {
        setBudgetStatus(data)
      }
    } catch {}
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    const numLimit = parseFloat(limitAmount)
    if (isNaN(numLimit) || numLimit <= 0) return

    setLoading(true)
    const now = new Date()
    try {
      await apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category,
          limit_amount: numLimit,
          month: now.getMonth() + 1,
          year: now.getFullYear()
        })
      })
      await loadData()
      setModalOpen(false)
      setLimitAmount('')
    } catch {
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Remove this category budget?')) return
    try {
      await apiRequest(`/budgets/${id}`, { method: 'DELETE' })
      loadData()
    } catch {
      setBudgetStatus((prev: any) => ({
        ...prev,
        budgets: (prev.budgets || []).filter((b: any) => b.id !== id)
      }))
    }
  }

  return (
    <UserLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <MotionBadge text="DETERMINISTIC SPEND GUARDS" variant="lime" />
          </div>
          <MotionWordReveal
            text="Monthly Budgets"
            className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
          />
          <p className="mt-1 text-xs text-[#8fa9a6]">
            Set deterministic spending caps with 4-band automated color thresholds.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
        >
          <Plus className="size-4" /> Set Category Budget
        </button>
      </div>

      {/* Threshold Key */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-[#0a1718] p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-semibold text-white">Color Threshold Key:</span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="size-2.5 rounded-full bg-[#b8f55e]" /> 0–60% Normal
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-400">
            <span className="size-2.5 rounded-full bg-[#F59E0B]" /> 61–85% Moderate
          </span>
          <span className="inline-flex items-center gap-1.5 text-orange-400">
            <span className="size-2.5 rounded-full bg-orange-500" /> 86–100% Near Limit
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-400">
            <span className="size-2.5 rounded-full bg-[#EF4444]" /> &gt;100% Exceeded
          </span>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(budgetStatus.budgets || []).map((b: any) => {
          let barBg = 'bg-[#b8f55e]'
          let badgeText = 'Normal'
          let badgeBg = 'bg-[#b8f55e]/15 text-[#b8f55e] border-[#b8f55e]/30'

          if (b.status_color === 'amber') {
            barBg = 'bg-[#F59E0B]'
            badgeText = 'Moderate (61-85%)'
            badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          } else if (b.status_color === 'orange') {
            barBg = 'bg-orange-500'
            badgeText = 'Near Cap (86-100%)'
            badgeBg = 'bg-orange-500/10 text-orange-400 border-orange-500/30'
          } else if (b.status_color === 'red') {
            barBg = 'bg-[#EF4444]'
            badgeText = 'Budget Exceeded (>100%)'
            badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }

          return (
            <div key={b.category} className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl relative group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">{b.category}</h3>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeBg}`}>
                  {badgeText}
                </span>
              </div>

              <div className="my-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-white font-mono">
                    ₹{b.spent_amount.toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs text-[#8fa9a6]">
                    of ₹{b.limit_amount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[11px] text-[#8fa9a6]">
                  <span>{b.percentage}% consumed</span>
                  <span>₹{Math.max(0, b.limit_amount - b.spent_amount).toLocaleString('en-IN')} left</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  title="Remove budget"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Set Budget Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Set Category Budget</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSetBudget} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Food, Groceries, Shopping"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Limit (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="6000.00"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs font-bold text-white focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[#b8f55e] px-5 py-2.5 text-xs font-bold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
                >
                  {loading ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
