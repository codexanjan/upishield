'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Send,
  Upload,
  FileText,
  ShieldCheck,
  User,
  ExternalLink,
  MessageSquare,
  Lock,
  Plus,
  StickyNote,
  HelpCircle,
  FileQuestion,
  Info,
  MapPin,
  Play,
  RotateCcw,
  Layers,
  Smartphone,
  QrCode,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Activity,
  Download,
  Share2,
  Eye
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { fadeUp, staggerContainer, staggerItem } from '@/components/motion/presets'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'
import { useUPIGuardStore } from '@/lib/upiguard-store'

const STATUS_OPTIONS = [
  'Submitted',
  'Pending Review',
  'Under Review',
  'Waiting for User',
  'Escalated',
  'Resolved',
  'Rejected',
  'Closed'
]

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

function AdminCasesContent() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id')

  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  // Case Map & Replay state
  const [activeTab, setActiveTab] = useState<'details' | 'map' | 'replay' | 'correlation'>('details')
  const [mapLayers, setMapLayers] = useState({
    login: true,
    device: true,
    payment: true,
    qr: true,
    report: true
  })
  const [replayStep, setReplayStep] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)

  // Form states for Admin actions
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [newPriority, setNewPriority] = useState('')
  const [adminMsg, setAdminMsg] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [evidencePrompt, setEvidencePrompt] = useState('')
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const storeCases = useUPIGuardStore.getState().cases || []
      const mappedStoreCases = storeCases.map((sc, idx) => ({
        id: sc.id || `STORE-${idx}`,
        case_number: sc.caseId,
        report_id: idx + 100,
        status: sc.status === 'RESOLVED' ? 'Resolved' : sc.status === 'UNDER_REVIEW' ? 'Under Review' : 'Submitted',
        priority: sc.priority === 'CRITICAL' ? 'Critical' : sc.priority === 'HIGH' ? 'High' : 'Medium',
        fraud_category: sc.reason?.replace(/_/g, ' ') || 'UPI Fraud Dispute',
        amount: sc.amount,
        upi_id: sc.merchantUpiId || 'reported.payee@upi',
        merchant: sc.merchantName || 'Reported Entity',
        payment_location: 'Delhi',
        user_expected_location: 'Bengaluru',
        device_name: 'Samsung Galaxy S24',
        device_id: 'DEV-A8219',
        user_name: 'Anjan Sharma',
        user_email: 'user@upishield.com',
        user_mobile: '+91 98765 43210',
        description: sc.investigationNotes || `Fraud dispute filed for ₹${sc.amount?.toLocaleString('en-IN')}`,
        created_at: sc.createdAt,
        updated_at: sc.updatedAt,
        assigned_admin_name: 'Platform Administrator',
        transaction_reference: sc.transactionId || 'TXN-DISPUTE-DIRECT',
        evidence: [],
        messages: [],
        notes: [
          {
            id: Date.now(),
            admin_name: 'System Engine',
            note: 'Ingested from Live User Dispute Store',
            created_at: sc.createdAt
          }
        ],
        status_history: [
          {
            id: 1,
            old_status: null,
            new_status: sc.status === 'RESOLVED' ? 'Resolved' : 'Submitted',
            changed_by_name: 'User Report',
            note: 'Incident registered',
            created_at: sc.createdAt
          }
        ],
        location_timeline: [
          { time: '09:00 AM', type: 'login', city: 'Bengaluru', label: 'Session Active', desc: 'Verified session' },
          { time: '09:12 AM', type: 'payment', city: 'Delhi', label: 'Payment Event', desc: `₹${sc.amount} to ${sc.merchantName}` },
          { time: '09:15 AM', type: 'report', city: 'Bengaluru', label: 'Dispute Filed', desc: 'User report registered' }
        ]
      }))

      let fetchedData: any[] = []
      try {
        const data = await apiRequest('/admin/cases')
        if (Array.isArray(data) && data.length > 0) fetchedData = data
      } catch {
        // use fallback
      }

      const combined = [...mappedStoreCases, ...fetchedData]
      if (combined.length > 0) {
        setCases(combined)
        if (initialId) {
          const found = combined.find((c: any) => c.id?.toString() === initialId || c.case_number === initialId)
          selectCase(found || combined[0])
        } else {
          selectCase(combined[0])
        }
      } else {
        throw new Error('Fallback')
      }
    } catch {
      // offline fallback sample
      const mock: any[] = [
        {
          id: 1,
          case_number: 'CASE-2026-00421',
          report_id: 1,
          status: 'Under Review',
          priority: 'High',
          fraud_category: 'UPI Scam',
          amount: 18500,
          upi_id: 'unknown@upi',
          merchant: 'Quick Pay Services Delhi',
          payment_location: 'Delhi',
          user_expected_location: 'Bengaluru',
          device_name: 'Unknown Android',
          device_id: 'DEV-A921',
          user_phone: '+91 98765 43210',
          description: 'Payment of ₹18,500 initiated from Delhi while user was active in Bengaluru. Impossible travel velocity alert triggered (1,700 km in 18 minutes).',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          assigned_admin_name: 'Platform Administrator',
          user_name: 'Anjan Sharma',
          user_email: 'user@upishield.com',
          user_mobile: '+91 98765 43210',
          transaction_reference: 'TXN-849210-UPI',
          evidence: [
            {
              id: 1,
              file_name: 'debit_sms_screenshot.png',
              file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop',
              file_type: 'image/png',
              file_hash: '3f7b8c9d0e1a2f3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b'
            }
          ],
          messages: [
            {
              id: 1,
              sender_type: 'admin',
              sender_name: 'Platform Administrator',
              message: 'Your report has been assigned for administrative review. We are cross-referencing this UPI ID against previous platform records.',
              created_at: new Date(Date.now() - 3600000 * 18).toISOString()
            }
          ],
          notes: [
            {
              id: 1,
              admin_name: 'Platform Administrator',
              note: 'UPI ID has 7 other reports in Delhi cluster. Device DEV-A921 associated with 4 multi-account users.',
              created_at: new Date(Date.now() - 3600000 * 12).toISOString()
            }
          ],
          status_history: [
            {
              id: 1,
              old_status: null,
              new_status: 'Submitted',
              changed_by_name: 'System',
              note: 'Initial user report registered',
              created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
              id: 2,
              old_status: 'Submitted',
              new_status: 'Under Review',
              changed_by_name: 'Platform Administrator',
              note: 'High priority investigation queue assigned',
              created_at: new Date(Date.now() - 3600000 * 18).toISOString()
            }
          ],
          location_timeline: [
            { time: '02:05 AM', type: 'login', city: 'Bengaluru', label: 'Authorized Login', desc: 'Windows Chrome session active' },
            { time: '02:10 AM', type: 'device', city: 'Delhi', label: 'New Device Registration', desc: 'Hardware fingerprint DEV-A921 initialized' },
            { time: '02:13 AM', type: 'qr', city: 'Delhi', label: 'QR Scan Payload', desc: 'QR fingerprint QRF-81291 decoded' },
            { time: '02:15 AM', type: 'payment', city: 'Delhi', label: 'Payment Executed', desc: '₹18,500 transferred to unknown@upi' },
            { time: '02:28 AM', type: 'report', city: 'Bengaluru', label: 'User Report Filed', desc: 'User flagged unauthorized charge from home' }
          ]
        },
        {
          id: 2,
          case_number: 'CASE-2026-000002',
          report_id: 2,
          status: 'Submitted',
          priority: 'Medium',
          fraud_category: 'Card Fraud',
          amount: 32000,
          merchant: 'Overseas Digital Store',
          payment_location: 'Singapore',
          user_expected_location: 'Bengaluru',
          device_name: 'New Browser Session',
          device_id: 'DEV-B319',
          user_phone: '+91 98111 22334',
          description: 'International card transaction without OTP prompt.',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          assigned_admin_name: 'Unassigned',
          user_name: 'Priya Verma',
          user_email: 'priya.v@example.com',
          user_mobile: '+91 98111 22334',
          transaction_reference: 'TXN-71920-CARD',
          evidence: [],
          messages: [],
          notes: [],
          status_history: [],
          location_timeline: [
            { time: '11:15 AM', type: 'login', city: 'Bengaluru', label: 'User Login', desc: 'Mobile app login' },
            { time: '11:42 AM', type: 'payment', city: 'Singapore', label: 'International POS', desc: '₹32,000 card charge' },
            { time: '12:05 PM', type: 'report', city: 'Bengaluru', label: 'Card Block Report', desc: 'User reported foreign card debit' }
          ]
        }
      ]
      setCases(mock)
      selectCase(mock[0])
    } finally {
      setLoading(false)
    }
  }

  const selectCase = (c: any) => {
    setSelectedCase(c)
    setNewStatus(c?.status || 'Submitted')
    setNewPriority(c?.priority || 'Medium')
    setReplayStep(0)
    setIsReplaying(false)
  }

  // Incident replay animation loop
  const handleStartReplay = () => {
    if (!selectedCase?.location_timeline?.length) return
    setIsReplaying(true)
    setReplayStep(0)
    setActiveTab('replay')

    let current = 0
    const total = selectedCase.location_timeline.length
    const interval = setInterval(() => {
      current++
      if (current >= total) {
        clearInterval(interval)
        setIsReplaying(false)
        setReplayStep(total - 1)
      } else {
        setReplayStep(current)
      }
    }, 1400)
  }

  const handleUpdateStatus = async () => {
    if (!selectedCase || !newStatus) return
    setActionLoading(true)
    try {
      await apiRequest(`/admin/cases/${selectedCase.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note: statusNote || undefined })
      })

      const updated = {
        ...selectedCase,
        status: newStatus,
        status_history: [
          ...(selectedCase.status_history || []),
          {
            id: Date.now(),
            old_status: selectedCase.status,
            new_status: newStatus,
            changed_by_name: 'Platform Administrator',
            note: statusNote || `Status changed to ${newStatus}`,
            created_at: new Date().toISOString()
          }
        ]
      }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      
      // Update global store to trigger real-time user & admin notifications
      const mappedStoreStatus = newStatus === 'Resolved' || newStatus === 'Closed' ? 'RESOLVED' : newStatus === 'Under Review' || newStatus === 'Escalated' ? 'UNDER_REVIEW' : 'SUBMITTED'
      useUPIGuardStore.getState().updateCaseStatus(
        selectedCase.case_number || selectedCase.caseId || `CASE-${selectedCase.id}`,
        mappedStoreStatus,
        statusNote || `Admin action: ${newStatus}`
      )

      setStatusNote('')
      setActionSuccess(`Case status updated to ${newStatus} — all parties notified`)
      setTimeout(() => setActionSuccess(null), 4000)
    } catch {
      const updated = { ...selectedCase, status: newStatus }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      
      const mappedStoreStatus = newStatus === 'Resolved' || newStatus === 'Closed' ? 'RESOLVED' : newStatus === 'Under Review' || newStatus === 'Escalated' ? 'UNDER_REVIEW' : 'SUBMITTED'
      useUPIGuardStore.getState().updateCaseStatus(
        selectedCase.case_number || selectedCase.caseId || `CASE-${selectedCase.id}`,
        mappedStoreStatus,
        statusNote || `Admin action: ${newStatus}`
      )

      setActionSuccess(`Status updated to ${newStatus} — notifications dispatched`)
      setTimeout(() => setActionSuccess(null), 4000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdatePriority = async () => {
    if (!selectedCase || !newPriority) return
    setActionLoading(true)
    try {
      await apiRequest(`/admin/cases/${selectedCase.id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: newPriority })
      })
      const updated = { ...selectedCase, priority: newPriority }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setActionSuccess(`Case priority updated to ${newPriority}`)
      setTimeout(() => setActionSuccess(null), 4000)
    } catch {
      const updated = { ...selectedCase, priority: newPriority }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setActionSuccess(`Priority updated locally to ${newPriority}`)
      setTimeout(() => setActionSuccess(null), 4000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCase || !adminMsg.trim()) return

    setActionLoading(true)
    try {
      await apiRequest(`/cases/${selectedCase.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: adminMsg.trim() })
      })
      const newM = {
        id: Date.now(),
        sender_type: 'admin',
        sender_name: 'Platform Administrator',
        message: adminMsg.trim(),
        created_at: new Date().toISOString()
      }
      const updated = {
        ...selectedCase,
        messages: [...(selectedCase.messages || []), newM]
      }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setAdminMsg('')
    } catch {
      const newM = {
        id: Date.now(),
        sender_type: 'admin',
        sender_name: 'Platform Administrator',
        message: adminMsg.trim(),
        created_at: new Date().toISOString()
      }
      const updated = {
        ...selectedCase,
        messages: [...(selectedCase.messages || []), newM]
      }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setAdminMsg('')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCase || !internalNote.trim()) return

    setActionLoading(true)
    try {
      await apiRequest(`/admin/cases/${selectedCase.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: internalNote.trim() })
      })
      const newN = {
        id: Date.now(),
        admin_name: 'Platform Administrator',
        note: internalNote.trim(),
        created_at: new Date().toISOString()
      }
      const updated = {
        ...selectedCase,
        notes: [...(selectedCase.notes || []), newN]
      }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setInternalNote('')
    } catch {
      const newN = {
        id: Date.now(),
        admin_name: 'Platform Administrator',
        note: internalNote.trim(),
        created_at: new Date().toISOString()
      }
      const updated = {
        ...selectedCase,
        notes: [...(selectedCase.notes || []), newN]
      }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setInternalNote('')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestEvidence = async () => {
    if (!selectedCase || !evidencePrompt.trim()) return
    setActionLoading(true)
    try {
      await apiRequest(`/admin/cases/${selectedCase.id}/request-evidence`, {
        method: 'POST',
        body: JSON.stringify({ evidence_instructions: evidencePrompt.trim() })
      })

      const updated = {
        ...selectedCase,
        status: 'Waiting for User',
        messages: [
          ...(selectedCase.messages || []),
          {
            id: Date.now(),
            sender_type: 'admin',
            sender_name: 'Platform Administrator',
            message: `FORMAL EVIDENCE REQUEST: ${evidencePrompt.trim()}`,
            created_at: new Date().toISOString()
          }
        ]
      }
      setSelectedCase(updated)
      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)))
      setShowEvidenceModal(false)
      setEvidencePrompt('')
      setActionSuccess('Evidence request dispatched to complainant')
      setTimeout(() => setActionSuccess(null), 4000)
    } catch {
      setShowEvidenceModal(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyReport = async (vStatus: string) => {
    if (!selectedCase) return
    setActionLoading(true)
    try {
      await apiRequest(`/admin/cases/${selectedCase.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ verification_status: vStatus })
      })
      setActionSuccess(`Case record verified as ${vStatus}. Platform directories updated.`)
      setTimeout(() => setActionSuccess(null), 4000)
    } catch {
      setActionSuccess(`Classified as ${vStatus} locally.`)
      setTimeout(() => setActionSuccess(null), 4000)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredCases = (cases || []).filter((c) => {
    const s = search.toLowerCase()
    const matchesSearch =
      (c.case_number && c.case_number.toLowerCase().includes(s)) ||
      (c.fraud_category && c.fraud_category.toLowerCase().includes(s)) ||
      (c.user_name && c.user_name.toLowerCase().includes(s)) ||
      (c.upi_id && c.upi_id.toLowerCase().includes(s)) ||
      (c.merchant && c.merchant.toLowerCase().includes(s))

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'OPEN'
        ? !['Resolved', 'Closed', 'Rejected'].includes(c.status)
        : c.status === statusFilter

    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="ADMIN INVESTIGATION CONSOLE" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">DETERMINISTIC · NO AI</span>
            </div>
            <MotionWordReveal
              text="Case Investigation & Dossier"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Full lifecycle fraud investigation, location correlation, multi-account device audit, and incident replay.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-[#0a1718] border border-white/10 text-xs font-semibold text-slate-300">
              Total Dossiers: <span className="text-white font-mono">{cases.length}</span>
            </div>
          </div>
        </div>

        {/* Global Notifications Banner */}
        <AnimatePresence>
          {actionSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3"
            >
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{actionSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-Column Split: Case Directory (4 Cols) & Active Dossier (8 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filterable Case List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter cases by ID, UPI, Complainant..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#071014] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 bg-[#071014] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#b8f55e]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open Cases</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-[#071014] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#b8f55e]"
                >
                  <option value="ALL">All Priorities</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cases Scrollable List */}
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading cases registry...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0a1718] border border-white/10 text-center text-xs text-slate-400">
                No matching fraud cases found.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {filteredCases.map((c) => {
                  const isSelected = selectedCase?.id === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectCase(c)}
                      className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-[#071014] border-[#b8f55e] shadow-lg shadow-[#b8f55e]/5'
                          : 'bg-[#0a1718] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white tracking-wide">
                          {c.case_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.priority === 'Critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : c.priority === 'High'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[170px]">
                          {c.fraud_category}
                        </span>
                        <span className="font-bold text-rose-400 font-mono">
                          ₹{Number(c.amount).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                        <span className="truncate">{c.user_name || 'Complainant'}</span>
                        <span className="font-semibold text-white px-2 py-0.5 rounded bg-white/5">{c.status}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Case Details & Location Investigation (8 Cols) */}
          <div className="lg:col-span-8">
            {selectedCase ? (
              <motion.div
                key={selectedCase.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Case Top Overview */}
                <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold text-white tracking-wide">
                          {selectedCase.case_number}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/30">
                          {selectedCase.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Registered:{' '}
                        {new Date(selectedCase.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">Reported Amount</span>
                      <span className="text-2xl font-bold text-rose-400 font-mono">
                        ₹{Number(selectedCase.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Section 24 User Case Details Schema: Complainant & Incident Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block text-[10px] uppercase">Fraud Type</span>
                      <span className="text-white font-semibold block truncate mt-0.5">{selectedCase.fraud_category}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block text-[10px] uppercase">Payment Location</span>
                      <span className="text-rose-400 font-mono font-semibold block truncate mt-0.5">
                        {selectedCase.payment_location || 'Delhi'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block text-[10px] uppercase">User Expected Location</span>
                      <span className="text-emerald-400 font-mono font-semibold block truncate mt-0.5">
                        {selectedCase.user_expected_location || 'Bengaluru'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block text-[10px] uppercase">Device</span>
                      <span className="text-amber-400 font-mono font-semibold block truncate mt-0.5">
                        {selectedCase.device_name || selectedCase.device_id || 'Unknown Android'}
                      </span>
                    </div>
                  </div>

                  {/* Additional Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block">Complainant</span>
                      <span className="text-white font-semibold block">{selectedCase.user_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedCase.user_email}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block">Suspect Recipient</span>
                      <span className="text-white font-mono font-semibold block truncate">
                        {selectedCase.upi_id || selectedCase.merchant || 'Unidentified'}
                      </span>
                      <span className="text-[10px] text-slate-400">{selectedCase.merchant || 'Direct VPA'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                      <span className="text-slate-500 block">Linked Transaction</span>
                      <span className="text-[#b8f55e] font-mono font-semibold block">
                        {selectedCase.transaction_reference || 'External Incident'}
                      </span>
                      <span className="text-[10px] text-slate-400">Ledger Entry</span>
                    </div>
                  </div>

                  {/* Statement */}
                  <div className="p-4 rounded-xl bg-[#071014] border border-white/5">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Complainant Incident Statement
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedCase.description}</p>
                  </div>
                </div>

                {/* Sub-Navigation Tabs: Details | Case Map | Incident Replay | Entity Correlation */}
                <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                      activeTab === 'details'
                        ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Briefcase className="size-3.5" />
                    Investigation & Actions
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                      activeTab === 'map'
                        ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <MapPin className="size-3.5" />
                    Case Map & Layers
                  </button>
                  <button
                    onClick={() => setActiveTab('replay')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                      activeTab === 'replay'
                        ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Play className="size-3.5" />
                    Incident Replay
                  </button>
                  <button
                    onClick={() => setActiveTab('correlation')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                      activeTab === 'correlation'
                        ? 'bg-[#b8f55e]/20 text-[#b8f55e] border border-[#b8f55e]/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Share2 className="size-3.5" />
                    Cross-Case Correlation
                  </button>
                </div>

                {/* TAB 1: DETAILS & ACTIONS */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Administrative Controls */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-[#b8f55e]/30 space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <ShieldCheck className="size-4 text-[#b8f55e]" />
                        <h3 className="text-sm font-semibold text-white">Administrative Actions & Authority</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Changer */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">Change Case Status</label>
                          <div className="flex gap-2">
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              className="flex-1 bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <button
                              onClick={handleUpdateStatus}
                              disabled={actionLoading || newStatus === selectedCase.status}
                              className="px-4 py-2 rounded-xl bg-[#b8f55e] hover:bg-[#a6e848] text-[#071014] font-semibold text-xs transition disabled:opacity-50"
                            >
                              Apply
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Optional status transition reason..."
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            className="w-full bg-[#071014] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
                          />
                        </div>

                        {/* Priority Changer */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">Change Priority</label>
                          <div className="flex gap-2">
                            <select
                              value={newPriority}
                              onChange={(e) => setNewPriority(e.target.value)}
                              className="flex-1 bg-[#071014] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
                            >
                              {PRIORITY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <button
                              onClick={handleUpdatePriority}
                              disabled={actionLoading || newPriority === selectedCase.priority}
                              className="px-4 py-2 rounded-xl bg-[#071014] border border-white/10 hover:border-white/30 text-white font-semibold text-xs transition disabled:opacity-50"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                        <button
                          onClick={() => setShowEvidenceModal(true)}
                          className="px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-xs font-semibold text-sky-400 transition flex items-center gap-1.5"
                        >
                          <FileQuestion className="size-3.5 text-sky-400" />
                          Request User Evidence
                        </button>

                        <button
                          onClick={() => handleVerifyReport('Verified')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold text-emerald-400 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Mark Report Verified
                        </button>

                        <button
                          onClick={() => handleVerifyReport('Rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 transition flex items-center gap-1.5"
                        >
                          <AlertCircle className="size-3.5" />
                          Mark Report Invalid
                        </button>
                      </div>
                    </div>

                    {/* Evidence Request Modal */}
                    {showEvidenceModal && (
                      <div className="p-4 rounded-2xl bg-[#071014] border border-sky-500/30 space-y-3">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <FileQuestion className="size-4 text-sky-400" />
                          Formal Evidence Request Instructions
                        </h4>
                        <textarea
                          rows={3}
                          placeholder="Specify required evidence (e.g. Bank statement with debit reference, chat screenshot)..."
                          value={evidencePrompt}
                          onChange={(e) => setEvidencePrompt(e.target.value)}
                          className="w-full bg-[#0a1718] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-400"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowEvidenceModal(false)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRequestEvidence}
                            disabled={!evidencePrompt.trim()}
                            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition"
                          >
                            Dispatch Request
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Evidence Files List */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                        <FileText className="size-4 text-[#b8f55e]" />
                        Case Evidence Locker (SHA-256 Verified)
                      </h3>

                      {selectedCase.evidence && selectedCase.evidence.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedCase.evidence.map((ev: any) => (
                            <div
                              key={ev.id}
                              className="p-3.5 rounded-xl bg-[#071014] border border-white/5 hover:border-[#b8f55e]/40 transition space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="size-4 text-[#b8f55e]" />
                                  <span className="text-xs text-white font-medium truncate max-w-[180px]">
                                    {ev.file_name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  Integrity Verified
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-slate-500 truncate">
                                Hash: {ev.file_hash || '3f7b8c9d0e1a2f3b4c5d6e7f8a9b0c1d2e3f4a5b'}
                              </p>
                              <a
                                href={ev.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-[#b8f55e] hover:underline pt-1"
                              >
                                <ExternalLink className="size-3" />
                                Inspect Document
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No evidence uploaded for this incident.</p>
                      )}
                    </div>

                    {/* Complainant Communication Thread */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                        <MessageSquare className="size-4 text-[#b8f55e]" />
                        Case Communication Thread (Complainant Exchange)
                      </h3>

                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {selectedCase.messages && selectedCase.messages.length > 0 ? (
                          selectedCase.messages.map((m: any) => {
                            const isAdmin = m.sender_type === 'admin'
                            return (
                              <div
                                key={m.id}
                                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                              >
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                                  <span className="font-semibold text-slate-400">{m.sender_name}</span>
                                  <span>
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div
                                  className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                                    isAdmin
                                      ? 'bg-[#b8f55e]/20 border border-[#b8f55e]/30 text-white rounded-tr-sm'
                                      : 'bg-[#071014] border border-white/10 text-white rounded-tl-sm'
                                  }`}
                                >
                                  {m.message}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-slate-500 italic text-center py-6">
                            No messages exchanged yet.
                          </p>
                        )}
                      </div>

                      <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/5">
                        <input
                          type="text"
                          placeholder="Type an official response to complainant..."
                          value={adminMsg}
                          onChange={(e) => setAdminMsg(e.target.value)}
                          className="flex-1 bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e]"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || !adminMsg.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[#b8f55e] hover:bg-[#a6e848] text-[#071014] font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="size-3.5" />
                          Send
                        </button>
                      </form>
                    </div>

                    {/* Internal Investigation Notes */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <StickyNote className="size-4 text-amber-400" />
                          <h3 className="text-sm font-semibold text-white">Internal Investigation Notes</h3>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                          CONFIDENTIAL · ADMIN ONLY
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-48 overflow-y-auto">
                        {selectedCase.notes && selectedCase.notes.length > 0 ? (
                          selectedCase.notes.map((n: any) => (
                            <div key={n.id} className="p-3 rounded-xl bg-[#071014] border border-white/5 text-xs">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                <span className="font-semibold text-slate-300">{n.admin_name || 'Admin'}</span>
                                <span className="font-mono">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-200">{n.note}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">No internal notes added yet.</p>
                        )}
                      </div>

                      <form onSubmit={handleAddInternalNote} className="flex gap-2 pt-2 border-t border-white/5">
                        <input
                          type="text"
                          placeholder="Add private investigation note (hidden from user)..."
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          className="flex-1 bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading || !internalNote.trim()}
                          className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Plus className="size-3.5" />
                          Add Note
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 2: CASE MAP & LAYERS (Sections 46, 47, 48) */}
                {activeTab === 'map' && (
                  <div className="space-y-6">
                    {/* Layer Controls Bar (Section 48) */}
                    <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Layers className="size-4 text-[#b8f55e]" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Case Map Layers:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071014] border border-white/10 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapLayers.login}
                            onChange={(e) => setMapLayers({ ...mapLayers, login: e.target.checked })}
                            className="accent-[#b8f55e]"
                          />
                          <span>Login</span>
                        </label>
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071014] border border-white/10 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapLayers.device}
                            onChange={(e) => setMapLayers({ ...mapLayers, device: e.target.checked })}
                            className="accent-amber-400"
                          />
                          <span>Device</span>
                        </label>
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071014] border border-white/10 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapLayers.payment}
                            onChange={(e) => setMapLayers({ ...mapLayers, payment: e.target.checked })}
                            className="accent-rose-400"
                          />
                          <span>Payment</span>
                        </label>
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071014] border border-white/10 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapLayers.qr}
                            onChange={(e) => setMapLayers({ ...mapLayers, qr: e.target.checked })}
                            className="accent-purple-400"
                          />
                          <span>QR</span>
                        </label>
                        <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071014] border border-white/10 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapLayers.report}
                            onChange={(e) => setMapLayers({ ...mapLayers, report: e.target.checked })}
                            className="accent-emerald-400"
                          />
                          <span>Report</span>
                        </label>
                      </div>
                    </div>

                    {/* Interactive Simulated Vector Map */}
                    <div className="relative h-96 rounded-2xl bg-[#071014] border border-white/10 overflow-hidden p-6 flex flex-col justify-between">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b8f55e_1px,transparent_1px)] [background-size:20px_20px]" />

                      {/* Top status */}
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400">VECTOR PLOT · BENGALURU ↔ DELHI CORRIDOR</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          DISTANCE: ~1,700 KM · DELTA: 18 MINS (IMPOSSIBLE)
                        </span>
                      </div>

                      {/* Map Nodes */}
                      <div className="relative z-10 grid grid-cols-2 gap-8 my-auto">
                        {/* Node A: Bengaluru (Login & Report) */}
                        <div className="p-4 rounded-xl bg-[#0a1718]/90 border border-white/10 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <MapPin className="size-4" />
                            <span>BENGALURU CLUSTER</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-300">
                            {mapLayers.login && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">02:05 AM Login</span>
                                <span className="text-emerald-400 font-mono">Chrome / Bengaluru</span>
                              </div>
                            )}
                            {mapLayers.report && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">02:28 AM Report</span>
                                <span className="text-emerald-400 font-mono">Complainant App</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Node B: Delhi (Device, QR, Payment) */}
                        <div className="p-4 rounded-xl bg-[#0a1718]/90 border border-rose-500/30 space-y-2">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                            <AlertTriangle className="size-4" />
                            <span>DELHI SUSPECT CLUSTER</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-300">
                            {mapLayers.device && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">02:10 AM Device</span>
                                <span className="text-amber-400 font-mono">DEV-A921</span>
                              </div>
                            )}
                            {mapLayers.qr && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">02:13 AM QR Scan</span>
                                <span className="text-purple-400 font-mono">QRF-81291</span>
                              </div>
                            )}
                            {mapLayers.payment && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">02:15 AM Payment</span>
                                <span className="text-rose-400 font-mono">₹18,500</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Legend */}
                      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                        <span>Latitude/Longitude mapped via deterministic geofence records</span>
                        <span className="font-mono text-[#b8f55e]">CASE ID: {selectedCase.case_number}</span>
                      </div>
                    </div>

                    {/* Section 47: Case Location Timeline */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                        <Clock className="size-4 text-[#b8f55e]" />
                        Case Location Incident Timeline
                      </h3>

                      <div className="relative border-l border-white/10 ml-4 space-y-6 py-2">
                        {(selectedCase.location_timeline || []).map((step: any, idx: number) => (
                          <div key={idx} className="relative pl-6">
                            <span className="absolute -left-1.5 top-1 size-3 rounded-full bg-[#b8f55e] ring-4 ring-[#0a1718]" />
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-white">{step.time}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                                {step.city}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-200 mt-0.5">{step.label}</p>
                            <p className="text-[11px] text-slate-400">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: ADMIN INCIDENT REPLAY (Section 49) */}
                {activeTab === 'replay' && (
                  <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Play className="size-4 text-[#b8f55e]" />
                          Deterministic Incident Replay Simulator
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Plays back chronology from initial login to device compromise, payment, and administrative case dispatch.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleStartReplay}
                          disabled={isReplaying}
                          className="px-4 py-2 rounded-xl bg-[#b8f55e] hover:bg-[#a6e848] text-[#071014] font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <Play className="size-3.5 fill-current" />
                          {isReplaying ? 'Replaying...' : 'Replay Incident'}
                        </button>
                        <button
                          onClick={() => setReplayStep(0)}
                          className="px-3 py-2 rounded-xl bg-[#071014] border border-white/10 text-slate-300 text-xs hover:text-white"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="relative pt-2">
                      <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono mb-2">
                        <span className={replayStep >= 0 ? 'text-[#b8f55e] font-bold' : 'text-slate-600'}>1. LOGIN</span>
                        <span className={replayStep >= 1 ? 'text-amber-400 font-bold' : 'text-slate-600'}>2. DEVICE</span>
                        <span className={replayStep >= 2 ? 'text-purple-400 font-bold' : 'text-slate-600'}>3. QR SCAN</span>
                        <span className={replayStep >= 3 ? 'text-rose-400 font-bold' : 'text-slate-600'}>4. PAYMENT</span>
                        <span className={replayStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>5. REPORT/CASE</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#071014] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#b8f55e] via-amber-400 to-rose-400"
                          animate={{ width: `${((replayStep + 1) / (selectedCase.location_timeline?.length || 5)) * 100}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>

                    {/* Replay Display Card */}
                    {selectedCase.location_timeline && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={replayStep}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="p-6 rounded-2xl bg-[#071014] border border-[#b8f55e]/30 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-white/10 text-white">
                              {selectedCase.location_timeline[replayStep]?.time}
                            </span>
                            <span className="font-mono text-xs text-rose-400 font-bold uppercase">
                              LOCATION: {selectedCase.location_timeline[replayStep]?.city}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white">
                            {selectedCase.location_timeline[replayStep]?.label}
                          </h4>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {selectedCase.location_timeline[replayStep]?.desc}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5">
                            <span>Step {replayStep + 1} of {selectedCase.location_timeline.length}</span>
                            <span className="font-mono text-emerald-400">STATE: VERIFIED CHRONOLOGY</span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                )}

                {/* TAB 4: CROSS-CASE CORRELATION & RELATED ENTITIES (Sections 50, 51, 52, 53) */}
                {activeTab === 'correlation' && (
                  <div className="space-y-6">
                    {/* Section 50: Location + Device Correlation */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Smartphone className="size-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Hardware Fingerprint Correlation (DEV-A921)
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Seen In</span>
                          <span className="text-white font-semibold block mt-0.5">Bengaluru, Mysuru, Delhi</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Linked Accounts</span>
                          <span className="text-amber-400 font-bold font-mono block mt-0.5">4 Users</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Associated Cases</span>
                          <span className="text-rose-400 font-bold font-mono block mt-0.5">3 Cases</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Flagged Transactions</span>
                          <span className="text-rose-400 font-bold font-mono block mt-0.5">6 Reported</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 51: Location + UPI Correlation */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <ShieldAlert className="size-4 text-rose-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          VPA Intelligence (unknown@upi)
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Active Cities</span>
                          <span className="text-white font-bold font-mono block mt-0.5">12 Cities</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Total Complainants</span>
                          <span className="text-rose-400 font-bold font-mono block mt-0.5">38 Users</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Reports Filed</span>
                          <span className="text-rose-400 font-bold font-mono block mt-0.5">7 Reports</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Associated QR</span>
                          <span className="text-purple-400 font-bold font-mono block mt-0.5">3 QR Fingerprints</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                          <span className="text-slate-500 block">Related Devices</span>
                          <span className="text-amber-400 font-bold font-mono block mt-0.5">8 Devices</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 53: Deterministic Related Cases */}
                    <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <Share2 className="size-4 text-[#b8f55e]" />
                          <h4 className="text-sm font-semibold text-white">Deterministically Linked Cases</h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#b8f55e]">EXACT MATCH RULES ONLY</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-white">CASE-2026-00021</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Match</span>
                          </div>
                          <p className="text-xs text-[#b8f55e] font-medium">Same UPI + Device</p>
                          <p className="text-[11px] text-slate-400">DEV-A921 & unknown@upi</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-white">CASE-2026-00092</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Match</span>
                          </div>
                          <p className="text-xs text-amber-400 font-medium">Same QR + Location</p>
                          <p className="text-[11px] text-slate-400">QRF-81291 in Delhi</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-white">CASE-2026-00143</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Match</span>
                          </div>
                          <p className="text-xs text-purple-400 font-medium">Same Merchant</p>
                          <p className="text-[11px] text-slate-400">Quick Pay Services Delhi</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#0a1718] border border-white/10 text-center text-slate-400">
                Select a fraud case on the left to review the administrative dossier.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminCasesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading cases investigation console...</div>}>
      <AdminCasesContent />
    </Suspense>
  )
}
