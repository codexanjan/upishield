'use client'

import { MerchantLayout } from '@/components/layout/merchant-layout'
import { useUPIGuardStore } from '@/lib/upiguard-store'
import { TrendingUp, ShieldCheck, AlertTriangle, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'

export default function MerchantAnalyticsPage() {
  const { accounts, activeMerchantUpi, transactions } = useUPIGuardStore()
  const merchant = accounts[activeMerchantUpi] || accounts['abc@upiguard']
  const merchantTxns = transactions.filter((t) => t.receiverUpiId === activeMerchantUpi)

  const volumeData = [
    { day: 'Mon', volume: 18500, txns: 12 },
    { day: 'Tue', volume: 24200, txns: 16 },
    { day: 'Wed', volume: 19800, txns: 14 },
    { day: 'Thu', volume: 32000, txns: 22 },
    { day: 'Fri', volume: 48500, txns: 31 },
    { day: 'Sat', volume: 55000, txns: 39 },
    { day: 'Sun', volume: merchant.balance, txns: merchantTxns.length + 25 },
  ]

  const riskDistribution = [
    { range: '0-20 Low', count: 42, fill: '#39DDA0' },
    { range: '21-40 Safe', count: 18, fill: '#5BD6FF' },
    { range: '41-70 Review', count: 4, fill: '#FFC85B' },
    { range: '71-100 High', count: 1, fill: '#FF647B' },
  ]

  return (
    <MerchantLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="size-8 text-[#5BD6FF]" />
            Merchant Risk & Transaction Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, trust scoring, and customer risk profiling for {merchant.name}.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-5 shadow-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Merchant Trust Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">{merchant.trustScore}/100</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <ShieldCheck className="size-3.5 inline mr-0.5" /> High Trust
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Verified entity with zero chargeback disputes</p>
          </div>

          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-5 shadow-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Processed Settlements</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white font-mono">{merchantTxns.length + 142}</span>
              <span className="text-xs text-[#5BD6FF] font-semibold flex items-center">
                <ArrowUpRight className="size-3.5 inline" /> +12%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Simulated transactions settled successfully</p>
          </div>

          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-5 shadow-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Average Ticket Size</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-[#5BD6FF] font-mono">₹3,450</span>
              <span className="text-xs text-slate-400 font-mono">Normal</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Consistent with consumer electronics retail</p>
          </div>

          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-5 shadow-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Fraud Block Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">0.0%</span>
              <span className="text-xs text-emerald-400 font-semibold">0 Flags</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Zero suspicious chargebacks recorded</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Inflow Trend */}
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Settlement Volume (₹)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="merchGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#438EFF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#438EFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B1B2D" />
                  <XAxis dataKey="day" stroke="#8fa9a6" fontSize={11} />
                  <YAxis stroke="#8fa9a6" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#091726', borderColor: '#438EFF', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Settlement']}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#5BD6FF" strokeWidth={2.5} fillOpacity={1} fill="url(#merchGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Risk Distribution */}
          <div className="rounded-3xl border border-[#0B1B2D] bg-[#091726] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payer Risk Level Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B1B2D" />
                  <XAxis dataKey="range" stroke="#8fa9a6" fontSize={11} />
                  <YAxis stroke="#8fa9a6" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#091726', borderColor: '#5BD6FF', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  )
}
