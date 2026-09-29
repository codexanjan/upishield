'use client'

import { MerchantLayout } from '@/components/layout/merchant-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import { Receipt, CheckCircle2, ShieldCheck, Download, Search } from 'lucide-react'
import { useState } from 'react'

export default function MerchantPaymentsPage() {
  const { accounts, activeMerchantUpi, transactions } = useUPIGuardStore()
  const merchant = accounts[activeMerchantUpi] || accounts['abc@upiguard']
  const [searchTerm, setSearchTerm] = useState('')

  const merchantTxns = transactions.filter((t) => t.receiverUpiId === activeMerchantUpi)
  const filtered = merchantTxns.filter((t) =>
    t.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.senderUpiId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalSettled = merchantTxns.reduce((acc, curr) => acc + (curr.amount || 0), 0)

  return (
    <MerchantLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Receipt className="size-8 text-[#5BD6FF]" />
              Merchant Settlement Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Immutable closed-loop settlement records for {merchant.name} ({merchant.upiId})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#091726] border border-white/10 text-xs">
              <span className="text-slate-400">Total Inflow: </span>
              <strong className="text-emerald-400 font-mono text-sm font-bold">
                ₹{totalSettled.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-[#0B1B2D] bg-[#091726] p-4 flex items-center gap-3">
          <Search className="size-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Transaction Ref, Payer Name, or UPI ID..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#06101D]/50 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Sender / Payer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Auth Method</th>
                  <th className="py-3.5 px-4">Settlement Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-bold text-white">{t.transactionId}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.senderName} <span className="text-slate-500 font-sans text-[11px]">({t.senderUpiId})</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">
                      ₹{t.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        {t.riskLevel} ({t.riskScore}/100)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {t.authMethod ? t.authMethod.replace('_', ' ') + ' + OTP' : 'OTP Verified'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans text-xs">
                        <CheckCircle2 className="size-3.5" /> Settled (Simulated)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {new Date(t.timestamps.settled || t.timestamps.created).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 font-sans">
                      No settlements found. Create a QR request and execute a simulated demo payment to view real-time records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MerchantLayout>
  )
}
