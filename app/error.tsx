'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from 'lucide-react'

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[UPI Shield AI] Runtime Error Caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#071014] text-[#eef8f7] flex items-center justify-center p-6 selection:bg-[#b8f55e]/30">
      <div className="relative max-w-md w-full rounded-2xl border border-white/10 bg-[#0a1718] p-8 text-center shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-[#b8f55e]/10 blur-3xl" />

        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-xl bg-white/[.04] border border-white/10 px-3 py-1 text-xs text-[#8fa9a6]">
          <span className="grid size-5 place-items-center rounded-lg bg-[#b8f55e] text-[#09110f]">
            <ShieldCheck className="size-3.5" />
          </span>
          <span className="font-semibold tracking-wider text-white">UPI SHIELD</span>
          <span className="text-[#b8f55e] font-bold">AI</span>
        </div>

        <div className="mx-auto my-4 grid size-12 place-items-center rounded-2xl bg-[#ff7a82]/10 text-[#ff7a82] border border-[#ff7a82]/20">
          <AlertTriangle className="size-6" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-white">Temporary Interface Glitch</h2>
        <p className="mt-2 text-xs text-[#8fa9a6] leading-relaxed">
          {error?.message || 'A safe fallback has activated to protect your transaction session.'}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-semibold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/15"
          >
            <RefreshCw className="size-3.5" />
            Reload View
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[.04] px-4 py-2.5 text-xs font-medium text-white hover:bg-white/[.08] transition"
          >
            <Home className="size-3.5" />
            Return Home
          </Link>
        </div>

        <div className="mt-5 text-[11px] text-[#526b68]">
          Deterministic Rule Engine Active · No Unhandled Failures
        </div>
      </div>
    </div>
  )
}
