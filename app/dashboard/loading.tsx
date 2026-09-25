'use client'

import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-[#eef8f7]">
      <div className="relative flex flex-col items-center">
        <div className="relative grid size-16 place-items-center">
          <motion.div
            className="absolute inset-0 rounded-2xl border border-[#b8f55e]/30"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          />
          <div className="relative grid size-10 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-lg shadow-[#b8f55e]/25">
            <ShieldCheck className="size-6" />
          </div>
        </div>

        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mt-4 text-xs font-medium text-[#8fa9a6]"
        >
          Loading financial workspace...
        </motion.p>
      </div>
    </div>
  )
}
