'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Globe,
  Clock,
  QrCode as QrIcon,
  Download,
  Copy,
  Check,
  Share2,
  MapPin,
  Sparkles
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

export default function ProfilePage() {
  const { user, setUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'qr'>('profile')

  // Profile Form States
  const [name, setName] = useState(user?.name || 'Anjan Sharma')
  const [email, setEmail] = useState(user?.email || 'demo@upishield.ai')
  const [mobile, setMobile] = useState('+91 98765 43210')
  const [defaultUpi, setDefaultUpi] = useState('anjan@oksbi')
  const [primaryCity, setPrimaryCity] = useState('Bengaluru')
  const [secondaryCity, setSecondaryCity] = useState('Delhi')
  const [currency] = useState('INR (₹)')
  const [timezone] = useState('Asia/Kolkata (IST)')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // QR Generator States
  const [qrAmount, setQrAmount] = useState('')
  const [qrNote, setQrNote] = useState('Payment for UPI Shield')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user?.name) setName(user.name)
    if (user?.email) setEmail(user.email)
  }, [user])

  // Construct NPCI standard UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(defaultUpi)}&pn=${encodeURIComponent(
    name
  )}${qrAmount ? `&am=${encodeURIComponent(qrAmount)}` : ''}&cu=INR${
    qrNote ? `&tn=${encodeURIComponent(qrNote)}` : ''
  }`

  useEffect(() => {
    async function generateCode() {
      if (!defaultUpi) return
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
  }, [upiUri, defaultUpi])

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
    link.download = `UPI-QR-${defaultUpi.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    link.click()
  }

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      if (user?.id) {
        await apiRequest(`/users/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, mobile })
        })
      }
      setUser({
        ...(user || { id: 1, email: 'demo@upishield.ai', role: 'user', status: 'active' }),
        name,
        email
      })
      setMessage('Profile and location safety preferences updated successfully.')
    } catch {
      setUser({
        ...(user || { id: 1, email: 'demo@upishield.ai', role: 'user', status: 'active' }),
        name,
        email
      })
      setMessage('Profile settings saved locally.')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <UserIcon className="size-7 text-[#b8f55e]" />
              <MotionWordReveal text="Account & Personal QR" delay={0.1} />
            </h1>
            <MotionFadeUp delay={0.2}>
              <p className="text-[#8fa9a6] text-xs sm:text-sm mt-1">
                Manage your identity verification, registered travel regions, and receive payments with custom UPI QR.
              </p>
            </MotionFadeUp>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 rounded-2xl bg-[#0a1718] border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-[#b8f55e] text-[#09110f] shadow-md shadow-[#b8f55e]/20'
                  : 'text-[#8fa9a6] hover:text-white'
              }`}
            >
              <UserIcon className="size-3.5" />
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                activeTab === 'qr'
                  ? 'bg-[#b8f55e] text-[#09110f] shadow-md shadow-[#b8f55e]/20'
                  : 'text-[#8fa9a6] hover:text-white'
              }`}
            >
              <QrIcon className="size-3.5" />
              Generate My UPI QR
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* TAB 1: EDIT PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmitProfile} className="space-y-6">
            {/* Identity Card */}
            <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
              <div className="relative">
                <div className="size-20 rounded-2xl bg-[#071014] border border-white/10 flex items-center justify-center text-[#b8f55e] text-2xl font-bold font-mono">
                  {name.charAt(0) || 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-[#0a1718] flex items-center justify-center">
                  <Check className="size-3 text-[#09110f]" />
                </div>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-lg font-bold text-white">{name}</h2>
                <p className="text-xs text-[#8fa9a6] font-mono">{email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#b8f55e]/10 border border-[#b8f55e]/20 text-[#b8f55e] text-[11px] font-semibold mt-1">
                  <ShieldCheck className="size-3.5" />
                  Deterministic Identity Verified
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-5 shadow-xl">
              <h3 className="text-sm font-semibold text-white border-b border-white/5 pb-3">
                Profile Credentials & Financial Endpoints
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Full Legal Name</label>
                  <div className="relative">
                    <UserIcon className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                    />
                  </div>
                  <span className="text-[10px] text-[#556d6a] mt-1 block">Unified demo address: demo@upishield.ai</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Default VPA / UPI ID</label>
                  <div className="relative">
                    <CreditCard className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultUpi}
                      onChange={(e) => setDefaultUpi(e.target.value)}
                      className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Primary Registered City (Home Base)</label>
                  <div className="relative">
                    <MapPin className="size-4 text-[#b8f55e] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={primaryCity}
                      onChange={(e) => setPrimaryCity(e.target.value)}
                      className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                    />
                  </div>
                  <span className="text-[10px] text-[#556d6a] mt-1 block">Used by impossible travel and geo-fence velocity checks</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Secondary Frequent City</label>
                  <div className="relative">
                    <MapPin className="size-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={secondaryCity}
                      onChange={(e) => setSecondaryCity(e.target.value)}
                      className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                    />
                  </div>
                  <span className="text-[10px] text-[#556d6a] mt-1 block">Permitted location: bypasses unfamiliar location alerts</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">Accounting Currency</label>
                  <div className="relative">
                    <Globe className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={currency}
                      disabled
                      className="w-full bg-[#071014]/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-2">System Timezone</label>
                  <div className="relative">
                    <Clock className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={timezone}
                      disabled
                      className="w-full bg-[#071014]/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#b8f55e] text-[#09110f] font-bold text-xs hover:brightness-110 transition flex items-center gap-2 shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
              >
                <Save className="size-3.5" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: GENERATE MY UPI QR */}
        {activeTab === 'qr' && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* QR Form Controls */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-5 shadow-xl">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#b8f55e]">QR CONFIGURATION</span>
                <h3 className="text-base font-bold text-white mt-1">Receive Payments Instantly</h3>
                <p className="text-xs text-[#8fa9a6] mt-0.5">
                  Standard NPCI Bharat QR format supported by Google Pay, PhonePe, Paytm, and BHIM.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-1.5">Receiving UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={defaultUpi}
                    onChange={(e) => setDefaultUpi(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/15 bg-[#071014] px-4 font-mono text-white focus:outline-none focus:border-[#b8f55e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-1.5">Preset Amount (Optional INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8fa9a6]">₹</span>
                    <input
                      type="number"
                      placeholder="Leave blank for any amount"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/15 bg-[#071014] pl-8 pr-4 font-mono text-white focus:outline-none focus:border-[#b8f55e]"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['100', '500', '1000', '2500'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQrAmount(val)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-[#c3d5d2] transition border border-white/10 font-mono"
                      >
                        ₹{val}
                      </button>
                    ))}
                    {qrAmount && (
                      <button
                        type="button"
                        onClick={() => setQrAmount('')}
                        className="px-2 py-1 text-[10px] text-rose-400 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8fa9a6] mb-1.5">Transaction Note / Purpose</label>
                  <input
                    type="text"
                    value={qrNote}
                    onChange={(e) => setQrNote(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/15 bg-[#071014] px-4 text-white focus:outline-none focus:border-[#b8f55e]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full py-2.5 rounded-xl bg-[#b8f55e] text-[#09110f] font-bold text-xs hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-[#b8f55e]/20"
                >
                  <Download className="size-4" />
                  Download High-Res QR (PNG)
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="size-4 text-[#b8f55e]" /> : <Copy className="size-4 text-[#8fa9a6]" />}
                  {copied ? 'UPI Link Copied!' : 'Copy UPI Intent URI'}
                </button>
              </div>
            </div>

            {/* QR Card Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#b8f55e]/10 blur-3xl" />

              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8fa9a6]">BHARAT UPI QR</span>
              <p className="text-sm font-semibold text-white mt-1">{name}</p>
              <p className="text-xs text-[#b8f55e] font-mono mt-0.5">{defaultUpi}</p>

              {qrDataUrl ? (
                <div className="my-6 p-4 rounded-3xl bg-white shadow-2xl ring-4 ring-[#b8f55e]/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="UPI QR Code" className="size-52 object-contain" />
                </div>
              ) : (
                <div className="my-6 size-52 rounded-3xl bg-white/5 border border-white/10 grid place-items-center">
                  <span className="text-xs text-[#8fa9a6]">Generating QR...</span>
                </div>
              )}

              {qrAmount && (
                <div className="px-3.5 py-1.5 rounded-full bg-[#b8f55e]/15 border border-[#b8f55e]/30 text-xs font-bold text-[#b8f55e] font-mono">
                  Fixed Amount: ₹{Number(qrAmount).toLocaleString('en-IN')}
                </div>
              )}

              <p className="text-[11px] text-[#8fa9a6] mt-4 max-w-xs">
                Scan with Google Pay, PhonePe, Paytm, CRED or any UPI app.
              </p>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
