'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  QrCode,
  Download,
  Copy,
  Share2,
  Check,
  Sparkles,
  Smartphone
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

export default function QrGeneratorPage() {
  const [upiId, setUpiId] = useState('anjan@oksbi')
  const [name, setName] = useState('Anjan Sharma')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('Payment for UPI Shield')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  // Construct NPCI standard UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    name
  )}${amount ? `&am=${encodeURIComponent(amount)}` : ''}&cu=INR${
    note ? `&tn=${encodeURIComponent(note)}` : ''
  }`

  useEffect(() => {
    async function generateCode() {
      if (!upiId) return
      try {
        const url = await QRCode.toDataURL(upiUri, {
          width: 320,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error('Failed to generate QR code', err)
      }
    }
    generateCode()
  }, [upiUri, upiId])

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiUri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `UPI-QR-${upiId.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    link.click()
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `UPI Payment QR for ${name}`,
          text: `Pay ₹${amount || ''} to ${name} via UPI (${upiId})`,
          url: upiUri
        })
      } catch {}
    } else {
      handleCopyLink()
    }
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <MotionFadeUp delay={0.05}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b8f55e]">RECEIVE PAYMENTS</span>
          </MotionFadeUp>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#eef8f7]">
            <MotionWordReveal text="Generate UPI QR Code" delay={0.1} />
          </h1>
          <MotionFadeUp delay={0.2}>
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Create standard NPCI-compliant UPI payment QR codes with custom preset amounts and notes.
            </p>
          </MotionFadeUp>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Configuration Form */}
          <div className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">QR Code Parameters</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your UPI ID <span className="text-[#b8f55e]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bank"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name or Business"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Preset Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Leave empty for user-entered amount"
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 pl-8 text-xs font-bold text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Consulting, Freelance fee"
                  className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400 flex items-center gap-2">
                <Smartphone className="size-4 text-[#b8f55e] shrink-0" />
                <span>
                  Any banking app (GPay, PhonePe, Paytm, BHIM) scanning this QR will automatically load your details.
                </span>
              </div>
            </div>
          </div>

          {/* QR Preview & Action Buttons */}
          <div className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="rounded-2xl border-4 border-white/20 bg-white p-4 shadow-2xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Generated UPI QR"
                  className="size-56 sm:size-64 object-contain rounded-lg"
                />
              ) : (
                <div className="size-56 sm:size-64 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-bold text-white">{name || 'Beneficiary'}</p>
              <p className="text-xs font-mono text-[#b8f55e]">{upiId}</p>
              {amount && <p className="text-base font-extrabold text-white mt-1">₹{parseFloat(amount).toLocaleString('en-IN')}</p>}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition shadow-md shadow-[#b8f55e]/20"
              >
                <Download className="size-3.5" /> Download QR
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#071014] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/5 transition"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#071014] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/5 transition"
              >
                <Share2 className="size-3.5" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
