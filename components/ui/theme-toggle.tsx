'use client'

import React, { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme/theme-context'

interface ThemeToggleProps {
  className?: string
  variant?: 'icon' | 'badge'
}

export function ThemeToggle({ className = '', variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={`size-9 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-[#819694] opacity-50 ${className}`}
        aria-hidden="true"
      />
    )
  }

  const isLight = theme === 'light'

  if (variant === 'badge') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
          isLight
            ? 'border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50'
            : 'border-white/10 bg-white/[0.04] text-[#819694] hover:text-white hover:bg-white/[0.08]'
        } ${className}`}
        title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
        aria-label={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      >
        {isLight ? (
          <>
            <Moon className="size-3.5 text-amber-600" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="size-3.5 text-amber-400" />
            <span>Light Mode</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative grid size-9 place-items-center rounded-xl border transition shadow-sm ${
        isLight
          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-slate-200'
          : 'border-white/10 bg-white/[0.04] text-[#819694] hover:text-white hover:bg-white/[0.08]'
      } ${className}`}
      title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      aria-label={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
    >
      {isLight ? (
        <Moon className="size-4 text-amber-600 transition-transform duration-200 hover:-rotate-12" />
      ) : (
        <Sun className="size-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      )}
    </button>
  )
}
