'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  showText?: boolean
  className?: string
}

export function AppLogo({ size = 'md', href = '/', showText = true, className = '' }: AppLogoProps) {
  const iconSize = size === 'sm' ? 'size-7' : size === 'lg' ? 'size-11' : 'size-9'
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'

  const content = (
    <div className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* Minimal Vector Shield Glyph */}
      <div className={`relative ${iconSize} shrink-0`}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#10B981] via-[#06B6D4] to-[#B8F55E] opacity-75 blur-sm group-hover:opacity-100 transition duration-300" />
        <div className="relative h-full w-full rounded-xl bg-[#071014] border border-white/15 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 48 48" fill="none" className="w-4/5 h-4/5">
            <path
              d="M24 8L36 13V22C36 29.5 24 36 24 36C24 36 12 29.5 12 22V13L24 8Z"
              stroke="#06B6D4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="rgba(6, 182, 212, 0.12)"
            />
            <path d="M19 20L24 16L29 20" stroke="#B8F55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M29 24L24 28L19 24" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="22" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSize} font-extrabold tracking-tight text-white group-hover:text-[#B8F55E] transition font-sans`}>
              UPI SHIELD
            </span>
            <span className="rounded bg-[#B8F55E] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#071014] tracking-wider">
              AI
            </span>
          </div>
          <span className="text-[9px] font-semibold tracking-wider text-[#8FA9A6] uppercase mt-0.5">
            Interception Engine
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
