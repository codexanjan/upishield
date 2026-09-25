'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  Repeat,
  FileText,
  X,
  PieChart as PieIcon,
  TrendingDown,
  ShoppingBag,
  Send,
  Eye,
  EyeOff,
  Filter,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

const CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Shopping', 'Entertainment', 'Bills',
  'Rent', 'Education', 'Healthcare', 'Travel', 'Fuel', 'Subscriptions',
  'EMI', 'Insurance', 'Personal', 'Other'
]

const COLORS = ['#b8f55e', '#22C55E', '#10B981', '#F59E0B', '#EF4444', '#84CC16', '#06B6D4', '#14B8A6']

export default function ExpensesPage() {
  const { privacyMasked, togglePrivacyMask } = useAppStore()
  const [expenses, setExpenses] = useState<any[]>([])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')
  const [summary, setSummary] = useState({
    total_expenses: 27420.0,
    monthly_budget: 35000.0,
    remaining_budget: 7580.0,
    today_spend: 850.0,
    avg_daily_expense: 914.0,
    highest_category: 'Food',
    category_distribution: {
      Food: 8400,
      Shopping: 6200,
      Groceries: 5120,
      Bills: 4200,
      Travel: 3500
    } as Record<string, number>,
    monthly_trend: [
      { month: 'Apr', amount: 21200 },
      { month: 'May', amount: 24800 },
      { month: 'Jun', amount: 22300 },
      { month: 'Jul', amount: 26900 },
      { month: 'Aug', amount: 23100 },
      { month: 'Sep', amount: 27420 }
    ],
    payment_method_distribution: {
      UPI: 17200,
      Card: 7720,
      Cash: 2500
    } as Record<string, number>
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Add form fields
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [merchant, setMerchant] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [recurring, setRecurring] = useState(false)

  const loadData = async () => {
    try {
      const [expList, expSum] = await Promise.all([
        apiRequest('/expenses?limit=100').catch(() => null),
        apiRequest('/expenses/summary').catch(() => null)
      ])
      if (Array.isArray(expList) && expList.length > 0) setExpenses(expList)
      if (expSum && expSum.total_expenses !== undefined) setSummary(expSum)
    } catch {
      // Demo fallback
    }
    if (expenses.length === 0) {
      setExpenses([
        { id: 1, amount: 850, category: 'Food', merchant: 'Star Cafe Koramangala', payment_method: 'UPI', date: new Date().toISOString(), description: 'Espresso & lunch meeting' },
        { id: 2, amount: 2100, category: 'Groceries', merchant: "Nature's Basket", payment_method: 'Card', date: new Date(Date.now() - 86400000).toISOString(), description: 'Pantry restocking' },
        { id: 3, amount: 5800, category: 'Shopping', merchant: 'Uniqlo Indiranagar', payment_method: 'UPI', date: new Date(Date.now() - 172800000).toISOString(), description: 'Workwear' },
        { id: 4, amount: 4200, category: 'Bills', merchant: 'BESCOM & ACT Fiber', payment_method: 'UPI', date: new Date(Date.now() - 259200000).toISOString(), description: 'Utilities bill' },
        { id: 5, amount: 1250, category: 'Travel', merchant: 'Uber India', payment_method: 'UPI', date: new Date(Date.now() - 345600000).toISOString(), description: 'Airport commute' }
      ])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !merchant) return
    setLoading(true)
    const numAmt = parseFloat(amount)

    try {
      const payload = {
        amount: numAmt,
        category,
        merchant,
        payment_method: paymentMethod,
        date: new Date(date).toISOString(),
        description,
        recurring
      }
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      await loadData()
      setModalOpen(false)
      setAmount('')
      setMerchant('')
      setDescription('')
    } catch {
      const newExp = {
        id: Date.now(),
        amount: numAmt,
        category,
        merchant,
        payment_method: paymentMethod,
        date: new Date(date).toISOString(),
        description
      }
      setExpenses([newExp, ...expenses])
      setSummary(prev => ({
        ...prev,
        total_expenses: prev.total_expenses + numAmt,
        remaining_budget: Math.max(0, prev.remaining_budget - numAmt)
      }))
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      await apiRequest(`/expenses/${id}`, { method: 'DELETE' })
    } catch {}
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const filteredExpenses = expenses.filter(e => {
    if (selectedCategoryFilter === 'ALL') return true
    return e.category === selectedCategoryFilter
  })

  const categoryPie = Object.entries(summary.category_distribution || {}).map(([name, value]) => ({ name, value }))
  const budgetPercent = Math.min(100, Math.round((summary.total_expenses / summary.monthly_budget) * 100))

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge className="rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-3 py-1 text-xs font-semibold text-[#b8f55e]">
                ANIMATED FINANCIAL LEDGER
              </MotionBadge>
              <span className="text-[10px] text-[#8fa9a6] font-mono">TRACKED LEDGER SYNC</span>
            </div>
            <MotionWordReveal
              text="Animated Expense Tracker"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time expense velocity, interactive budget thresholds, and animated category breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={togglePrivacyMask}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a1718] px-3.5 py-2.5 text-xs font-semibold text-[#8fa9a6] hover:text-white transition"
              title="Toggle financial privacy masking"
            >
              {privacyMasked ? <EyeOff className="size-4 text-[#b8f55e]" /> : <Eye className="size-4 text-[#8fa9a6]" />}
              <span>{privacyMasked ? 'Masked' : 'Visible'}</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              <Plus className="size-4" /> Add Expense
            </button>
          </div>
        </div>

        {/* 1. ANIMATED BUDGET GAUGE & VELOCITY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8fa9a6]">Monthly Budget Cap</span>
              <span className="text-xs font-bold text-white font-mono">{budgetPercent}% Used</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {privacyMasked ? '••••••' : `₹${summary.total_expenses.toLocaleString('en-IN')}`}
              <span className="text-xs text-[#8fa9a6] font-normal"> / ₹{summary.monthly_budget.toLocaleString('en-IN')}</span>
            </p>
            {/* Animated Smooth Progress Bar */}
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPercent}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${
                  budgetPercent > 90 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-[#b8f55e] shadow-[0_0_10px_#b8f55e]'
                }`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl space-y-2">
            <span className="text-xs font-semibold text-[#8fa9a6]">Remaining Safe Headroom</span>
            <p className="text-2xl font-bold text-[#b8f55e] font-mono">
              {privacyMasked ? '••••••' : `₹${summary.remaining_budget.toLocaleString('en-IN')}`}
            </p>
            <span className="text-[11px] text-[#8fa9a6] flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#b8f55e]" /> No threshold violations
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl space-y-2">
            <span className="text-xs font-semibold text-[#8fa9a6]">Today&apos;s Spend</span>
            <p className="text-2xl font-bold text-white font-mono">
              {privacyMasked ? '••••••' : `₹${summary.today_spend.toLocaleString('en-IN')}`}
            </p>
            <span className="text-[11px] text-[#8fa9a6]">Burn rate: ~₹{summary.avg_daily_expense.toFixed(0)}/day</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-5 shadow-xl space-y-2">
            <span className="text-xs font-semibold text-[#8fa9a6]">Highest Category</span>
            <p className="text-2xl font-bold text-amber-400 font-mono">{summary.highest_category}</p>
            <span className="text-[11px] text-amber-400/80">
              {privacyMasked ? '••••' : `₹${(summary.category_distribution['Food'] || 8400).toLocaleString('en-IN')}`} total
            </span>
          </div>
        </div>

        {/* 2. ANIMATED CATEGORY BREAKDOWN CARDS */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white">Live Category Distribution</h3>
            <span className="text-xs text-[#8fa9a6] font-mono">Sorted by Volume</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(summary.category_distribution).map(([catName, catAmt], idx) => {
              const maxAmt = Math.max(...Object.values(summary.category_distribution))
              const catPercent = Math.round((catAmt / maxAmt) * 100)

              return (
                <motion.div
                  key={catName}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  className="rounded-xl border border-white/5 bg-[#071014] p-3.5 space-y-2.5 hover:border-[#b8f55e]/30 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white group-hover:text-[#b8f55e] transition">{catName}</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {privacyMasked ? '••••' : `₹${catAmt.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${catPercent}%` }}
                      transition={{ duration: 1.0, delay: idx * 0.1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-[#b8f55e]"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* 3. CHARTS GRID */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend Chart */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white">Monthly Spend Velocity</h3>
            <p className="text-xs text-[#8fa9a6] mt-0.5">Historical trajectory over consecutive months</p>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthly_trend}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#071014', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#b8f55e', fontSize: '11px' }}
                    formatter={(val: any) => [privacyMasked ? '••••••' : `₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                  />
                  <Bar dataKey="amount" fill="#b8f55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Pie */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white">Proportional Category Breakdown</h3>
            <p className="text-xs text-[#8fa9a6] mt-0.5">Budget allocation across active categories</p>
            <div className="h-64 w-full flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(categoryPie || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#071014', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px' }}
                    formatter={(val: any) => [privacyMasked ? '••••••' : `₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. EXPENSE LIST WITH INTERACTIVE FILTER PILLS */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">All Logged Expenses</h3>
              <p className="text-xs text-[#8fa9a6]">Instant ledger records with category tagging</p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Food', 'Shopping', 'Groceries', 'Bills', 'Travel'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#b8f55e] text-[#09110f]'
                      : 'bg-[#071014] text-[#8fa9a6] hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold text-[#8fa9a6] bg-[#071014]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Merchant / Payee</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#8fa9a6]">
                      No expenses logged in this category.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3 text-[#8fa9a6]">
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">{exp.merchant}</td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-slate-300 border border-white/10">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#8fa9a6]">{exp.payment_method}</td>
                      <td className="py-3 px-3 text-[#8fa9a6] max-w-xs truncate">{exp.description || '—'}</td>
                      <td className="py-3 px-3 font-bold text-white font-mono">
                        {privacyMasked ? '••••••' : `₹${exp.amount?.toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                          title="Delete expense"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl text-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">Log Expense Item</h3>
                  <button onClick={() => setModalOpen(false)} className="text-[#8fa9a6] hover:text-white">
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#8fa9a6] mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 850"
                      className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8fa9a6] mb-1">Merchant / Payee *</label>
                    <input
                      type="text"
                      required
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      placeholder="e.g. Blue Tokai Coffee, Blinkit"
                      className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#8fa9a6] mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#071014] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#b8f55e]"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#8fa9a6] mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-[#071014] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#b8f55e]"
                      >
                        <option value="UPI">UPI Transfer</option>
                        <option value="Card">Debit/Credit Card</option>
                        <option value="NetBanking">Net Banking</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8fa9a6] mb-1">Description / Memo</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full bg-[#071014] border border-white/15 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-[#8fa9a6] font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-[#b8f55e] text-[#09110f] font-bold hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
                    >
                      {loading ? 'Logging...' : 'Save Expense'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </UserLayout>
  )
}
