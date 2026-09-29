'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Car,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  MapPin,
  Smartphone,
  CheckCircle2,
  DollarSign,
  Activity,
  Layers
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export default function AdminLargeTransactionsPage() {
  const { majorPurchases, transactions } = useUPIGuardStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Combine real store purchases with standard high-value feed
  const allLargeTransactions = useMemo(() => {
    const list: any[] = []

    // Map store's major purchases
    majorPurchases.forEach((mp) => {
      list.push({
        id: mp.transactionId,
        user: 'Anjan Shetty',
        userUpi: mp.userId,
        merchant: mp.merchantId,
        category: mp.category,
        description: mp.description,
        amount: mp.amount,
        risk: mp.riskScore,
        riskLevel: mp.riskLevel,
        device: 'Known (Anjan-Laptop)',
        location: 'Hubballi (Home)',
        auth: mp.authMethod ? mp.authMethod.replace('_', ' ') + ' + OTP' : 'Face + OTP',
        status: mp.status === 'SUCCESSFUL' ? 'APPROVED' : 'BLOCKED',
        timestamp: mp.createdAt
      })
    })

    // Seed additional items for the monitor if needed
    if (list.length < 5) {
      list.push(
        {
          id: 'TXN-884123',
          user: 'Priya Sharma',
          userUpi: 'priya@upiguard',
          merchant: 'Royal Jewelers Indiranagar',
          category: 'Jewelry',
          description: 'Gold Bridal Set',
          amount: 350000,
          risk: 28,
          riskLevel: 'LOW',
          device: 'Known (iPhone 15)',
          location: 'Bengaluru',
          auth: 'Face + OTP',
          status: 'APPROVED',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'TXN-741299',
          user: 'Vikram Mehta',
          userUpi: 'vikram@upiguard',
          merchant: 'Sobha Developers Escrow',
          category: 'Property',
          description: 'Apartment Booking Advance',
          amount: 500000,
          risk: 38,
          riskLevel: 'MEDIUM',
          device: 'Known (MacBook Pro)',
          location: 'Pune',
          auth: 'PIN + OTP',
          status: 'APPROVED',
          timestamp: new Date(Date.now() - 3600000 * 9).toISOString()
        },
        {
          id: 'TXN-652190',
          user: 'Unknown User',
          userUpi: 'scammer.refund@okaxis',
          merchant: 'Dubai Bullion Vault',
          category: 'Luxury',
          description: 'Suspicious Gold Bullion',
          amount: 650000,
          risk: 96,
          riskLevel: 'CRITICAL',
          device: 'New Device (Trust: 14)',
          location: 'Mumbai (Proxy)',
          auth: 'FAILED',
          status: 'BLOCKED',
          timestamp: new Date(Date.now() - 3600000 * 14).toISOString()
        }
      )
    }

    return list
  }, [majorPurchases])

  const filtered = useMemo(() => {
    return allLargeTransactions.filter((txn) => {
      const matchSearch =
        txn.id.toLowerCase().includes(search.toLowerCase()) ||
        txn.merchant.toLowerCase().includes(search.toLowerCase()) ||
        txn.user.toLowerCase().includes(search.toLowerCase())
      const matchCat = categoryFilter === 'ALL' || txn.category.toLowerCase() === categoryFilter.toLowerCase()
      const matchStatus = statusFilter === 'ALL' || txn.status.toUpperCase() === statusFilter.toUpperCase()
      return matchSearch && matchCat && matchStatus
    })
  }, [allLargeTransactions, search, categoryFilter, statusFilter])

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                REAL-TIME FRAUD OPERATIONS
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Socket.IO Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              LARGE VALUE TRANSACTION MONITOR
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Surveillance on transactions &gt; ₹50,000 · Distinguishing legitimate high-value from fraud anomalies
            </p>
          </div>
        </div>

        {/* 5 KPI Stat Cards (Section 20) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Today&apos;s Large Transactions
            </span>
            <div className="text-2xl font-black text-white mt-1 font-mono">₹18.4L</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Across verified merchants</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Large Transactions
            </span>
            <div className="text-2xl font-black text-[#5BD6FF] mt-1 font-mono">24</div>
            <p className="text-[10px] text-slate-500 mt-0.5">+4 in last 60 minutes</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Blocked Large Transactions
            </span>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">3</div>
            <p className="text-[10px] text-rose-400/80 mt-0.5">Prevented ₹15.8L loss</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Largest Transaction
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">₹8.5L</div>
            <p className="text-[10px] text-amber-300 mt-0.5">Hyundai Creta / ABC Motors</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#091726]/80 p-4 backdrop-blur-xl col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Avg Large Transaction
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">₹3.4L</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Normal baseline range</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-3xl border border-white/5 bg-[#091726]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TXN, merchant, or user..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#06101D] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-[#06101D] border border-white/10 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Property">Property</option>
              <option value="Electronics">Electronics</option>
              <option value="Luxury">Luxury</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-[#06101D] border border-white/10 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">APPROVED</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
        </div>

        {/* Large Transaction Table (Section 21) */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#06101D] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4">Transaction</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Merchant</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Risk</th>
                  <th className="py-3.5 px-4">Device</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Authentication</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filtered.map((row) => {
                  const isBlocked = row.status === 'BLOCKED'
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-4 font-bold text-white">{row.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-sans font-semibold text-white">{row.user}</div>
                        <div className="text-[10px] text-slate-500">{row.userUpi}</div>
                      </td>
                      <td className="py-4 px-4 font-sans font-medium text-slate-200">{row.merchant}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-white text-sm">
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.risk <= 45
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {row.risk}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[11px] text-slate-400">{row.device}</td>
                      <td className="py-4 px-4 text-[11px] text-slate-400">{row.location}</td>
                      <td className="py-4 px-4 text-[11px] text-slate-300">{row.auth}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            !isBlocked
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
