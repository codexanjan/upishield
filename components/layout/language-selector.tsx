'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { SupportedLanguage } from '@/lib/i18n/translations'

interface LanguageSelectorProps {
  compact?: boolean
  className?: string
}

export function LanguageSelector({ compact = false, className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 hover:border-[#b8f55e]/40 hover:bg-white/[0.08] hover:text-white transition shadow-sm ${
          open ? 'border-[#b8f55e]/50 bg-white/[0.08] ring-1 ring-[#b8f55e]/30' : ''
        }`}
        aria-label="Select interface language"
      >
        <Globe className="size-3.5 text-[#b8f55e] transition-transform group-hover:rotate-45" />
        <span className="font-semibold text-white">
          {compact ? currentLanguageInfo.code.toUpperCase() : currentLanguageInfo.nativeName}
        </span>
        {!compact && (
          <span className="hidden xl:inline text-[10px] text-slate-400 font-normal">
            ({currentLanguageInfo.label})
          </span>
        )}
        <ChevronDown
          className={`size-3 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#b8f55e]' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-white/15 bg-[#0b171a]/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/40"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-[#b8f55e]">
                <Sparkles className="size-3" />
                Select Language
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
                8 Languages
              </span>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
              {languages.map((lang) => {
                const isSelected = lang.code === language
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code as SupportedLanguage)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? 'bg-[#b8f55e]/15 text-[#b8f55e] font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white tracking-wide">
                          {lang.nativeName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          · {lang.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate">
                        {lang.subtext}
                      </span>
                    </div>

                    {isSelected ? (
                      <div className="grid size-5 place-items-center rounded-full bg-[#b8f55e] text-[#071014]">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-slate-600">
                        {lang.code}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default LanguageSelector
