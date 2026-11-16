'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MotionWordReveal, MotionFadeUp, MotionBadge, ScrollReveal } from '@/components/motion/animated-text'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  ShieldCheck,
  ArrowUpRight,
  ScanLine,
  Receipt,
  CreditCard,
  ShieldAlert,
  Briefcase,
  Lock,
  ArrowRight,
  Check,
  CheckCircle2,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
  FileCheck2,
  AlertTriangle,
  Fingerprint,
  Camera,
  Cpu,
  Globe2,
  Terminal,
  Zap
} from 'lucide-react'
import { CyberShieldIntro } from '@/components/intro/cyber-shield-intro'

const features = [
  {
    icon: ShieldCheck,
    title: 'Deterministic Rule Engine',
    description: 'Sub-10ms mathematical risk assessment. Zero hallucination, strict bank-grade boundary enforcement on every rupee.',
  },
  {
    icon: Fingerprint,
    title: 'Multi-Factor Biometric Defense',
    description: 'Two-tier verification pairing 4-digit UPI PIN with live facial mesh geometry and capacitive fingerprint scans.',
  },
  {
    icon: Globe2,
    title: 'Watermark-Free Geospatial Engine',
    description: 'Zero-watermark high-resolution telemetry mapping. Tracks velocity conflicts, impossible travel, and international POS alerts.',
  },
  {
    icon: ScanLine,
    title: 'Hardware QR Scanner & Parser',
    description: 'Direct browser camera scanner with instant URI parsing, merchant authenticity verification, and fraud database cross-checks.',
  },
  {
    icon: Receipt,
    title: 'Expense & Budget Intel',
    description: 'Track spending across 16 categories, calculate velocity averages, and enforce real-time threshold guardrails.',
  },
  {
    icon: ShieldAlert,
    title: 'Dispute Desk & Audit Trail',
    description: 'Instant SOC dispute dispatch with one-click node isolation, incident evidence logging, and immutable audit resolution.',
  },
]

const steps = [
  { step: '01', title: 'INTENT INGESTION', desc: 'Scan Bharat/UPI QR or initiate verified VPA transaction intent.' },
  { step: '02', title: 'DETERMINISTIC AUDIT', desc: 'Real-time rule engine evaluates velocity, foreign device, and geographic delta.' },
  { step: '03', title: 'BIOMETRIC MULTI-FACTOR', desc: 'Layer 1 UPI PIN followed by Layer 2 Face & Fingerprint verification.' },
  { step: '04', title: 'SETTLEMENT & AUDIT', desc: 'Instant bank-grade settlement with cryptographic ledger logging.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#071014] text-[#eef8f7] selection:bg-emerald-500/30 overflow-x-hidden font-sans">
      <CyberShieldIntro />
      {/* Background Ambient Glows (Dark Mode Only) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden">
        <div className="absolute -top-32 left-1/4 size-[550px] rounded-full bg-[#b8f55e]/10 blur-[140px]" />
        <div className="absolute top-[35%] -right-28 size-[500px] rounded-full bg-[#10b981]/10 blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 size-[450px] rounded-full bg-[#b8f55e]/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#b8f55e_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      {/* 1. Header / Navbar (Clean, Minimal, No Send UPI) */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#071014]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-lg shadow-[#b8f55e]/25 group-hover:scale-105 transition">
              <ShieldCheck className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-[.18em] text-white">
                UPI SHIELD <span className="text-[#b8f55e]">AI</span>
              </span>
              <span className="text-[9px] font-mono text-[#8fa9a6] tracking-wider">SOVEREIGN FINANCIAL DEFENSE</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#8fa9a6]">
            <a href="#hero" className="hover:text-white transition">Platform</a>
            <a href="#features" className="hover:text-white transition">Capabilities</a>
            <a href="#how-it-works" className="hover:text-white transition">Security Protocol</a>
            <Link href="/docs" className="text-[#b8f55e] hover:brightness-110 transition">API Docs</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <Link
              href="/admin/login"
              className="rounded-xl border border-rose-500/40 bg-rose-600/20 px-4 py-2 text-xs font-bold text-rose-800 dark:text-rose-200 hover:bg-rose-600 hover:text-white transition shadow-lg shadow-rose-950/40"
            >
              Admin Login
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-extrabold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/25 flex items-center gap-1.5"
            >
              <span>User Panel</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Minimal, High-Design, Futuristic) */}
      <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <MotionBadge className="rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-4 py-1.5 text-xs font-semibold text-[#b8f55e]">
              <ShieldCheck className="size-3.5" />
              <span>Deterministic Sovereign Defense · Bharat Financial Rails</span>
            </MotionBadge>

            <h1 className="text-4xl sm:text-6xl font-medium tracking-[-0.04em] leading-[1.08] text-[#eef8f7]">
              <MotionWordReveal text="Secure every payment." delay={0.05} />
              <br />
              <MotionWordReveal
                text="Protect every rupee."
                highlightWord="rupee"
                highlightClassName="text-[#b8f55e]"
                delay={0.25}
              />
            </h1>

            <MotionFadeUp delay={0.35}>
              <p className="text-base sm:text-lg leading-relaxed text-[#91a8a7] max-w-xl font-normal">
                UPI Shield AI delivers zero-latency deterministic fraud containment, hardware biometric authorization, and sovereign ledger tracking engineered for India&apos;s digital payment infrastructure.
              </p>
            </MotionFadeUp>

            <MotionFadeUp delay={0.45} className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#b8f55e] px-7 py-3.5 text-sm font-extrabold text-[#09110f] hover:brightness-110 transition shadow-xl shadow-[#b8f55e]/30"
              >
                <span>Enter User Panel</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-600/20 hover:bg-rose-600/35 text-rose-800 dark:text-rose-200 px-6 py-3.5 text-sm font-semibold transition shadow-lg shadow-rose-950/40"
              >
                <Terminal className="size-4 text-rose-600 dark:text-rose-400" />
                <span>Admin SOC Center</span>
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-[#8fa9a6] hover:text-slate-900 dark:hover:text-white transition"
              >
                Documentation <ChevronRight className="size-3.5" />
              </Link>
            </MotionFadeUp>

            <MotionFadeUp delay={0.55} className="pt-8 border-t border-white/8 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p className="text-2xl font-black text-[#b8f55e] tracking-tight font-mono">0 ms</p>
                <p className="text-xs text-[#8fa9a6] mt-0.5 font-medium">Real-Time Evaluation</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white tracking-tight font-mono">0.00%</p>
                <p className="text-xs text-[#8fa9a6] mt-0.5 font-medium">Zero False Halt</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400 tracking-tight font-mono">₹0 Zero</p>
                <p className="text-xs text-[#8fa9a6] mt-0.5 font-medium">Liability Guarantee</p>
              </div>
            </MotionFadeUp>
          </div>

          {/* Right Column: Sleek Holographic Security Matrix HUD */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl border border-[#b8f55e]/20 bg-[#0a1718]/90 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#b8f55e]/10 rounded-full blur-2xl pointer-events-none" />

              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-[#b8f55e] animate-ping" />
                  <span className="text-xs font-mono font-bold tracking-widest text-[#b8f55e] uppercase">
                    SYSTEM STATUS: ARMED
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8fa9a6] px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  BUILD v2.4.0
                </span>
              </div>

              {/* Security Telemetry Modules */}
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Cpu className="size-4 text-[#b8f55e]" />
                      Deterministic Rule Engine
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#b8f55e] bg-[#b8f55e]/10 px-2 py-0.5 rounded-md">
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8fa9a6] font-mono">
                    <span>Threshold Checks: 12 Active Rules</span>
                    <span className="text-emerald-400">Zero-AI Logic</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-emerald-500 to-[#b8f55e] shadow-[0_0_10px_#b8f55e]" />
                  </div>
                </div>

                {/* Security Enclave Matrix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div className="flex items-center gap-2 text-white text-xs font-bold">
                      <Lock className="size-3.5 text-[#b8f55e]" />
                      <span>Deterministic Gate</span>
                    </div>
                    <p className="text-[11px] text-[#8fa9a6] mt-1 font-mono">Sub-Millisecond Check</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">
                      ✓ Active Defense
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#b8f55e]/20 bg-[#b8f55e]/5 p-3.5">
                    <div className="flex items-center gap-2 text-[#b8f55e] text-xs font-bold">
                      <Fingerprint className="size-3.5" />
                      <span>Biometric Enclave</span>
                    </div>
                    <p className="text-[11px] text-white/80 mt-1 font-mono">Hardware Authentication</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#b8f55e]">
                      ✓ Sovereign Key
                    </span>
                  </div>
                </div>

                {/* Spatial Engine Badge */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Globe2 className="size-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Geospatial Telemetry</h4>
                      <p className="text-[10px] text-[#8fa9a6] font-mono">Clean ESRI & Satellite Canvas</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    Watermark-Free
                  </span>
                </div>

                {/* Direct Action Link to User Panel */}
                <Link
                  href="/login"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 py-3 text-xs font-bold text-slate-900 dark:text-white transition group"
                >
                  <span>Launch Protected Workspace</span>
                  <ArrowRight className="size-3.5 text-emerald-600 dark:text-[#b8f55e] group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Grid (Complete Capabilities) */}
      <section id="features" className="py-20 border-t border-white/8 bg-[#060e12]/50">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal direction="up" className="text-center space-y-3 mb-14">
            <p className="text-xs font-bold tracking-[.22em] text-[#b8f55e] uppercase">
              ENTERPRISE-GRADE CAPABILITIES
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Financial Operating System for India
            </h2>
            <p className="text-xs sm:text-sm text-[#8fa9a6] max-w-xl mx-auto">
              Engineered for genuine payments. Zero-watermark spatial telemetry, multi-factor biometric protection, hardware QR scanning, and administrative SOC workspaces.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <ScrollReveal
                  key={feat.title}
                  delay={idx * 0.08}
                  className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 hover:border-[#b8f55e]/30 transition group"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-[#b8f55e]/10 text-[#b8f55e] border border-[#b8f55e]/20 group-hover:scale-105 transition">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mt-4">{feat.title}</h3>
                  <p className="text-xs text-[#8fa9a6] mt-2 leading-relaxed">{feat.description}</p>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Security Flow (Zero-AI Pipeline) */}
      <section id="how-it-works" className="py-20 border-t border-white/8">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal direction="up" className="text-center space-y-3 mb-14">
            <p className="text-xs font-bold tracking-[.22em] text-[#b8f55e] uppercase">
              ZERO-AI PIPELINE
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Deterministic Security Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#8fa9a6] max-w-lg mx-auto">
              Every payment passes through four sequential gates before funds can move across the interbank switch.
            </p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <ScrollReveal
                key={s.step}
                delay={idx * 0.1}
                className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 relative hover:border-[#b8f55e]/30 transition"
              >
                <span className="text-3xl font-black text-[#b8f55e]/20 font-mono">{s.step}</span>
                <h4 className="text-sm font-bold text-white mt-2">{s.title}</h4>
                <p className="text-xs text-[#8fa9a6] mt-2 leading-relaxed">{s.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Minimal Modern Call to Action */}
      <section className="py-20 border-t border-white/8 bg-gradient-to-b from-[#0a1718]/40 to-[#071014]">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6">
          <span className="size-12 rounded-2xl bg-[#b8f55e]/10 border border-[#b8f55e]/30 mx-auto flex items-center justify-center text-[#b8f55e]">
            <ShieldCheck className="size-6" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ready to experience sovereign payment security?
          </h2>
          <p className="text-xs sm:text-sm text-[#8fa9a6] max-w-md mx-auto">
            Access your personal protection vault or log in as an administrator to monitor real-time threat telemetry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="rounded-full bg-[#b8f55e] px-7 py-3 text-xs font-extrabold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/25 flex items-center gap-2"
            >
              <span>Open User Panel</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/admin/login"
              className="rounded-full border border-rose-500/40 bg-rose-600/20 text-rose-200 px-6 py-3 text-xs font-bold hover:bg-rose-600 hover:text-white transition shadow-lg shadow-rose-950/40 flex items-center gap-2"
            >
              <Terminal className="size-3.5 text-rose-400" />
              <span>Administrator Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-white/10 bg-[#071014] py-10 text-xs text-[#8fa9a6]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-sm shadow-[#b8f55e]/20">
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-bold tracking-wider text-white">
              UPI SHIELD <span className="text-[#b8f55e]">AI</span>
            </span>
            <span className="text-[11px] text-[#526b68]">· Deterministic Sovereign Financial Defense</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] text-[#8fa9a6]">
            <span className="size-2 rounded-full bg-[#b8f55e] animate-pulse" />
            <span>Zero-AI Architecture · 100% Deterministic Engine Active</span>
          </div>

          <div className="text-[11px] text-[#6f8583]">
            © 2026 UPI Shield AI · Sovereign & Secured
          </div>
        </div>
      </footer>
    </div>
  )
}
