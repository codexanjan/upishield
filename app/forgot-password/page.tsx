'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { apiRequest } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }).catch(() => null)
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071014] text-[#eef8f7] px-6 py-12 selection:bg-[#b8f55e]/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f]">
              <ShieldCheck className="size-5" />
            </div>
            <span className="text-sm font-bold tracking-wider text-white">
              UPI SHIELD <span className="text-[#b8f55e]">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p className="mt-1 text-xs text-[#8fa9a6]">Enter your registered email to receive reset instructions.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 shadow-xl">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="size-12 text-[#b8f55e] mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">Request Received</h3>
              <p className="mt-2 text-xs text-[#8fa9a6] leading-relaxed">
                If an account exists for <span className="text-white font-mono">{email}</span>, password reset instructions have been issued.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-5 py-2.5 text-xs font-bold text-[#09110f] hover:brightness-110 transition"
              >
                Back to Login <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#b7c9c6] mb-1.5">Registered Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@upishield.ai"
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/[.04] px-4 pl-10 text-xs text-white placeholder:text-[#526b68] outline-none transition focus:border-[#b8f55e]/60"
                  />
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-[#617773]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b8f55e] text-xs font-semibold text-[#09110f] transition hover:brightness-110 shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Send Reset Instructions'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-[#8fa9a6] hover:text-white transition">
              <ArrowLeft className="size-3.5" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
