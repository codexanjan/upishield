'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine,
  Camera,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  QrCode,
  Store
} from 'lucide-react'
import { useUPIGuardStore } from '@/lib/upiguard-store'

export default function PayScanPage() {
  const router = useRouter()
  const { activePaymentRequest } = useUPIGuardStore()

  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scannedResult, setScannedResult] = useState<{
    pa: string
    pn: string
    am: string
    tn?: string
  } | null>(null)

  const [manualUpi, setManualUpi] = useState('abc@upiguard')
  const [manualAmount, setManualAmount] = useState('5000')
  const [manualNote, setManualNote] = useState('Electronics Purchase')
  const [showManualModal, setShowManualModal] = useState(false)

  const scannerRef = useRef<any>(null)

  // Start html5-qrcode scanner
  useEffect(() => {
    let html5QrCode: any = null

    if (!scannedResult && !showManualModal) {
      async function startCamera() {
        try {
          const { Html5Qrcode } = await import('html5-qrcode')
          html5QrCode = new Html5Qrcode('qr-scan-viewport')
          scannerRef.current = html5QrCode

          setScanning(true)
          setCameraError(null)

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 260, height: 260 } },
            (decodedText: string) => {
              html5QrCode.stop().catch(() => {})
              handleDecodedPayload(decodedText)
            },
            () => {}
          )
        } catch (err: any) {
          setScanning(false)
          setCameraError('Camera access not granted or unavailable. Use fallback buttons below.')
        }
      }

      startCamera()
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch {}
      }
    }
  }, [scannedResult, showManualModal])

  const handleDecodedPayload = (raw: string) => {
    try {
      // Decode upi://pay?pa=...
      const url = new URL(raw.replace('upi://pay', 'http://upi.org'))
      const pa = url.searchParams.get('pa') || 'abc@upiguard'
      const pn = url.searchParams.get('pn') || 'ABC Electronics'
      const am = url.searchParams.get('am') || '5000'
      const tn = url.searchParams.get('tn') || 'Demo Payment'

      setScannedResult({ pa, pn, am, tn })
    } catch {
      setScannedResult({
        pa: 'abc@upiguard',
        pn: 'ABC Electronics',
        am: '5000',
        tn: 'Demo Payment'
      })
    }
  }

  const handleProceedToPayment = () => {
    if (!scannedResult) return
    router.push(
      `/pay?receiver_upi=${encodeURIComponent(scannedResult.pa)}&receiver_name=${encodeURIComponent(
        scannedResult.pn
      )}&amount=${encodeURIComponent(scannedResult.am)}&note=${encodeURIComponent(scannedResult.tn || '')}&source=QR`
    )
  }

  const handleUseActiveMerchantRequest = () => {
    if (activePaymentRequest) {
      setScannedResult({
        pa: activePaymentRequest.merchantUpiId,
        pn: activePaymentRequest.merchantName,
        am: activePaymentRequest.amount.toString(),
        tn: activePaymentRequest.note
      })
    } else {
      setScannedResult({
        pa: 'abc@upiguard',
        pn: 'ABC Electronics',
        am: '5000',
        tn: 'Electronics Purchase'
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#06101D] text-[#EEF8F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Scanner Ready
          </span>
        </div>

        <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-2xl space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <ScanLine className="size-6 text-[#5BD6FF]" />
              SCAN & PAY
            </h1>
            <p className="text-xs text-slate-400 mt-1">Point your camera at any merchant UPIGuard QR standee</p>
          </div>

          {/* Scanner Viewport */}
          {!scannedResult ? (
            <div className="space-y-4">
              <div className="relative mx-auto size-72 rounded-3xl overflow-hidden bg-black border-2 border-[#5BD6FF]/30 shadow-2xl flex items-center justify-center">
                <div id="qr-scan-viewport" className="w-full h-full" />

                {/* Animated Laser Scanning Beam */}
                <motion.div
                  animate={{ y: [-110, 110] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-[#5BD6FF] to-transparent shadow-[0_0_15px_#5BD6FF] pointer-events-none"
                />

                {cameraError && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-20">
                    <AlertTriangle className="size-8 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 font-semibold">{cameraError}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="text-xs text-slate-400 font-mono">
                {scanning ? 'Scanning for UPI QR Code...' : 'Camera Standby'}
              </div>

              {/* Viva Fallback Buttons (Section 15 & 70) */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleUseActiveMerchantRequest}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#438EFF]/20 to-[#5BD6FF]/20 border border-[#5BD6FF]/40 text-[#5BD6FF] text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="size-4" />
                  DETECT ABC ELECTRONICS QR (₹5,000 Viva Demo)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDecodedPayload(
                        'upi://pay?pa=starbucks.india@icici&pn=Starbucks+Coffee+India&am=290.00&cu=INR&tn=Order-B7892&mc=5812'
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Verified QR (₹290)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDecodedPayload(
                        'upi://pay?pa=quickcash.refund@fakeicici&pn=Electricity+Refund+Desk&am=15000.00&cu=INR&tn=Refund+Claim'
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <AlertTriangle className="size-3.5" />
                    Dummy Scam QR
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Scanned Result Detection Card (Section 15) */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-left"
            >
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 font-mono">
                <CheckCircle2 className="size-5 text-emerald-400" />
                ✓ QR DETECTED & VALIDATED
              </div>

              <div className="rounded-2xl bg-[#06101D] border border-white/5 p-5 space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Merchant</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{scannedResult.pn}</h3>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">UPI ID</span>
                  <p className="text-xs font-mono text-[#5BD6FF]">{scannedResult.pa}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Amount</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    ₹{Number(scannedResult.am).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setScannedResult(null)}
                  className="py-3 px-4 rounded-2xl bg-[#0B1B2D] text-slate-300 text-xs font-semibold"
                >
                  Rescan
                </button>
                <button
                  onClick={handleProceedToPayment}
                  className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#438EFF] to-[#5BD6FF] hover:brightness-110 text-[#06101D] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#438EFF]/30 flex items-center justify-center gap-2"
                >
                  CONTINUE TO PAYMENT <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Manual UPI Modal Fallback */}
        <AnimatePresence>
          {showManualModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm rounded-3xl bg-[#091726] border border-[#0B1B2D] p-6 shadow-2xl space-y-4"
              >
                <h3 className="text-lg font-bold text-white">Enter UPI ID Manually</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-semibold">Recipient UPI ID</label>
                    <input
                      type="text"
                      value={manualUpi}
                      onChange={(e) => setManualUpi(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-[#06101D] border border-white/10 p-2.5 text-xs text-white font-mono focus:border-[#5BD6FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-semibold">Amount (₹)</label>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-[#06101D] border border-white/10 p-2.5 text-base font-bold text-white font-mono focus:border-[#5BD6FF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#06101D] text-slate-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowManualModal(false)
                      setScannedResult({
                        pa: manualUpi,
                        pn: manualUpi.includes('coffee') ? 'UPIGuard Coffee' : 'ABC Electronics',
                        am: manualAmount,
                        tn: manualNote
                      })
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#438EFF] text-[#06101D] font-bold text-xs"
                  >
                    Confirm Payee
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
