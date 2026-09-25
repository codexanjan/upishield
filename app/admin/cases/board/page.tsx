'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  KanbanSquare,
  Plus,
  Briefcase,
  Clock,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  MoveRight,
  Eye,
  Filter
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

interface KanbanCard {
  id: string
  title: string
  user: string
  amount: number
  city: string
  status: 'New' | 'Under Review' | 'Evidence Required' | 'Escalated' | 'Resolved'
  priority: 'Critical' | 'High' | 'Medium'
  date: string
}

const initialCards: KanbanCard[] = [
  { id: 'CASE-001', title: 'UPI Phishing Impersonation', user: 'Anjan Sharma', amount: 12500, city: 'Bengaluru', status: 'New', priority: 'High', date: '25 Sep' },
  { id: 'CASE-002', title: 'Fake Delivery QR Collect', user: 'Pooja Iyer', amount: 4500, city: 'Mysuru', status: 'New', priority: 'Medium', date: '25 Sep' },
  { id: 'CASE-003', title: 'Remote Access Tech Scam', user: 'Karan Mehra', amount: 28500, city: 'Delhi', status: 'Under Review', priority: 'Critical', date: '24 Sep' },
  { id: 'CASE-004', title: 'Unverified Merchant Hold', user: 'Rahul Nair', amount: 18000, city: 'Mumbai', status: 'Evidence Required', priority: 'High', date: '24 Sep' },
  { id: 'CASE-005', title: 'Cross-Border Unauthorized Card', user: 'Deepa Varma', amount: 32000, city: 'Singapore', status: 'Escalated', priority: 'Critical', date: '23 Sep' },
  { id: 'CASE-006', title: 'Refund Bot Reversal Scam', user: 'Suresh Patel', amount: 8900, city: 'Delhi', status: 'Resolved', priority: 'Medium', date: '22 Sep' },
]

const COLUMNS: ('New' | 'Under Review' | 'Evidence Required' | 'Escalated' | 'Resolved')[] = [
  'New',
  'Under Review',
  'Evidence Required',
  'Escalated',
  'Resolved'
]

export default function AdminInvestigationBoardPage() {
  const [cards, setCards] = useState<KanbanCard[]>(initialCards)

  const moveCard = (cardId: string, direction: 'next' | 'prev') => {
    setCards(cards.map((c) => {
      if (c.id !== cardId) return c
      const currentIndex = COLUMNS.indexOf(c.status)
      const nextIndex = direction === 'next' ? Math.min(COLUMNS.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1)
      return { ...c, status: COLUMNS[nextIndex] }
    }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="INCIDENT WORKFLOW ENGINE · SPEC 15" variant="blue" />
            </div>
            <MotionWordReveal
              text="Investigation Kanban Board"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Visual case pipeline tracking fraud investigations from initial registration through evidence audits to resolution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/cases"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              List View
            </Link>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.status === col)
            return (
              <div
                key={col}
                className="rounded-2xl border border-white/10 bg-[#0a1718] p-4 flex flex-col min-w-[240px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {col}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                    {colCards.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1">
                  {colCards.map((card) => {
                    const isCritical = card.priority === 'Critical'
                    return (
                      <div
                        key={card.id}
                        className={`rounded-xl border p-3.5 space-y-2.5 transition ${
                          isCritical
                            ? 'bg-[#071014] border-rose-500/40 shadow-md shadow-rose-950/20'
                            : 'bg-[#071014] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-mono text-[#b8f55e] font-bold">{card.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            card.priority === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : card.priority === 'High'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-white/10 text-slate-300'
                          }`}>
                            {card.priority}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{card.title}</h4>
                          <p className="text-[11px] text-[#8fa9a6] mt-0.5">{card.user}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                          <span className="font-mono text-white font-semibold">₹{card.amount.toLocaleString()}</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="size-2.5 text-[#b8f55e]" /> {card.city}
                          </span>
                        </div>

                        {/* Move Actions */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <button
                            onClick={() => moveCard(card.id, 'prev')}
                            disabled={COLUMNS.indexOf(card.status) === 0}
                            className="text-[10px] text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            ← Back
                          </button>

                          <Link
                            href={`/admin/cases`}
                            className="text-[10px] text-[#b8f55e] hover:underline"
                          >
                            Open
                          </Link>

                          <button
                            onClick={() => moveCard(card.id, 'next')}
                            disabled={COLUMNS.indexOf(card.status) === COLUMNS.length - 1}
                            className="text-[10px] text-[#b8f55e] hover:text-white font-semibold disabled:opacity-30"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {colCards.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-500 border border-dashed border-white/5 rounded-xl">
                      Empty Queue
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
