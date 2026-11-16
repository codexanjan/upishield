'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ShieldAlert, Cpu, Terminal, Lock, Fingerprint, Globe2, CheckCircle2 } from 'lucide-react'

interface CyberIntroProps {
  onComplete?: () => void
  forceShow?: boolean
}

const BOOT_LOGS = [
  'INITIALIZING SOVEREIGN FINANCIAL CORE...',
  'LINKING BHARAT INTERBANK SWITCH RAILS...',
  'ARMING DETERMINISTIC ZERO-AI RULE ENGINE...',
  'CALIBRATING BIOMETRIC SECURITY ENCLAVE...',
  'MOUNTING WATERMARK-FREE GEOSPATIAL RADAR...',
  'CRYPTOGRAPHIC VAULT INTEGRITY: 100% NOMINAL'
]

export function CyberShieldIntro({ onComplete, forceShow = false }: CyberIntroProps) {
  const [visible, setVisible] = useState(false)
  const [logIndex, setLogIndex] = useState(0)
  const [progress, setProgress] = useState(15)

  useEffect(() => {
    // Check if user already saw intro this session
    try {
      const seen = sessionStorage.getItem('upishield_intro_shown')
      if (!seen || forceShow) {
        setVisible(true)
      } else {
        onComplete?.()
      }
    } catch {
      setVisible(true)
    }
  }, [forceShow, onComplete])

  useEffect(() => {
    if (!visible) return

    // Ultra-fast crisp progress animation (under 750ms total)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 18
      })
    }, 30)

    // Log stepping
    const logInterval = setInterval(() => {
      setLogIndex((prev) => {
        if (prev < BOOT_LOGS.length - 1) return prev + 1
        return prev
      })
    }, 110)

    // Auto complete fast
    const dismissTimer = setTimeout(() => {
      handleDismiss()
    }, 750)

    return () => {
      clearInterval(progressInterval)
      clearInterval(logInterval)
      clearTimeout(dismissTimer)
    }
  }, [visible])

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('upishield_intro_shown', 'true')
    } catch {}
    setVisible(false)
    onComplete?.()
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onClick={handleDismiss}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050c0f] text-white overflow-hidden select-none cursor-pointer"
      >
        {/* Futuristic Ambient Grid & Scanning Rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(#b8f55e_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-[#b8f55e]/10 blur-[130px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full border border-[#b8f55e]/20 animate-ping pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[550px] rounded-full border border-dashed border-[#b8f55e]/15 animate-spin-slow pointer-events-none" />
        </div>

        {/* Central Assembling Shield HUD */}
        <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
          {/* Glowing Holographic Shield Icon */}
          <motion.div
            initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 120 }}
            className="relative size-28 rounded-3xl bg-gradient-to-br from-[#0a1b18] via-[#071317] to-[#04080a] border-2 border-[#b8f55e]/60 p-1 flex items-center justify-center shadow-[0_0_50px_rgba(184,245,94,0.35)] mb-6"
          >
            <div className="size-full rounded-2xl bg-[#0a1e1b] flex items-center justify-center relative overflow-hidden">
              {/* Scanline through icon */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#b8f55e]/20 to-transparent animate-pulse" />
              <ShieldCheck className="size-16 text-[#b8f55e] drop-shadow-[0_0_15px_#b8f55e]" />
            </div>

            {/* Orbiting Tech Nodes */}
            <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#b8f55e] shadow-[0_0_10px_#b8f55e] animate-ping" />
            <span className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </motion.div>

          {/* Title & Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-1"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b8f55e]/15 border border-[#b8f55e]/30 text-[10px] font-mono text-[#b8f55e] uppercase tracking-widest">
              <ShieldCheck className="size-3" /> SOVEREIGN PROTOCOL ARMED
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              UPI SHIELD <span className="text-[#b8f55e]">AI</span>
            </h1>
            <p className="text-xs text-[#8fa9a6] font-mono tracking-wider">
              DETERMINISTIC ZERO-AI FINANCIAL DEFENSE
            </p>
          </motion.div>

          {/* Terminal Boot Log Output */}
          <div className="w-full mt-7 rounded-2xl border border-white/10 bg-[#071014]/90 p-4 shadow-xl text-left font-mono">
            <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-white/5 pb-2 mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="size-3 text-[#b8f55e]" />
                TELEMETRY DIAGNOSTICS
              </span>
              <span className="text-[#b8f55e] font-bold">{progress}%</span>
            </div>

            <div className="h-6 flex items-center">
              <p className="text-[11px] text-slate-300 truncate">
                <span className="text-[#b8f55e] mr-1.5">&gt;</span>
                {BOOT_LOGS[logIndex]}
              </p>
            </div>

            {/* Quantum Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-3">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 via-[#b8f55e] to-teal-400 shadow-[0_0_12px_#b8f55e]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleDismiss}
            className="mt-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white text-[11px] font-mono tracking-wider transition flex items-center gap-1.5"
          >
            <span>SKIP INTRO</span>
            <span>⏭</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

