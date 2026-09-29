'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, Share2, Copy, Check, Sparkles } from 'lucide-react'
import { MerchantLayout } from '@/components/layout/merchant-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export default function MerchantQrPage() {
  const { accounts, activeMerchantUpi } = useUPIGuardStore()
  const merchant = accounts[activeMerchantUpi] || accounts['abc@upiguard']

  const [qrType, setQrType] = useState<'static' | 'dynamic'>('static')
  const [customAmount, setCustomAmount] = useState('500')
  const [customNote, setCustomNote] = useState('Store Purchase')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const payload = qrType === 'static'
    ? `upi://pay?pa=${encodeURIComponent(merchant.upiId)}&pn=${encodeURIComponent(merchant.name)}&cu=INR`
    : `upi://pay?pa=${encodeURIComponent(merchant.upiId)}&pn=${encodeURIComponent(merchant.name)}&am=${customAmount}&cu=INR&tn=${encodeURIComponent(customNote)}`

  useEffect(() => {
    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: { dark: '#06101D', light: '#FFFFFF' }
    }).then(setQrDataUrl)
  }, [payload])

  const handleCopy = () => {
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `${merchant.upiId}-qr.png`
      link.click()
    }
  }

  return (
    <MerchantLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <QrCode className="size-8 text-[#5BD6FF]" />
            Merchant UPI QR Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable counter QR standees or dynamic bill-specific QR codes for {merchant.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 space-y-6 shadow-xl">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">QR Code Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQrType('static')}
                  className={`py-3 px-4 rounded-2xl text-xs font-semibold transition border ${
                    qrType === 'static'
                      ? 'bg-[#438EFF]/20 border-[#5BD6FF] text-[#5BD6FF]'
                      : 'bg-[#06101D] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Static Standee QR
                </button>
                <button
                  onClick={() => setQrType('dynamic')}
                  className={`py-3 px-4 rounded-2xl text-xs font-semibold transition border ${
                    qrType === 'dynamic'
                      ? 'bg-[#438EFF]/20 border-[#5BD6FF] text-[#5BD6FF]'
                      : 'bg-[#06101D] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Dynamic Amount QR
                </button>
              </div>
            </div>

            {qrType === 'dynamic' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount (₹)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-2xl bg-[#06101D] border border-white/10 p-3 text-lg font-bold text-white font-mono focus:border-[#5BD6FF] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bill Note</label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full rounded-2xl bg-[#06101D] border border-white/10 p-3 text-sm text-white focus:border-[#5BD6FF] focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#438EFF] hover:brightness-110 text-[#06101D] font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="size-4" /> Download QR
              </button>
              <button
                onClick={handleCopy}
                className="py-3 px-4 rounded-xl bg-[#0B1B2D] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-medium flex items-center gap-2 transition"
              >
                {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                Copy URI
              </button>
            </div>
          </div>

          {/* QR Standee Preview */}
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-xs p-6 rounded-3xl bg-white shadow-2xl border-4 border-[#5BD6FF]/40 text-[#06101D]">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-[#438EFF] uppercase tracking-wider mb-2 font-mono">
                <Sparkles className="size-4" /> UPIGuard Pay
              </div>
              <h4 className="font-extrabold text-lg text-slate-900">{merchant.name}</h4>
              <p className="text-xs font-mono text-slate-500 mb-4">{merchant.upiId}</p>

              {qrDataUrl && (
                <img src={qrDataUrl} alt="Merchant QR" className="size-52 mx-auto rounded-lg" />
              )}

              {qrType === 'dynamic' && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Amount Due</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    ₹{Number(customAmount).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-semibold">
                Scan with any UPI Simulator App
              </p>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  )
}
