'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Compass,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  ArrowRight,
  TrendingUp,
  Sliders,
  Plane,
  Home,
  Clock,
  Smartphone,
  Info
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { MotionWordReveal, MotionFadeUp, MotionBadge } from '@/components/motion/animated-text'

export default function UserLocationHistoryPage() {
  const [travelMode, setTravelMode] = useState(true)
  const [travelRegion, setTravelRegion] = useState('Goa')
  const [primaryRegion, setPrimaryRegion] = useState('Bengaluru')
  const [secondaryRegion, setSecondaryRegion] = useState('Udupi')

  const [rules, setRules] = useState({
    alertNewCities: true,
    alertOutsideIndia: true,
    alertHighValueNewLoc: true,
    alertNewDeviceNewLoc: true,
    alertNightOutsideHome: true
  })

  const [showNewLocModal, setShowNewLocModal] = useState(true)

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MotionBadge text="LOCATION INTELLIGENCE & TRAVEL SECURITY" variant="lime" />
            </div>
            <MotionWordReveal
              text="Location History & Travel Guard"
              className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            />
            <p className="mt-1 text-xs text-[#8fa9a6]">
              Deterministic travel timelines, route reconstruction, spending by city & geo-fence controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment-map"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[.08] transition"
            >
              <MapPin className="size-3.5 text-[#b8f55e]" /> View Map
            </Link>
            <Link
              href="/dashboard/devices"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b8f55e] px-4 py-2 text-xs font-semibold text-[#071014] hover:brightness-110 transition shadow-lg shadow-[#b8f55e]/20"
            >
              <Smartphone className="size-3.5" /> Devices & Logins
            </Link>
          </div>
        </div>

        {/* LOCATION CHANGE WARNING (Prompt Spec 9) */}
        {showNewLocModal && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-md"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      NEW PAYMENT LOCATION
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded">
                      Anomaly Warning
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">
                    This payment was initiated from a location you have not used recently.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
                    <span className="bg-[#071014] px-3 py-1 rounded-lg border border-white/10">
                      City: <strong className="text-white">Delhi</strong>
                    </span>
                    <span className="bg-[#071014] px-3 py-1 rounded-lg border border-white/10">
                      Amount: <strong className="text-white">₹18,500</strong>
                    </span>
                    <span className="bg-[#071014] px-3 py-1 rounded-lg border border-white/10">
                      Device: <strong className="text-rose-300">New Android Device</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => setShowNewLocModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition"
                >
                  This Was Me
                </button>
                <Link
                  href="/dashboard/report"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition shadow-lg shadow-rose-600/20"
                >
                  Report Transaction
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition"
                >
                  Secure Account
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* TRAVEL MODE & HOME REGION CONFIGURATION (Prompt Specs 16, 17, 18) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Travel Mode Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#b8f55e]/15 text-[#b8f55e]">
                  <Plane className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Travel Mode Protection</h3>
                  <p className="text-xs text-[#8fa9a6]">Suppress false alarms while traveling legitimately</p>
                </div>
              </div>
              <button
                onClick={() => setTravelMode(!travelMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  travelMode
                    ? 'bg-[#b8f55e] text-[#071014] shadow-md shadow-[#b8f55e]/20'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {travelMode ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>

            {travelMode ? (
              <div className="p-4 rounded-xl bg-[#071014] border border-[#b8f55e]/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8fa9a6]">Expected Region:</span>
                  <span className="text-white font-bold">{travelRegion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8fa9a6]">Window Dates:</span>
                  <span className="text-white font-mono">26–29 Sep 2026</span>
                </div>
                <p className="pt-2 border-t border-white/10 text-[11px] text-[#b8f55e]">
                  ✓ Legitimate new-location payments in {travelRegion} will not trigger emergency account suspensions.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#8fa9a6]">
                Enable Travel Mode when going to other states or abroad to prevent unexpected friction.
              </p>
            )}
          </div>

          {/* Home Regions Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="p-2 rounded-xl bg-sky-400/15 text-sky-400">
                <Home className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Defined Home Regions</h3>
                <p className="text-xs text-[#8fa9a6]">Baseline anchor zones for velocity & night guards</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[11px] text-[#8fa9a6]">Primary Region</span>
                <p className="text-sm font-bold text-white">{primaryRegion}</p>
                <span className="text-[10px] text-[#b8f55e]">Home & Office</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5 space-y-1">
                <span className="text-[11px] text-[#8fa9a6]">Secondary Region</span>
                <p className="text-sm font-bold text-white">{secondaryRegion}</p>
                <span className="text-[10px] text-sky-400">Family Residence</span>
              </div>
            </div>
          </div>
        </div>

        {/* TIMELINE & PAYMENT ROUTE (Prompt Specs 8 & 11) */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Location Timeline */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#b8f55e]" />
                <h3 className="text-base font-semibold text-white">Chronological Location Timeline</h3>
              </div>
              <span className="text-xs text-[#8fa9a6]">Past 48 Hours</span>
            </div>

            <div className="space-y-6">
              {/* Day 1: 25 SEP */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#b8f55e] bg-[#b8f55e]/10 border border-[#b8f55e]/20 px-2.5 py-0.5 rounded-md">
                    25 SEP 2026
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="space-y-3 pl-3 border-l-2 border-white/10 ml-2">
                  <div className="flex items-start justify-between p-3 rounded-xl bg-[#071014] border border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3 text-[#b8f55e]" />
                        <span className="text-xs font-bold text-white">Bengaluru (Koramangala)</span>
                      </div>
                      <p className="text-xs text-[#8fa9a6] mt-0.5">Star Cafe · UPI Payment</p>
                      <span className="text-[10px] text-slate-500">8:35 PM · Samsung Galaxy S24</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">₹850</span>
                  </div>

                  <div className="flex items-start justify-between p-3 rounded-xl bg-[#071014] border border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3 text-[#b8f55e]" />
                        <span className="text-xs font-bold text-white">Bengaluru (Indiranagar)</span>
                      </div>
                      <p className="text-xs text-[#8fa9a6] mt-0.5">Supermarket Fresh Mart · Card Payment</p>
                      <span className="text-[10px] text-slate-500">5:12 PM · POS Swipe</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">₹2,100</span>
                  </div>
                </div>
              </div>

              {/* Day 2: 24 SEP */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2.5 py-0.5 rounded-md">
                    24 SEP 2026
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="space-y-3 pl-3 border-l-2 border-white/10 ml-2">
                  <div className="flex items-start justify-between p-3 rounded-xl bg-[#071014] border border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3 text-sky-400" />
                        <span className="text-xs font-bold text-white">Mysuru (Devaraja Market)</span>
                      </div>
                      <p className="text-xs text-[#8fa9a6] mt-0.5">Heritage Restaurant · QR Scan</p>
                      <span className="text-[10px] text-slate-500">7:15 PM · Samsung Galaxy S24</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">₹1,200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Payment Route (Prompt Spec 11) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="size-4 text-[#b8f55e]" />
                  <h3 className="text-base font-semibold text-white">User Payment Route</h3>
                </div>
                <span className="text-xs text-[#b8f55e] font-mono">3 Stops</span>
              </div>

              <p className="text-xs text-[#8fa9a6] mt-3">
                Reconstructed travel route based on sequential verified merchant transaction timestamps:
              </p>

              {/* Route Steps */}
              <div className="mt-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">1. Bengaluru</span>
                    <span className="text-xs text-[#b8f55e] font-mono">84 payments</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#8fa9a6]">
                    <span>Total Spent: ₹18,200</span>
                    <span>14 merchants</span>
                  </div>
                </div>

                <div className="flex justify-center text-[#b8f55e] text-sm">↓</div>

                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">2. Mysuru</span>
                    <span className="text-xs text-sky-400 font-mono">12 payments</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#8fa9a6]">
                    <span>Total Spent: ₹5,400</span>
                    <span>4 merchants</span>
                  </div>
                </div>

                <div className="flex justify-center text-[#b8f55e] text-sm">↓</div>

                <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">3. Mangaluru</span>
                    <span className="text-xs text-amber-400 font-mono">3 payments</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#8fa9a6]">
                    <span>Total Spent: ₹3,200</span>
                    <span>2 merchants</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8fa9a6]">
              <span>Cumulative Travel Spend: ₹26,800</span>
              <span className="text-[#b8f55e] font-semibold">100% In-Region</span>
            </div>
          </div>
        </div>

        {/* LOCATION SAFETY RULES (Prompt Spec 18) */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1718] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-[#b8f55e]" />
              <h3 className="text-base font-semibold text-white">Configurable Location Safety Rules</h3>
            </div>
            <span className="text-xs text-[#8fa9a6]">Deterministic Trigger Conditions</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'alertNewCities', title: 'Alert me for new cities', desc: 'Trigger confirmation challenge when paying in an unvisited district.' },
              { key: 'alertOutsideIndia', title: 'Alert for transactions outside India', desc: 'Immediate prompt before cross-border card authorization.' },
              { key: 'alertHighValueNewLoc', title: 'Alert for payments > ₹10,000 in new location', desc: 'Hold-to-confirm delay on high value payments outside home city.' },
              { key: 'alertNewDeviceNewLoc', title: 'Alert for new device + new location', desc: 'Immediate warning and email alert if an unrecognized phone transacts.' },
              { key: 'alertNightOutsideHome', title: 'Alert for night payments outside home region', desc: 'Active window 11:30 PM - 6:00 AM outside Bengaluru.' },
            ].map((r) => {
              const active = (rules as any)[r.key]
              return (
                <div
                  key={r.key}
                  onClick={() => setRules({ ...rules, [r.key]: !active })}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    active
                      ? 'bg-[#071014] border-[#b8f55e]/30'
                      : 'bg-[#071014]/50 border-white/5 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{r.title}</h4>
                      <span className={`size-2.5 rounded-full ${active ? 'bg-[#b8f55e]' : 'bg-slate-600'}`} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#8fa9a6]">{r.desc}</p>
                  </div>
                  <span className={`mt-3 text-[10px] font-semibold ${active ? 'text-[#b8f55e]' : 'text-slate-500'}`}>
                    {active ? '✓ Enabled' : 'Disabled'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
