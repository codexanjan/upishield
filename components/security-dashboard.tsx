'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, CircleDollarSign, FileWarning, LayoutDashboard, LogOut, Menu, Network, ScanLine, Search, ShieldCheck, SlidersHorizontal, Users, WalletCards, X } from 'lucide-react'

type SecurityDashboardProps = { admin?: boolean }
type Row = [string, string, string]
type StatTuple = [string, string, string, React.ComponentType<{ className?: string }>]

const userNav = [['Overview', LayoutDashboard], ['Expenses', WalletCards], ['Pay & Scan', ScanLine], ['Fraud scanner', ShieldCheck], ['Reports', FileWarning]] as const
const adminNav = [['Command center', LayoutDashboard], ['Investigations', Search], ['Live fraud feed', Activity], ['Users & transactions', Users], ['Model monitoring', BarChart3], ['Fraud network', Network]] as const

const userRows: Row[] = [['Review', 'New device sign-in', 'Just now'], ['Protected', 'Payment verified', '12 min ago'], ['Review', 'Large payment detected', 'Yesterday']]
const adminRows: Row[] = [['97', '₹42,500 · UPI', 'Critical'], ['81', '₹18,200 · Card', 'High'], ['12', '₹1,250 · Card', 'Safe']]

const adminStats: StatTuple[] = [
  ['Total users', '18,429', '+8.4%', Users],
  ['Transactions today', '42,812', '+12.8%', Activity],
  ['Flagged transactions', '247', '+4.2%', AlertTriangle],
  ['Amount at risk', '₹18.4L', '-6.1%', CircleDollarSign]
]

const userStats: StatTuple[] = [
  ['Tracked balance', '₹48,520', '+6.2%', CircleDollarSign],
  ['Monthly spend', '₹17,420', '-3.8%', WalletCards],
  ['Transactions', '342', '+18.4%', Activity],
  ['Security score', '87 / 100', 'Excellent', ShieldCheck]
]

export function SecurityDashboard({ admin = false }: SecurityDashboardProps) {
  const [active, setActive] = useState(admin ? 'Command center' : 'Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [customized, setCustomized] = useState(false)
  const nav = admin ? adminNav : userNav
  const stats = admin ? adminStats : userStats
  const rows = admin ? adminRows : userRows

  return <main className="min-h-screen bg-[#071014] text-[#edf8f5]">
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-20 w-72 border-r border-white/10 p-6 transition-transform lg:static lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} bg-[#0a1718]`}>
        <div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3 text-xs font-semibold tracking-[.18em]"><span className="grid size-9 place-items-center rounded-xl bg-[#b8f55e] text-[#09110f]"><ShieldCheck className="size-5" /></span>UPI SHIELD <span className="text-[#b8f55e]">AI</span></Link><button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X className="size-5" /></button></div>
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[10px] font-semibold tracking-[.2em] text-[#78908d]">SIGNED IN AS</p><p className="mt-2 text-sm font-medium">{admin ? 'admin@upishield.ai' : 'demo@upishield.ai'}</p><p className="mt-1 text-xs text-[#b8f55e]">{admin ? 'Administrator' : 'Personal workspace'}</p></div>
        <nav className="mt-8 flex flex-col gap-2" aria-label="Dashboard navigation">{nav.map(([label, Icon]) => <button key={label} onClick={() => { setActive(label); setMenuOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === label ? 'bg-[#b8f55e]/15 text-[#b8f55e] font-semibold' : 'text-[#819694] hover:bg-white/[.04] hover:text-white'}`}><Icon className="size-4" />{label}</button>)}</nav>
        <div className="absolute bottom-6 left-6 right-6"><Link href={admin ? '/admin/login' : '/login'} className="flex items-center gap-3 px-3 py-3 text-sm text-[#819694] hover:text-white"><LogOut className="size-4" />Sign out</Link></div>
      </aside>
      <section className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8"><button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button><div className="hidden lg:block"><p className="text-xs font-semibold tracking-[.2em] text-[#78908d]">{admin ? 'FRAUD OPERATIONS' : 'PERSONAL FINANCE'}</p><h1 className="mt-1 text-xl font-medium">{active}</h1></div><div className="ml-auto flex items-center gap-4"><button aria-label="Notifications" onClick={() => setNotifications(!notifications)} className={`relative rounded-lg p-2 ${notifications ? 'bg-white/10 text-white' : 'text-[#819694] hover:bg-white/5 hover:text-white'}`}><Bell className="size-5" />{!notifications && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ff7a82]" />}</button><div className="grid size-9 place-items-center rounded-full bg-white/10 text-sm font-semibold">{admin ? 'AD' : 'AS'}</div></div></header>
        <div className="mx-auto max-w-[1400px] p-5 sm:p-8"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-[#78908d]">{admin ? 'Good morning, operator' : 'Good morning, Anjan'}</p><h2 className="mt-2 text-3xl font-medium tracking-[-.04em]">{active === (admin ? 'Command center' : 'Overview') ? (admin ? 'Keep the signal clean.' : 'Your financial security overview.') : `${active} at a glance.`}</h2></div><button onClick={() => setCustomized(!customized)} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-[#b8f55e] text-[#09110f]"><SlidersHorizontal className="size-4" />{customized ? 'View customized' : 'Customize view'}</button></div>
          {notifications && <div role="status" className="mb-6 rounded-xl border border-[#b8f55e]/25 bg-[#b8f55e]/10 p-4 text-sm text-white">{admin ? '3 priority investigations need attention.' : 'You have 1 security alert to review.'}</div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, change, Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="flex items-center justify-between"><p className="text-sm text-[#819694]">{label}</p><Icon className="size-4 text-[#b8f55e]" /></div><p className="mt-5 text-2xl font-medium">{value}</p><p className={`mt-2 text-xs ${String(change).startsWith('-') ? 'text-[#b8f55e]' : 'text-[#8fa9a6]'}`}>{change} <span className="text-[#617773]">vs last period</span></p></div>)}</div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[#819694]">{admin ? 'Fraud detection activity' : 'Money movement'}</p><p className="mt-1 text-xl font-medium">{admin ? 'Risk signals, last 7 days' : 'Income vs expenses'}</p></div><span className="rounded-full bg-[#b8f55e]/10 px-3 py-1 text-xs text-[#b8f55e]">Live</span></div><div className="mt-8 flex h-48 items-end gap-3 sm:gap-5">{[34,48,38,72,56,84,64,92,70,78,58,88].map((height, i) => <div key={i} className="flex flex-1 flex-col justify-end gap-2"><div className={`rounded-t-md ${admin && i === 7 ? 'bg-[#ff7a82]' : 'bg-[#b8f55e]'}`} style={{ height: `${height}%`, opacity: .35 + i / 20 }} /><span className="text-center text-[10px] text-[#617773]">{['M','T','W','T','F','S','S','M','T','W','T','F'][i]}</span></div>)}</div></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><p className="text-sm text-[#819694]">{admin ? 'Live fraud feed' : 'Recent alerts'}</p><div className="mt-5 flex flex-col gap-4">{rows.map(([a,b,c]) => <div key={b} className="flex items-center gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0"><div className={`grid size-10 place-items-center rounded-xl text-xs font-semibold ${a === '97' || a === 'Review' ? 'bg-[#ff7a82]/10 text-[#ff9299]' : 'bg-[#b8f55e]/10 text-[#b8f55e]'}`}>{a}</div><div className="min-w-0 flex-1"><p className="truncate text-sm">{b}</p><p className="mt-1 text-xs text-[#617773]">{c}</p></div><ArrowUpRight className="size-4 text-[#617773]" /></div>)}</div><button onClick={() => setActive(admin ? 'Investigations' : 'Fraud scanner')} className="mt-5 text-xs font-semibold text-[#b8f55e] hover:underline">View all activity <ArrowUpRight className="ml-1 inline size-3" /></button></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#b8f55e]/20 bg-[#b8f55e]/[.06] p-5"><p className="text-xs font-semibold tracking-[.15em] text-[#b8f55e]">NEXT BEST ACTION</p><p className="mt-3 text-sm leading-6">{admin ? 'Review 12 critical cases awaiting assignment.' : 'Your security score is strong. Enable trusted device alerts for extra protection.'}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs text-[#819694]">Platform status</p><p className="mt-3 flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-[#b8f55e]" /> All systems operational</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs text-[#819694]">Last updated</p><p className="mt-3 text-sm">Today, 10:42 AM <span className="text-[#617773]">· India Standard Time</span></p></div></div>
        </div></section>
    </div>
  </main>
}

export default SecurityDashboard
