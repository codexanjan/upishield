'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Activity } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#071014] text-[#eef8f7]">
      {/* Background radial ambient glow */}
      <div className="pointer-events-none absolute size-96 rounded-full bg-[#b8f55e]/10 blur-[120px]" />

      <div className="relative flex flex-col items-center">
        {/* Animated outer ring */}
        <div className="relative grid size-20 place-items-center">
          <motion.div
            className="absolute inset-0 rounded-2xl border border-[#b8f55e]/30"
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 6, ease: 'linear' }, scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
          />
          <motion.div
            className="absolute inset-2 rounded-xl border border-white/10 bg-[#0a1718]"
            animate={{ scale: [1, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative grid size-12 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-lg shadow-[#b8f55e]/25"
          >
            <ShieldCheck className="size-7" />
          </motion.div>
        </div>

        {/* Brand Label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-6 flex items-center gap-2"
        >
          <span className="font-semibold tracking-[0.2em] text-white text-sm">UPI SHIELD</span>
          <span className="font-bold text-[#b8f55e] text-sm">AI</span>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1 text-xs text-[#8fa9a6]"
        >
          <motion.span
            className="size-1.5 rounded-full bg-[#b8f55e]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
          <span>Verifying security protocols...</span>
        </motion.div>
      </div>
    </div>
  )
}
