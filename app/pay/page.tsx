'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { UPIGuardPaymentFlow } from '@/components/payments/upiguard-payment-flow'

function PayContent() {
  const searchParams = useSearchParams()
  const receiverUpi = searchParams.get('receiver_upi') || searchParams.get('pa') || 'abc@upiguard'
  const amount = searchParams.get('amount') || searchParams.get('am') || '5000'
  const note = searchParams.get('note') || searchParams.get('tn') || 'Electronics Purchase'
  const source = (searchParams.get('source') as any) || 'QR'

  return (
    <div className="min-h-screen bg-[#06101D] text-[#EEF8F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-semibold">UPIGuard AI Simulator Active</span>
          </div>
        </div>

        {/* Unified Payment Experience */}
        <UPIGuardPaymentFlow
          initialRecipientUpi={receiverUpi}
          initialAmount={amount}
          initialNote={note}
          source={source}
        />
      </div>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06101D] text-white flex items-center justify-center">Loading Payment Engine...</div>}>
      <PayContent />
    </Suspense>
  )
}
