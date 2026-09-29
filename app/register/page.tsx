'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Mail, User, Phone, ArrowUpRight, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useAppStore, saveRegisteredUser } from '@/lib/store'
import { apiRequest } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (!acceptTerms) {
      setError('You must accept the terms of service')
      return
    }

    setLoading(true)

    try {
      // 1. Save locally with password hashed (zero plaintext storage)
      const saved = await saveRegisteredUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim() || '+91 98000 00000',
        password,
        role: 'user'
      })

      // 2. Also register via API
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          password,
          confirm_password: confirmPassword,
          accept_terms: acceptTerms
        }),
      }).catch(() => null)

      const token = data?.access_token || `token-${Date.now()}-user`
      setUser(
        {
          id: data?.user_id || saved.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          role: 'user',
          status: 'active',
          primary_city: 'Bengaluru'
        },
        token
      )
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#071014] text-[#eef8f7] selection:bg-[#b8f55e]/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Section */}
        <section className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between bg-[#0a1718]">
          <div className="pointer-events-none absolute -right-32 top-1/4 size-[520px] rounded-full bg-[#b8f55e]/10 blur-3xl" />
          
          <Link href="/" className="relative flex items-center gap-3 text-sm font-semibold tracking-[.18em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f]">
              <ShieldCheck className="size-5" />
            </span>
            UPI SHIELD <span className="text-[#b8f55e]">AI</span>
          </Link>

          <div className="relative max-w-lg">
            <p className="text-xs font-semibold tracking-[.22em] text-[#b8f55e]">GET PROTECTED TODAY</p>
            <h1 className="mt-5 text-5xl font-medium leading-[1.05] tracking-[-.05em]">
              Start with total payment clarity.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-[#91a8a7]">
              Join the deterministic safety net. Real-time UPI verification, automated expense categorisation, and verifiable dispute audit trails.
            </p>

            <div className="mt-12 grid gap-3">
              {[
                'Zero-AI deterministic calculations',
                'Verified UPI merchant directory',
                'Comprehensive category expense tracking',
                'Private by design & zero credential storage'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#b7c9c6]">
                  <span className="grid size-5 place-items-center rounded-full bg-[#b8f55e]/15 text-[#b8f55e]">
                    <Check className="size-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-between text-xs text-[#6f8583]">
            <span>© 2026 UPI Shield AI</span>
            <span>Deterministic Rule Security</span>
          </div>
        </section>

        {/* Right Section */}
        <section className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#829997] transition hover:text-white">
              <ArrowLeft className="size-4" /> Back to home
            </Link>

            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-3 text-sm font-semibold tracking-[.18em]">
                <span className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f]">
                  <ShieldCheck className="size-5" />
                </span>
                UPI SHIELD <span className="text-[#b8f55e]">AI</span>
              </div>
            </div>

            <p className="text-xs font-semibold tracking-[.22em] text-[#b8f55e]">USER REGISTRATION</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-.04em]">Create your account</h2>
            <p className="mt-2 text-sm leading-6 text-[#829997]">
              Set up your personal financial security workspace in seconds.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-[#ff7a82]/30 bg-[#ff7a82]/10 p-3 text-xs text-[#ff9da3]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#b7c9c6] mb-1.5">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anjan Sharma"
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/[.04] px-4 pl-10 text-xs text-white placeholder:text-[#526b68] outline-none transition focus:border-[#b8f55e]/60"
                  />
                  <User className="absolute left-3.5 top-3.5 size-4 text-[#617773]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b7c9c6] mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/[.04] px-4 pl-10 text-xs text-white placeholder:text-[#526b68] outline-none transition focus:border-[#b8f55e]/60"
                  />
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-[#617773]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#b7c9c6] mb-1.5">Mobile (Optional)</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/[.04] px-4 pl-10 text-xs text-white placeholder:text-[#526b68] outline-none transition focus:border-[#b8f55e]/60"
                  />
                  <Phone className="absolute left-3.5 top-3.5 size-4 text-[#617773]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#b7c9c6] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-white/12 bg-white/[.04] px-3.5 pl-9 text-xs text-white placeholder:text-[#526b68] outline-none transition focus:border-[#b8f55e]/60"
                    />
                    <Lock className="absolute left-3 top-3.5 size-3.5 text-[#617773]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b7c9c6] mb-1.5">Confirm</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-white/12 bg-white/[.04] px-3.5 pl-9 text-xs text-white placeholder:text-[#526b68] outline-none transition focus:border-[#b8f55e]/60"
                    />
                    <Lock className="absolute left-3 top-3.5 size-3.5 text-[#617773]" />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-[#829997]">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="accent-[#b8f55e]"
                />
                <span>I agree to the Terms of Service and Privacy Guidelines</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b8f55e] text-sm font-semibold text-[#09110f] transition hover:brightness-110 shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Get Protected Now'}
                <ArrowUpRight className="size-4" />
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-[#829997]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-white hover:underline">
                Sign in here
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#526b68]">
              <Sparkles className="size-3" /> Secure instant onboarding · No spam
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
