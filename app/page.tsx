'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MotionWordReveal, MotionFadeUp, MotionBadge, ScrollReveal } from '@/components/motion/animated-text'
import {
  ShieldCheck,
  ArrowUpRight,
  Send,
  ScanLine,
  Receipt,
  CreditCard,
  ShieldAlert,
  Briefcase,
  Lock,
  ArrowRight,
  Check,
  CheckCircle2,
  Sliders,
  Users,
  SlidersHorizontal,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
  FileCheck2,
  AlertTriangle
} from 'lucide-react'

const features = [
  {
    icon: Send,
    title: 'UPI Payments & Intents',
    description: 'Instant UPI URI intent generation with verified VPA registry checks and deterministic safety calculations.',
  },
  {
    icon: ScanLine,
    title: 'QR Code Scanner & Parser',
    description: 'Direct browser camera scanner with instant URI parsing and automated platform fraud report matching.',
  },
  {
    icon: Receipt,
    title: 'Expense & Budget Intel',
    description: 'Track spending across 16 categories, calculate daily averages, and enforce color-coded threshold alerts.',
  },
  {
    icon: CreditCard,
    title: 'Masked Card Protection',
    description: 'Secure credit/debit transaction tracking with cross-border warnings and zero CVV/PIN data storage.',
  },
  {
    icon: ShieldAlert,
    title: 'Incident Reporting & Evidence',
    description: 'Submit structured dispute reports with screenshots, auto-assign case numbers, and alert triage teams.',
  },
  {
    icon: Briefcase,
    title: 'Investigation Workspace',
    description: 'Two-way admin communication, status timeline tracking, and full immutable audit trail resolution.',
  },
]

const steps = [
  { step: '01', title: 'SCAN OR INITIATE', desc: 'Scan any Bharat/UPI QR or initiate a direct VPA transfer.' },
  { step: '02', title: 'DETERMINISTIC EVALUATION', desc: 'Rule engine checks community reports, high velocity, and unusual amounts.' },
  { step: '03', title: 'DECISION & EXPLANATION', desc: 'Review clear pass/review flags before completing your transaction.' },
  { step: '04', title: 'EXPENSE & DISPUTE TRAIL', desc: 'Auto-record to category budgets or open structured incident cases with admins.' },
]

export default function LandingPage() {
  const [testAmount, setTestAmount] = useState('12500')
  const [testVpa, setTestVpa] = useState('merchant@upi')

  const parsedAmount = parseFloat(testAmount) || 0
  const isHighRisk = parsedAmount > 20000 || testVpa.includes('scam') || testVpa.includes('fake')
  const isReviewRecommended = parsedAmount > 10000 || isHighRisk
  const riskScore = isHighRisk ? 92 : isReviewRecommended ? 72 : 18

  return (
    <div className="min-h-screen bg-[#071014] text-[#eef8f7] selection:bg-[#b8f55e]/30 overflow-x-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 size-[550px] rounded-full bg-[#b8f55e]/10 blur-[130px]" />
        <div className="absolute top-[35%] -right-28 size-[500px] rounded-full bg-[#578dff]/10 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 size-[450px] rounded-full bg-[#b8f55e]/5 blur-[120px]" />
      </div>

      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#071014]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-lg shadow-[#b8f55e]/20">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-[.18em] text-white">
              UPI SHIELD <span className="text-[#b8f55e]">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#8fa9a6]">
            <a href="#hero" className="hover:text-white transition">Platform</a>
            <a href="#features" className="hover:text-white transition">Capabilities</a>
            <a href="#how-it-works" className="hover:text-white transition">Deterministic Engine</a>
            <a href="#simulator" className="hover:text-white transition">Live Simulator</a>
            <Link href="/docs" className="text-[#b8f55e] hover:brightness-110 transition font-semibold">API Docs</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="rounded-xl border border-[#b8f55e]/30 bg-[#b8f55e]/10 px-3.5 py-2 text-xs font-semibold text-[#b8f55e] hover:bg-[#b8f55e]/20 transition"
            >
              Admin Login
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/12 bg-white/[.04] px-3.5 py-2 text-xs font-medium text-white hover:bg-white/[.08] transition"
            >
              User Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-semibold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              User Signup
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Screenshot 5) */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column with Framer Motion text animations */}
          <div className="lg:col-span-7 space-y-6">
            <MotionBadge className="rounded-full border border-[#b8f55e]/25 bg-[#b8f55e]/10 px-4 py-1.5 text-xs font-medium text-[#b8f55e]">
              <Sparkles className="size-3.5" />
              <span>Deterministic protection for every rupee</span>
            </MotionBadge>

            <h1 className="text-4xl sm:text-6xl font-medium tracking-[-0.04em] leading-[1.08] text-[#eef8f7]">
              <MotionWordReveal text="Secure every payment." delay={0.05} />
              <br />
              <MotionWordReveal
                text="Understand every rupee."
                highlightWord="rupee"
                highlightClassName="text-[#b8f55e]"
                delay={0.25}
              />
            </h1>

            <MotionFadeUp delay={0.35}>
              <p className="text-lg leading-relaxed text-[#91a8a7] max-w-xl">
                UPI Shield provides real-time deterministic fraud screening, ledger-tracked expense intelligence, and verified payment safety in one secure platform.
              </p>
            </MotionFadeUp>

            <MotionFadeUp delay={0.45} className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#b8f55e] px-6 py-3.5 text-sm font-semibold text-[#09110f] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/25"
              >
                User Signup <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-6 py-3.5 text-sm font-medium text-white hover:bg-white/[.08] transition"
              >
                User Login
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-full border border-[#b8f55e]/30 bg-[#b8f55e]/10 px-5 py-3.5 text-sm font-medium text-[#b8f55e] hover:bg-[#b8f55e]/20 transition"
              >
                Admin Login
              </Link>
              <a
                href="#simulator"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-3.5 text-xs text-[#8fa9a6] hover:text-white transition"
              >
                Test Simulator ↓
              </a>
            </MotionFadeUp>

            <MotionFadeUp delay={0.55} className="pt-8 border-t border-white/8 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">12+</p>
                <p className="text-xs text-[#8fa9a6] mt-0.5">Safety Rule Checks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#b8f55e] tracking-tight">&lt; 50 ms</p>
                <p className="text-xs text-[#8fa9a6] mt-0.5">Engine Latency</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">Zero AI</p>
                <p className="text-xs text-[#8fa9a6] mt-0.5">Deterministic Guard</p>
              </div>
            </MotionFadeUp>
          </div>

          {/* Right Column: Live Protection Card (Screenshot 5) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl border border-white/10 bg-[#0a1718]/90 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f8583]">LIVE PROTECTION</p>
                  <p className="text-sm font-medium text-white mt-0.5">Transaction intelligence</p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#b8f55e]/15 px-3 py-1 text-xs font-semibold text-[#b8f55e] border border-[#b8f55e]/20">
                  <span className="size-2 rounded-full bg-[#b8f55e] animate-pulse" />
                  Active
                </div>
              </div>

              {/* Analyzing Payment Box */}
              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f8583]">ANALYZING PAYMENT</p>
                    <p className="text-lg font-semibold text-white mt-1 font-mono">{testVpa}</p>
                    <p className="text-xs text-[#829997] mt-0.5">New recipient · Bengaluru</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f8583]">AMOUNT</p>
                    <p className="text-2xl font-bold text-white mt-1">₹{Number(testAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Scanning Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#829997]">Scanning behavior signals</span>
                    <span className="font-semibold text-[#b8f55e]">91%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[91%] rounded-full bg-[#b8f55e] shadow-[0_0_12px_#b8f55e]" />
                  </div>
                </div>

                {/* 4 Signal Badges */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-xs text-[#d8e6e4]">
                    <Check className="size-3.5 text-[#b8f55e] shrink-0" />
                    <span className="truncate">Identity verified</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-xs text-[#d8e6e4]">
                    <Check className="size-3.5 text-[#b8f55e] shrink-0" />
                    <span className="truncate">Device recognized</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-xs text-[#d8e6e4]">
                    <Check className="size-3.5 text-[#b8f55e] shrink-0" />
                    <span className="truncate">Velocity normal</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                    <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Recipient new</span>
                  </div>
                </div>

                {/* Recommendation Banner */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                      REVIEW RECOMMENDED
                    </p>
                    <p className="text-xs text-[#e0ecea] mt-0.5 font-medium">
                      High amount for this recipient
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-amber-400 leading-none">72</span>
                    <span className="block text-[9px] font-bold tracking-wider text-amber-400/80 mt-0.5">
                      RISK SCORE
                    </span>
                  </div>
                </div>

                {/* Action button in card */}
                <Link
                  href="/dashboard/pay"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/[.06] hover:bg-white/[.1] border border-white/10 py-2.5 text-xs font-semibold text-white transition"
                >
                  Inspect in User Portal <ArrowRight className="size-3.5 text-[#b8f55e]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Payment Simulator */}
      <section id="simulator" className="py-20 border-t border-white/8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-white/10 bg-[#0a1718] p-8 sm:p-10 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -bottom-20 size-64 rounded-full bg-[#b8f55e]/10 blur-3xl" />

            <div className="max-w-2xl">
              <span className="text-xs font-semibold tracking-[.2em] text-[#b8f55e] uppercase">
                INTERACTIVE TESTING
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-2">
                Test the Deterministic Rule Engine
              </h2>
              <p className="text-xs sm:text-sm text-[#8fa9a6] mt-2">
                Type any transfer amount and recipient to preview how our zero-AI deterministic rule thresholds evaluate safety.
              </p>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8fa9a6] mb-1.5">Recipient VPA / UPI ID</label>
                  <input
                    type="text"
                    value={testVpa}
                    onChange={(e) => setTestVpa(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/12 bg-white/[.04] px-4 text-xs font-mono text-white outline-none focus:border-[#b8f55e]/60"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setTestVpa('store@verifiedmerchant')}
                      className="text-[10px] text-[#b8f55e] hover:underline"
                    >
                      Safe VPA
                    </button>
                    <span className="text-[10px] text-[#526b68]">·</span>
                    <button
                      type="button"
                      onClick={() => setTestVpa('scammer.refund@fakeaxis')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Reported VPA
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8fa9a6] mb-1.5">Transfer Amount (INR)</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/12 bg-white/[.04] px-4 text-xs font-mono text-white outline-none focus:border-[#b8f55e]/60"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setTestAmount('450')}
                      className="text-[10px] text-[#8fa9a6] hover:text-white"
                    >
                      ₹450
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestAmount('12500')}
                      className="text-[10px] text-[#8fa9a6] hover:text-white"
                    >
                      ₹12,500
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestAmount('55000')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      ₹55,000 (Exceeds Limit)
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Output Result */}
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <span className="text-xs text-[#8fa9a6]">Calculated Risk Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isHighRisk
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : isReviewRecommended
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-[#b8f55e]/15 text-[#b8f55e] border border-[#b8f55e]/25'
                    }`}
                  >
                    {isHighRisk ? 'HIGH RISK' : isReviewRecommended ? 'REVIEW RECOMMENDED' : 'SAFE / VERIFIED'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8fa9a6]">Calculated Risk Score:</span>
                    <span className="font-bold text-white">{riskScore} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa9a6]">Platform Threshold:</span>
                    <span className="font-mono text-white">₹50,000 max single</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8fa9a6]">Community Flags:</span>
                    <span className={testVpa.includes('scam') ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {testVpa.includes('scam') ? '2 Prior Incidents' : '0 Prior Flags'}
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard/pay"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8f55e] py-3 text-xs font-bold text-[#09110f] hover:brightness-110 transition"
                >
                  Continue to Pay in App <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-20 border-t border-white/8 bg-[#060e12]/50">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal direction="up" className="text-center space-y-3 mb-14">
            <p className="text-xs font-semibold tracking-[.22em] text-[#b8f55e] uppercase">
              COMPLETE CAPABILITIES
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Financial Operating System for India
            </h2>
            <p className="text-xs sm:text-sm text-[#8fa9a6] max-w-xl mx-auto">
              Everything built for real transactions. Seamless UPI intent dispatch, QR scanner, expense tracker, and administrative dispute desks.
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
                  <h3 className="text-base font-semibold text-white mt-4">{feat.title}</h3>
                  <p className="text-xs text-[#8fa9a6] mt-2 leading-relaxed">{feat.description}</p>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. Step-by-Step Flow */}
      <section id="how-it-works" className="py-20 border-t border-white/8">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal direction="up" className="text-center space-y-3 mb-14">
            <p className="text-xs font-semibold tracking-[.22em] text-[#b8f55e] uppercase">
              ZERO-AI PIPELINE
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Deterministic Security Flow
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <ScrollReveal
                key={s.step}
                delay={idx * 0.1}
                className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 relative hover:border-white/20 transition"
              >
                <span className="text-3xl font-extrabold text-[#b8f55e]/25">{s.step}</span>
                <h4 className="text-sm font-semibold text-white mt-2">{s.title}</h4>
                <p className="text-xs text-[#8fa9a6] mt-2 leading-relaxed">{s.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-white/10 bg-[#071014] py-10 text-xs text-[#8fa9a6]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f] shadow-sm shadow-[#b8f55e]/20">
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-semibold tracking-wider text-white">
              UPI SHIELD <span className="text-[#b8f55e]">AI</span>
            </span>
            <span className="text-[11px] text-[#526b68]">· Deterministic Financial Security</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] text-[#8fa9a6]">
            <span className="size-2 rounded-full bg-[#b8f55e] animate-pulse" />
            <span>Zero-AI Architecture · 100% Deterministic Engine Active</span>
          </div>

          <div className="text-[11px] text-[#6f8583]">
            © 2026 UPI Shield AI · Private & Secured
          </div>
        </div>
      </footer>
    </div>
  )
}
