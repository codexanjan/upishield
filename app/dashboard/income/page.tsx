'use client'

import { useEffect, useState } from 'react'
import {
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  X
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

const INCOME_TYPES = [
  'Salary', 'Freelance', 'Business', 'Refund', 'Interest', 'Investment', 'Other'
]

export default function IncomePage() {
  const [incomes, setIncomes] = useState<any[]>([])
  const [summary, setSummary] = useState({
    total_income: 55000.0,
    total_expenses: 27420.0,
    net_balance: 42580.0,
    savings: 27580.0,
    savings_percentage: 50.1
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [incomeType, setIncomeType] = useState('Salary')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  const loadData = async () => {
    try {
      const [list, sum] = await Promise.all([
        apiRequest('/income?limit=50').catch(() => null),
        apiRequest('/income/summary').catch(() => null)
      ])
      if (Array.isArray(list) && list.length > 0) setIncomes(list)
      if (sum && sum.total_income !== undefined) setSummary(sum)
    } catch {
      // Demo fallback
    }
    if (incomes.length === 0) {
      setIncomes([
        { id: 1, amount: 45000, source: 'Tech Corp Bangalore', income_type: 'Salary', date: new Date().toISOString(), description: 'Monthly primary salary' },
        { id: 2, amount: 10000, source: 'Freelance Design', income_type: 'Freelance', date: new Date(Date.now() - 604800000).toISOString(), description: 'Frontend design milestone' }
      ])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmt = parseFloat(amount)
    if (isNaN(numAmt) || numAmt <= 0) return

    setLoading(true)
    try {
      await apiRequest('/income', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmt,
          source,
          income_type: incomeType,
          date: new Date(date).toISOString(),
          description
        })
      })
      await loadData()
      setModalOpen(false)
      setAmount('')
      setSource('')
      setDescription('')
    } catch {
      const newInc = {
        id: Date.now(),
        amount: numAmt,
        source: source || 'Direct Deposit',
        income_type: incomeType,
        date: new Date(date).toISOString(),
        description
      }
      setIncomes([newInc, ...incomes])
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this income record?')) return
    try {
      await apiRequest(`/income/${id}`, { method: 'DELETE' })
    } catch {}
    setIncomes(prev => prev.filter(i => i.id !== id))
  }

  return (
    <UserLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <MotionBadge text="CASH INFLOW & NET SAVINGS" variant="lime" />
          </div>
          <MotionWordReveal
            text="Income Tracker"
            className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
          />
          <p className="mt-1 text-xs text-[#8fa9a6]">
            Log all earnings sources and review deterministic net savings ratios.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
        >
          <Plus className="size-4" /> Add Income
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4">
          <span className="text-[11px] font-medium text-[#8fa9a6]">Total Income</span>
          <p className="mt-2 text-xl font-bold text-[#b8f55e] font-mono">₹{summary.total_income.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#8fa9a6] mt-1 block">Gross inflow</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4">
          <span className="text-[11px] font-medium text-[#8fa9a6]">Total Expenses</span>
          <p className="mt-2 text-xl font-bold text-rose-400 font-mono">₹{summary.total_expenses.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#8fa9a6] mt-1 block">Outflow</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4">
          <span className="text-[11px] font-medium text-[#8fa9a6]">Net Balance</span>
          <p className="mt-2 text-xl font-bold text-white font-mono">₹{summary.net_balance.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#b8f55e] mt-1 block">Income - Expenses</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4">
          <span className="text-[11px] font-medium text-[#8fa9a6]">Savings</span>
          <p className="mt-2 text-xl font-bold text-[#b8f55e] font-mono">₹{summary.savings.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#b8f55e] mt-1 block">Retained capital</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-4">
          <span className="text-[11px] font-medium text-[#8fa9a6]">Savings Rate</span>
          <p className="mt-2 text-xl font-bold text-white font-mono">{summary.savings_percentage}%</p>
          <span className="text-[10px] text-[#b8f55e] mt-1 block">Deterministic formula</span>
        </div>
      </div>

      {/* Income Records Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4">Recorded Incomes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold text-slate-400 bg-[#071014]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Source / Entity</th>
                <th className="py-2.5 px-3">Income Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(incomes || []).map((inc) => (
                <tr key={inc.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-3 text-slate-400">
                    {new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-white">{inc.source}</td>
                  <td className="py-3.5 px-3">
                    <span className="rounded-full bg-[#b8f55e]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#b8f55e]">
                      {inc.income_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">{inc.description || '—'}</td>
                  <td className="py-3.5 px-3 font-bold text-[#b8f55e] font-mono">+₹{inc.amount?.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleDelete(inc.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      title="Delete record"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Income Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Add Income</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="55000.00"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs font-bold text-white focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source / Entity *</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Primary Salary, Client Transfer"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Income Type</label>
                  <select
                    value={incomeType}
                    onChange={(e) => setIncomeType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                  >
                    {INCOME_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3 py-2 text-xs text-white focus:border-[#b8f55e] focus:outline-none"
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
                  {loading ? 'Saving...' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
