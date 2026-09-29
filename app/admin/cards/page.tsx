'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Search,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Zap,
  TrendingUp,
  MapPin,
  Smartphone,
  Eye,
  X,
  Filter,
  Sliders,
  Compass,
  ArrowRight,
  Clock,
  Radio,
  Download
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { useUPIGuardStore, VirtualCard, CardTransaction } from '@/lib/upiguard-store'

export default function AdminCardsManagementPage() {
  const {
    virtualCards,
    cardTransactions,
    freezeCard,
    unfreezeCard,
    freezeAllCards,
    resetCardDemo
  } = useUPIGuardStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null)

  // Metrics
  const metrics = useMemo(() => {
    const total = virtualCards.length
    const active = virtualCards.filter((c) => c.status === 'ACTIVE').length
    const frozen = virtualCards.filter((c) => c.status === 'FROZEN').length
    const revoked = virtualCards.filter((c) => c.status === 'DELETED' || c.status === 'REVOKED').length
    const highRisk = virtualCards.filter((c) => c.riskScore >= 70).length
    const largeTxns = cardTransactions.filter((t) => t.amount >= 50000).length
    const blockedTxns = cardTransactions.filter((t) => t.status === 'BLOCKED').length
    const totalSimulatedSpend = cardTransactions
      .filter((t) => t.status === 'SETTLED' || t.status === 'AUTHORIZED')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      total,
      active,
      frozen,
      revoked,
      highRisk,
      largeTxns,
      blockedTxns,
      totalSimulatedSpend
    }
  }, [virtualCards, cardTransactions])

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return virtualCards.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch =
        c.nickname.toLowerCase().includes(q) ||
        c.cardId.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q) ||
        c.displayNumber.toLowerCase().includes(q) ||
        c.maskedNumber.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'HIGH_RISK'
          ? c.riskScore >= 70
          : c.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [virtualCards, search, statusFilter])

  // Transactions related to selected card
  const selectedCardTxns = useMemo(() => {
    if (!selectedCard) return []
    return cardTransactions.filter((t) => t.cardId === selectedCard.cardId)
  }, [selectedCard, cardTransactions])

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ADMIN COMMAND CENTER
              </span>
              <span className="text-xs text-slate-400 font-mono">VIRTUAL CREDIT SUPERVISION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Virtual Cards & Issuer Security
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Closed-loop virtual credit card fleet oversight, high-value spend monitoring, and autonomous policy enforcement.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              href="/admin/cards/simulator"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Zap className="size-4" /> VIVA CARD SIMULATOR
            </Link>
            <button
              onClick={freezeAllCards}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <ShieldAlert className="size-4" /> Freeze All Fleet
            </button>
            <button
              onClick={resetCardDemo}
              title="Reset Card Demo State"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* 7 KPI Dashboard Metrics (Section 62) */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cards</span>
            <div className="text-2xl font-black text-white mt-1 font-mono">{metrics.total}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Fleet profiles</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Cards</span>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{metrics.active}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Authorizing</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frozen Cards</span>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{metrics.frozen}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Blocked state</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">High-Risk Cards</span>
            <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{metrics.highRisk}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Score 70+</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Large Spends</span>
            <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">{metrics.largeTxns}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">&gt;= ₹50,000</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blocked Swipes</span>
            <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{metrics.blockedTxns}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">SOC Intercepts</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-3.5 backdrop-blur-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Simulated Volume</span>
            <div className="text-xl font-black text-indigo-400 mt-1 font-mono">
              ₹{(metrics.totalSimulatedSpend / 100000).toFixed(1)}L
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Closed-loop settled</p>
          </div>
        </div>

        {/* Real-Time Live Card Transaction Monitoring Feed (Section 65) */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 p-4 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-white uppercase tracking-wider">
                LIVE CARD TRANSACTION TELEMETRY
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">SOCKET.IO SYNC ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {cardTransactions.slice(0, 3).map((tx) => (
              <div
                key={tx.transactionId}
                className="p-3 rounded-xl bg-[#091726] border border-white/10 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white block">{tx.merchantName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tx.location.city} • {tx.paymentChannel}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-cyan-400 block">₹{tx.amount.toLocaleString('en-IN')}</span>
                  <span className={`text-[9px] font-bold uppercase ${
                    tx.status === 'SETTLED' || tx.status === 'AUTHORIZED' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.status} ({tx.riskScore}/100)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by card nickname, ID, user, or token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'ACTIVE', 'FROZEN', 'HIGH_RISK', 'LOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Admin Card Table (Section 63) */}
        <div className="rounded-2xl border border-white/5 bg-[#091726]/80 p-5 backdrop-blur-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase font-mono">
                <th className="pb-3">Card Profile</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Masked Number</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Credit Limit</th>
                <th className="pb-3">Utilization</th>
                <th className="pb-3">Risk</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Home City</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCards.map((c) => {
                const util = c.creditLimit > 0 ? (c.usedCredit / c.creditLimit) * 100 : 0
                return (
                  <tr key={c.cardId} className="hover:bg-white/5 transition">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <CreditCard className="size-4 text-cyan-400" />
                      <div>
                        <span>{c.nickname}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{c.cardId}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 font-mono text-[11px]">{c.userId}</td>
                    <td className="py-3 font-mono text-cyan-300">{c.maskedNumber}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 border border-white/5">
                        {c.cardType.replace('VIRTUAL_', '')}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-white">₹{c.creditLimit.toLocaleString('en-IN')}</td>
                    <td className="py-3 font-mono text-slate-300">
                      ₹{c.usedCredit.toLocaleString('en-IN')} ({util.toFixed(0)}%)
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.riskScore >= 70
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : c.riskScore >= 40
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {c.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-bold uppercase text-[10px] ${
                        c.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{c.homeLocation}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCard(c)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 font-bold text-[10px] uppercase flex items-center gap-1"
                        >
                          <Eye className="size-3" /> Inspect
                        </button>
                        {c.status === 'FROZEN' ? (
                          <button
                            onClick={() => unfreezeCard(c.cardId)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase"
                          >
                            Unfreeze
                          </button>
                        ) : (
                          <button
                            onClick={() => freezeCard(c.cardId)}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold uppercase"
                          >
                            Freeze
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Card Detail Inspector Modal (Section 64) */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl rounded-3xl border border-cyan-500/30 bg-[#091726] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedCard.nickname}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedCard.cardId} • User: {selectedCard.userId}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">CREDIT LIMIT</span>
                  <span className="font-mono font-bold text-white">₹{selectedCard.creditLimit.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">USED CREDIT</span>
                  <span className="font-mono font-bold text-amber-400">₹{selectedCard.usedCredit.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">SECURITY SCORE</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedCard.securityScore}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">STATUS</span>
                  <span className={`font-bold uppercase ${selectedCard.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedCard.status}
                  </span>
                </div>
              </div>

              {/* Transactions for this card */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">Recent Card Authorizations ({selectedCardTxns.length})</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedCardTxns.map((t) => (
                    <div key={t.transactionId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 text-xs">
                      <div>
                        <span className="font-bold text-white">{t.merchantName}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {t.location.city} • {t.paymentChannel} • {new Date(t.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-cyan-400">₹{t.amount.toLocaleString('en-IN')}</span>
                        <span className={`text-[10px] block uppercase font-bold ${
                          t.status === 'SETTLED' || t.status === 'AUTHORIZED' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                {selectedCard.status === 'FROZEN' ? (
                  <button
                    onClick={() => {
                      unfreezeCard(selectedCard.cardId)
                      setSelectedCard({ ...selectedCard, status: 'ACTIVE' })
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06101D] text-xs font-extrabold uppercase"
                  >
                    Unfreeze Card
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      freezeCard(selectedCard.cardId)
                      setSelectedCard({ ...selectedCard, status: 'FROZEN' })
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold uppercase"
                  >
                    Freeze Card
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
