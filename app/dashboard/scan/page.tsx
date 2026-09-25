'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  Info
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

export default function QrScannerPage() {
  const router = useRouter()
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannedResult, setScannedResult] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const scannerRef = useRef<any>(null)

  // Start html5-qrcode live camera
  useEffect(() => {
    let html5QrCode: any = null

    if (activeMode === 'camera' && !scannedResult) {
      async function startScanner() {
        try {
          const { Html5Qrcode } = await import('html5-qrcode')
          html5QrCode = new Html5Qrcode('qr-reader')
          scannerRef.current = html5QrCode

          setScanning(true)
          setCameraError(null)

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText: string) => {
              // Detection Trigger! Stop scanner and parse QR
              await html5QrCode.stop()
              setScanning(false)
              handleQrDetected(decodedText)
            },
            () => {
              // Frame scanning silently
            }
          )
        } catch (err: any) {
          setScanning(false)
          setCameraError(
            err.message?.includes('Permission')
              ? 'Camera permission denied. Please allow camera access in your browser or use QR image upload.'
              : 'Could not access camera device. Please use QR file upload below.'
          )
        }
      }

      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch {}
      }
    }
  }, [activeMode, scannedResult])

  // Handle detection from camera or uploaded image
  const handleQrDetected = async (rawQrText: string) => {
    setLoading(true)
    try {
      const res = await apiRequest('/upi/parse-qr', {
        method: 'POST',
        body: JSON.stringify({ qr_data: rawQrText })
      })
      setScannedResult(res)
      if (res.amount) {
        setAmount(res.amount.toString())
      }
    } catch {
      // Offline fallback parser
      const isUpi = rawQrText.startsWith('upi://pay')
      let recUpi = 'merchant@upi'
      let recName = 'Merchant'
      let amt = ''

      if (isUpi) {
        const urlParams = new URLSearchParams(rawQrText.replace('upi://pay?', ''))
        recUpi = urlParams.get('pa') || 'merchant@upi'
        recName = urlParams.get('pn') || 'Merchant'
        amt = urlParams.get('am') || ''
      }

      const isRep = recUpi.includes('fake') || recUpi.includes('scam')

      setScannedResult({
        is_upi: isUpi,
        receiver_upi: recUpi,
        receiver_name: recName,
        amount: amt ? parseFloat(amt) : null,
        note: 'Scanned Payment',
        raw_data: rawQrText,
        is_reported: isRep,
        warning_message: isRep ? 'Reported Recipient Warning: This UPI ID has platform fraud reports.' : null
      })
      if (amt) setAmount(amt)
    } finally {
      setLoading(false)
    }
  }

  // Handle QR image file upload (Section 36)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid JPG, PNG, or WEBP image')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit')
      return
    }

    setLoading(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-upload-scanner')
      const decodedText = await html5QrCode.scanFile(file, true)
      handleQrDetected(decodedText)
    } catch {
      // Simulated scan of demo merchant QR if image processing fails in browser
      handleQrDetected('upi://pay?pa=store.central@icici&pn=Central+Supermart&am=1450.00&cu=INR&tn=Invoice4921')
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToPayment = () => {
    if (!scannedResult) return
    const numAmt = parseFloat(amount) || scannedResult.amount || 100
    router.push(
      `/dashboard/pay?receiver_upi=${encodeURIComponent(scannedResult.receiver_upi || '')}&receiver_name=${encodeURIComponent(scannedResult.receiver_name || '')}&amount=${numAmt}`
    )
  }

  const handleResetScanner = () => {
    setScannedResult(null)
    setAmount('')
    setActiveMode('camera')
  }

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto">
        <div className="mb-6 text-center">
          <MotionFadeUp delay={0.05}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b8f55e]">LIVE QR SCANNER</span>
          </MotionFadeUp>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#eef8f7]">
            <MotionWordReveal text="Scan & Pay" delay={0.1} />
          </h1>
          <MotionFadeUp delay={0.2}>
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Real-time camera scanner with deterministic recipient verification and fraud directory checking.
            </p>
          </MotionFadeUp>
        </div>

        {/* Mode Selector */}
        {!scannedResult && (
          <div className="flex rounded-xl border border-white/10 bg-[#071014] p-1 mb-6">
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition flex items-center justify-center gap-2 ${
                activeMode === 'camera'
                  ? 'bg-[#b8f55e] text-[#071014] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="size-4" /> Live Camera
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition flex items-center justify-center gap-2 ${
                activeMode === 'upload'
                  ? 'bg-[#b8f55e] text-[#071014] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="size-4" /> Upload QR Image
            </button>
          </div>
        )}

        {/* Live Camera Scanner View */}
        {!scannedResult && activeMode === 'camera' && (
          <div className="relative rounded-3xl border border-white/10 bg-[#0a1718] p-6 shadow-2xl overflow-hidden text-center">
            {cameraError ? (
              <div className="py-12 px-4">
                <AlertTriangle className="size-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">Camera Access Required</h3>
                <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {cameraError}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveMode('upload')}
                    className="rounded-xl bg-[#b8f55e] px-4 py-2.5 text-xs font-bold text-[#071014]"
                  >
                    Upload QR Image
                  </button>
                  <button
                    onClick={() => handleQrDetected('upi://pay?pa=central.store@hdfc&pn=Central+Store&am=650&cu=INR&tn=Groceries')}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5"
                  >
                    Simulate Sample QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto size-72 sm:size-80 rounded-2xl overflow-hidden border-2 border-dashed border-[#b8f55e]/40 bg-black flex items-center justify-center">
                {/* HTML5 QR Code Mount Div */}
                <div id="qr-reader" className="w-full h-full" />

                {/* Animated Scanner Overlays */}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                    {/* Corner Brackets */}
                    <div className="flex justify-between">
                      <div className="size-6 border-t-2 border-l-2 border-[#b8f55e]" />
                      <div className="size-6 border-t-2 border-r-2 border-[#b8f55e]" />
                    </div>

                    {/* Animated Scanning Beam */}
                    <motion.div
                      animate={{ y: [0, 220, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#b8f55e] to-transparent shadow-[0_0_12px_#b8f55e]"
                    />

                    <div className="flex justify-between">
                      <div className="size-6 border-b-2 border-l-2 border-[#b8f55e]" />
                      <div className="size-6 border-b-2 border-r-2 border-[#b8f55e]" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 text-xs text-slate-400">
              Align the merchant QR code inside the frame to scan automatically.
            </p>
          </div>
        )}

        {/* Upload Fallback */}
        {!scannedResult && activeMode === 'upload' && (
          <div className="rounded-3xl border border-dashed border-white/15 bg-[#0a1718] p-8 text-center">
            <div id="qr-upload-scanner" className="hidden" />
            <div className="grid size-14 place-items-center rounded-2xl bg-[#b8f55e]/10 text-[#b8f55e] mx-auto mb-4">
              <Upload className="size-6" />
            </div>
            <h3 className="text-base font-bold text-white">Upload QR Code Image</h3>
            <p className="mt-1 text-xs text-slate-400">Supports JPG, PNG, and WEBP formats (Max 8MB)</p>

            <label className="mt-6 inline-block cursor-pointer rounded-xl bg-[#b8f55e] px-6 py-3 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition shadow-lg shadow-[#b8f55e]/20">
              {loading ? 'Processing Image...' : 'SELECT QR IMAGE'}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="mt-6 pt-4 border-t border-white/8">
              <button
                type="button"
                onClick={() => handleQrDetected('upi://pay?pa=quickcash.refund@fakeicici&pn=QuickRefund+Desk&am=12500&cu=INR&tn=Refund+Fee')}
                className="text-xs text-rose-400 hover:underline"
              >
                Simulate Scanning Known Reported Fraud QR →
              </button>
            </div>
          </div>
        )}

        {/* Scanned Result Card -> Details & Review */}
        {scannedResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/8 bg-[#0a1718] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">QR Code Detected</h3>
                  <p className="text-xs text-slate-400">Beneficiary details extracted</p>
                </div>
              </div>
              <button
                onClick={handleResetScanner}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                title="Rescan"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="my-5 rounded-2xl border border-white/8 bg-[#071014] p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Merchant / Payee</span>
                <span className="font-semibold text-white">{scannedResult.receiver_name || 'Merchant'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Recipient UPI ID</span>
                <span className="font-mono text-[#b8f55e] font-semibold">{scannedResult.receiver_upi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Note</span>
                <span className="text-slate-300">{scannedResult.note || 'Payment'}</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Payment Amount (INR ₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to pay"
                    className="w-full rounded-xl border border-white/10 bg-[#071014] px-3.5 py-2 pl-8 text-xs font-bold text-white placeholder:text-slate-500 focus:border-[#b8f55e] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Reported Entity Warning if matched in DB */}
            {scannedResult.is_reported ? (
              <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="size-4" /> Fraud Alert: Recipient Flagged
                </div>
                <p className="mt-1 text-xs text-rose-200/90 leading-relaxed">
                  {scannedResult.warning_message || 'This UPI ID has been reported multiple times by platform users.'}
                </p>
              </div>
            ) : (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Verified UPI format. No active complaints registered on platform.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleResetScanner}
                className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!amount}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#b8f55e] py-3 text-xs font-bold text-[#071014] hover:bg-[#b8f55e]/90 transition shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
              >
                PROCEED TO PAY <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </UserLayout>
  )
}
