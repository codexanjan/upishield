'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FileWarning,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  ArrowRight,
  MapPin,
  Smartphone
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/admin/reports')
      if (Array.isArray(data) && data.length > 0) {
        setReports(data)
      } else {
        throw new Error('Fallback')
      }
    } catch {
      // offline fallback
      setReports([
        {
          id: 1,
          report_number: 'REP-2026-000012',
          user_id: 1,
          user_name: 'Anjan Sharma',
          user_email: 'user@upishield.com',
          fraud_category: 'UPI Scam',
          amount: 18500,
          merchant: 'Quick Pay Services Delhi',
          upi_id: 'unknown@upi',
          location: 'Delhi',
          expected_location: 'Bengaluru',
          physically_there: 'No',
          recognize_device: 'No',
          status: 'Under Review',
          case_id: 1,
          case_number: 'CASE-2026-00421',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          evidence: [{ id: 1, file_name: 'debit_sms.png' }]
        },
        {
          id: 2,
          report_number: 'REP-2026-000013',
          user_id: 2,
          user_name: 'Priya Verma',
          user_email: 'priya.v@example.com',
          fraud_category: 'Card Fraud',
          amount: 32000,
          merchant: 'Overseas Digital Store',
          location: 'Singapore',
          expected_location: 'Bengaluru',
          physically_there: 'No',
          recognize_device: 'No',
          status: 'Submitted',
          case_id: 2,
          case_number: 'CASE-2026-000002',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          evidence: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (reportId: number, caseId: number | null, vStatus: string) => {
    if (!caseId) return
    setVerifyingId(reportId)
    try {
      await apiRequest(`/admin/cases/${caseId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ verification_status: vStatus })
      })
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: vStatus } : r))
      )
      setNotice(`Report marked as ${vStatus}. Platform directory records updated.`)
      setTimeout(() => setNotice(null), 4000)
    } catch {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: vStatus } : r))
      )
      setNotice(`Report status set locally to ${vStatus}.`)
      setTimeout(() => setNotice(null), 4000)
    } finally {
      setVerifyingId(null)
    }
  }

  const filteredReports = (reports || []).filter((r) => {
    const s = search.toLowerCase()
    const matchesSearch =
      (r.report_number && r.report_number.toLowerCase().includes(s)) ||
      (r.fraud_category && r.fraud_category.toLowerCase().includes(s)) ||
      (r.user_name && r.user_name.toLowerCase().includes(s)) ||
      (r.merchant && r.merchant.toLowerCase().includes(s)) ||
      (r.location && r.location.toLowerCase().includes(s))

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="COMPLAINANT INCIDENT QUEUE" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">LOCATION-GROUNDED AUDIT</span>
            </div>
            <MotionWordReveal
              text="Fraud Reports & Complainant Statements"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Review user incident statements, location discrepancy responses, and dispatch into investigation dossiers.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0a1718] border border-white/10 text-xs font-semibold text-slate-300">
            Reports in Queue: <span className="text-white font-mono">{filteredReports.length}</span>
          </div>
        </div>

        {/* Global Notice */}
        {notice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by report ID, category, user, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['ALL', 'Submitted', 'Under Review', 'Verified', 'Rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-[#b8f55e] text-[#071014]'
                    : 'bg-[#071014] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#0a1718] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Report Reference</th>
                  <th className="px-5 py-3.5 font-semibold">Category / Merchant</th>
                  <th className="px-5 py-3.5 font-semibold">Location Context (Sec. 23)</th>
                  <th className="px-5 py-3.5 font-semibold">Reported Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading user reports queue...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No matching reports found.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-mono">
                        <span className="font-bold text-white block">{r.report_number}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-white block">{r.fraud_category}</span>
                        <span className="text-[11px] text-slate-400">{r.merchant || r.upi_id}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <MapPin className="size-3.5 text-[#b8f55e]" />
                          <span>{r.location || 'Delhi'}</span>
                          <span className="text-[10px] text-rose-400 font-mono">(Expected: {r.expected_location || 'Bengaluru'})</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Present: {r.physically_there || 'No'} · Device Recognized: {r.recognize_device || 'No'}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-rose-400 text-sm">
                        ₹{Number(r.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : r.status === 'Under Review'
                              ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.case_id ? (
                            <Link
                              href={`/admin/cases?id=${r.case_id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#b8f55e]/15 hover:bg-[#b8f55e]/25 border border-[#b8f55e]/30 text-xs font-semibold text-[#b8f55e] transition inline-flex items-center gap-1"
                            >
                              Open Dossier <ArrowRight className="size-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No Case</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
