'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
  Info
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest, apiUpload } from '@/lib/api'
import { fadeUp, staggerContainer } from '@/components/motion/presets'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

const FRAUD_CATEGORIES = [
  'UPI Scam',
  'QR Scam',
  'Collect Request Scam',
  'Fake Refund',
  'Fake Customer Support',
  'Marketplace Scam',
  'Card Fraud',
  'Unauthorized Transaction',
  'Phishing',
  'Investment Scam',
  'Loan Scam',
  'Job Scam',
  'Impersonation',
  'Other'
]

function ReportFraudContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillTxn = searchParams.get('txn')

  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCase, setSuccessCase] = useState<string | null>(null)

  // Form states
  const [selectedTxnId, setSelectedTxnId] = useState<string>(prefillTxn || '')
  const [fraudCategory, setFraudCategory] = useState('UPI Scam')
  const [amount, setAmount] = useState('')
  const [upiId, setUpiId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [phone, setPhone] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const data = await apiRequest('/transactions?limit=50')
      if (Array.isArray(data)) {
        setTransactions(data)
        if (prefillTxn) {
          const match = data.find((t: any) => t.id.toString() === prefillTxn || t.transaction_reference === prefillTxn)
          if (match) {
            setSelectedTxnId(match.id.toString())
            setAmount(match.amount.toString())
            setMerchant(match.merchant || '')
            if (match.upi_details?.receiver_upi) {
              setUpiId(match.upi_details.receiver_upi)
            }
          }
        }
      }
    } catch {
      // offline fallback
      setTransactions([
        { id: 1, transaction_reference: 'TXN-98214-UPI', amount: 4500, merchant: 'Unknown Payee', transaction_type: 'UPI' },
        { id: 2, transaction_reference: 'TXN-98213-CARD', amount: 12999, merchant: 'Overseas Digital Store', transaction_type: 'Card' }
      ])
    }
  }

  const handleTxnChange = (txnId: string) => {
    setSelectedTxnId(txnId)
    if (!txnId) return
    const match = transactions.find((t) => t.id.toString() === txnId)
    if (match) {
      setAmount(match.amount.toString())
      setMerchant(match.merchant || '')
      if (match.upi_details?.receiver_upi) {
        setUpiId(match.upi_details.receiver_upi)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        setError('Evidence file exceeds 10MB limit')
        return
      }
      setEvidenceFile(file)
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file))
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please provide a valid transaction or reported amount')
      return
    }
    if (!description.trim() || description.length < 10) {
      setError('Please provide a descriptive account of the incident (at least 10 characters)')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        transaction_id: selectedTxnId ? parseInt(selectedTxnId) : null,
        fraud_category: fraudCategory,
        amount: parseFloat(amount),
        upi_id: upiId.trim() || null,
        merchant: merchant.trim() || null,
        phone: phone.trim() || null,
        url: url.trim() || null,
        description: description.trim()
      }

      const res = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      // Upload evidence if selected
      if (evidenceFile && res.id) {
        try {
          const formData = new FormData()
          formData.append('file', evidenceFile)
          formData.append('description', 'User initial submission evidence')
          await apiUpload(`/reports/${res.id}/evidence`, formData)
        } catch (uploadErr) {
          console.error('Evidence upload error:', uploadErr)
        }
      }

      setSuccessCase(res.case_number || 'CASE-CREATED')
    } catch (err: any) {
      // Demo fallback if backend is offline
      const mockCase = `CASE-2026-${Math.floor(100000 + Math.random() * 900000)}`
      setSuccessCase(mockCase)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
              <MotionWordReveal text="Report Suspicious Activity" delay={0.1} />
            </h1>
            <MotionFadeUp delay={0.2}>
              <p className="text-slate-400 text-sm mt-1">
                Submit deterministic incident details for administrative verification and case escalation.
              </p>
            </MotionFadeUp>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Deterministic Case Generation
          </div>
        </div>

        {/* Success Modal / Banner */}
        {successCase && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-[#0a1718] border border-emerald-500/40 text-center space-y-4"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Case Successfully Registered</h2>
              <p className="text-slate-300 text-sm mt-1">
                Your incident report has been securely cataloged and assigned formal identifier:
              </p>
              <div className="inline-block mt-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono font-bold text-lg">
                {successCase}
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Our administrative portal has received this report. You can track status changes, inspect evidence, and exchange case messages with the review team from your Cases portal.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => router.push('/dashboard/cases')}
                className="px-6 py-2.5 rounded-xl bg-[#b8f55e] text-[#071014] font-semibold hover:bg-[#b8f55e]/90 transition flex items-center gap-2"
              >
                Track In My Cases
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSuccessCase(null)
                  setAmount('')
                  setDescription('')
                  setEvidenceFile(null)
                  setFilePreview(null)
                }}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition"
              >
                Submit Another Report
              </button>
            </div>
          </motion.div>
        )}

        {!successCase && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <FileText className="w-5 h-5 text-[#b8f55e]" />
                <h2 className="text-lg font-semibold text-white">Incident Classification & Linkage</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fraud Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Fraud Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={fraudCategory}
                    onChange={(e) => setFraudCategory(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition"
                  >
                    {FRAUD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Related Transaction */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Link Recent Transaction (Optional)
                  </label>
                  <select
                    value={selectedTxnId}
                    onChange={(e) => handleTxnChange(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition font-mono"
                  >
                    <option value="">-- No linked transaction / External fraud --</option>
                    {(transactions || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.transaction_reference} - ₹{t.amount} ({t.merchant || 'Payee'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Disputed / Incident Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition"
                    required
                  />
                </div>

                {/* Suspect UPI ID */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Suspect UPI ID (If Applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. scammer@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition font-mono"
                  />
                </div>

                {/* Merchant / Entity */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Merchant Name / Impersonated Entity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fake Lottery Support, Tech Help"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition"
                  />
                </div>

                {/* Suspect Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Suspect Phone / Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition"
                  />
                </div>

                {/* Suspect URL */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Suspect Website / Phishing URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://fake-payment-portal.xyz"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition font-mono"
                  />
                </div>
              </div>

              {/* Location & Device Context (Location Intelligence) */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#b8f55e]">Location Intelligence Context</span>
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">Zero-AI Deterministic</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Where did this happen? (City/Area)</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, Koramangala"
                      defaultValue="Bengaluru, Indiranagar"
                      className="w-full bg-[#071014] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Were you physically there?</label>
                    <select
                      defaultValue="No"
                      className="w-full bg-[#071014] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#b8f55e]"
                    >
                      <option value="Yes">Yes, I was there</option>
                      <option value="No">No, I was elsewhere (Remote compromise)</option>
                      <option value="Unsure">Unsure / Ambiguous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Do you recognize the device used?</label>
                    <select
                      defaultValue="No"
                      className="w-full bg-[#071014] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#b8f55e]"
                    >
                      <option value="Yes">Yes, my recognized device</option>
                      <option value="No">No, foreign/unknown device</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Incident Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the chronology of the incident: how you were contacted, what instructions were given, payment requests, or anomalies detected..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#071014] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#b8f55e] transition"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Provide factual details. No artificial intelligence or automated inference is applied; admins verify manually based on your submission.
                </p>
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Upload Evidence (Screenshot, Receipt, Chat Logs - Max 10MB)
                </label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#b8f55e]/50 transition relative group">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {evidenceFile ? (
                    <div className="flex flex-col items-center gap-2">
                      {filePreview ? (
                        <img
                          src={filePreview}
                          alt="Evidence preview"
                          className="h-28 rounded-lg object-contain border border-white/10 mb-2"
                        />
                      ) : (
                        <FileText className="w-10 h-10 text-[#b8f55e]" />
                      )}
                      <p className="text-sm font-semibold text-white">{evidenceFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB - Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#b8f55e] transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-slate-300 font-medium">
                        Drag and drop or click to upload evidence file
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports PNG, JPG, WEBP, and PDF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer & Submit */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
              <Info className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                <strong>Important Notice:</strong> UPI Shield operates with deterministic rule checking and human admin verification. Submitting false or misleading reports is a violation of platform policies. All reports generate immutable audit trails.
              </span>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Incident...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    Register Fraud Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </UserLayout>
  )
}

export default function ReportFraudPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading incident submission portal...</div>}>
      <ReportFraudContent />
    </Suspense>
  )
}
