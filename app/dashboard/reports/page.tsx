'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FileText,
  ShieldAlert,
  Search,
  ExternalLink,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

export default function MyReportsPage() {
  const storeCases = useUPIGuardStore((s) => s.cases)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/fraud-reports')
      if (Array.isArray(data) && data.length > 0) {
        setReports(data)
      } else {
        // Fallback default sample reports
        setReports([])
      }
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  // Combined reports prioritizing live store cases
  const allReports = [
    ...(storeCases || []).map((c) => ({
      id: c.id,
      report_number: c.caseId,
      fraud_category: c.reason?.replace(/_/g, ' ') || 'Fraud Dispute',
      merchant: c.merchantName || 'Reported Entity',
      upi_id: c.merchantUpiId || null,
      amount: c.amount,
      report_status: c.status === 'RESOLVED' ? 'Verified & Resolved' : c.status === 'UNDER_REVIEW' ? 'Under Review' : 'Submitted (Active)',
      case_id: c.caseId,
      case_number: c.caseId,
      incident_date: c.createdAt,
      notes: c.investigationNotes
    })),
    ...reports
  ]

  const filteredReports = allReports.filter((r) => {
    const matchesSearch =
      r.report_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.fraud_category?.toLowerCase().includes(search.toLowerCase()) ||
      r.merchant?.toLowerCase().includes(search.toLowerCase()) ||
      (r.upi_id && r.upi_id.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || r.report_status?.toLowerCase().includes(statusFilter.toLowerCase())
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        )
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Under Review
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Submitted
          </span>
        )
    }
  }

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#b8f55e]" />
              <MotionWordReveal text="My Fraud Reports" delay={0.1} />
            </h1>
            <MotionFadeUp delay={0.2}>
              <p className="text-slate-400 text-sm mt-1">
                Historical record of all fraudulent activity reports you have submitted to UPI Shield.
              </p>
            </MotionFadeUp>
          </div>
          <Link
            href="/dashboard/report"
            className="px-5 py-2.5 rounded-xl bg-[#b8f55e] text-[#071014] font-semibold hover:bg-[#b8f55e]/90 transition flex items-center gap-2 shadow-lg shadow-[#b8f55e]/20 w-fit"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#0a1718] p-4 rounded-2xl border border-white/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by report ID, category, suspect..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#b8f55e] transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'Submitted', 'Under Review', 'Verified', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[#b8f55e] text-[#071014] font-semibold'
                    : 'bg-[#071014] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table or Empty State */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0a1718] border border-white/10 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-white">No Incident Reports Found</h3>
              <p className="text-slate-400 text-xs mt-1">
                {search || statusFilter !== 'ALL'
                  ? 'No reports match your selected filters.'
                  : 'You have not submitted any fraud reports. If you notice any suspicious UPI or card activity, report it immediately.'}
              </p>
            </div>
            {!search && statusFilter === 'ALL' && (
              <Link
                href="/dashboard/report"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30 text-xs font-semibold hover:bg-[#b8f55e]/30 transition"
              >
                File Your First Report
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0a1718] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#071014] text-xs uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-4 px-6">Report ID</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Suspect / Entity</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Case Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(filteredReports || []).map((report) => (
                    <tr key={report.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6 font-mono font-bold text-white">
                        {report.report_number || `REP-${report.id}`}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-white">{report.fraud_category}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white text-xs">{report.merchant || report.upi_id || 'N/A'}</p>
                          {report.upi_id && report.merchant && (
                            <p className="text-[11px] font-mono text-slate-400">{report.upi_id}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-rose-400">
                        ₹{Number(report.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(report.incident_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(report.report_status)}</td>
                      <td className="py-4 px-6 text-right">
                        {report.case_id ? (
                          <Link
                            href={`/dashboard/cases?case_id=${report.case_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition border border-white/5"
                          >
                            <span>{report.case_number || 'View Case'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Pending Admin Review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
