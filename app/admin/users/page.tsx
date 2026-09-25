'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  ArrowUpDown,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Info,
  MapPin,
  Smartphone,
  Briefcase,
  FileWarning,
  Lock,
  X,
  Filter,
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiRequest } from '@/lib/api'
import { fadeUp } from '@/components/motion/presets'
import { MotionWordReveal, MotionBadge } from '@/components/motion/animated-text'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // User Profile Drawer state
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [profileTab, setProfileTab] = useState<
    'overview' | 'transactions' | 'locations' | 'devices' | 'reports' | 'cases' | 'security'
  >('overview')
  const [locationHistoryFilter, setLocationHistoryFilter] = useState<'ALL' | 'Payments' | 'Logins' | 'Device Activities' | 'Cases'>('ALL')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/admin/users')
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data)
      } else {
        throw new Error('Fallback')
      }
    } catch {
      // offline fallback
      setUsers([
        {
          id: 1,
          name: 'Anjan Sharma',
          email: 'user@upishield.com',
          mobile: '+91 98765 43210',
          joined: '2026-09-01T10:00:00Z',
          status: 'active',
          primary_city: 'Bengaluru',
          known_cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Udupi'],
          last_payment_city: 'Delhi',
          new_locations_count: 2,
          location_alerts_count: 3,
          transactions_count: 128,
          reports_count: 2,
          cases_count: 2,
          devices: [
            { id: 'DEV-A8219', name: 'Samsung Galaxy S24', trusted: true, last_seen: 'Today, 9:10 PM', city: 'Bengaluru' },
            { id: 'DEV-M9104', name: 'MacBook Pro M3', trusted: true, last_seen: 'Yesterday', city: 'Bengaluru' },
            { id: 'DEV-A921', name: 'Unknown Android', trusted: false, last_seen: '25 Sep, 2:15 AM', city: 'Delhi' }
          ],
          timeline: [
            { type: 'Payments', title: 'Star Cafe - ₹850', city: 'Bengaluru', time: 'Today, 8:35 PM', desc: 'Normal trusted payment' },
            { type: 'Logins', title: 'Windows Chrome Session', city: 'Bengaluru', time: 'Today, 11:05 AM', desc: 'IP verified' },
            { type: 'Device Activities', title: 'Hardware Handshake', city: 'Delhi', time: '25 Sep, 2:10 AM', desc: 'DEV-A921 registered' },
            { type: 'Cases', title: 'CASE-2026-00421 Opened', city: 'Bengaluru', time: '25 Sep, 2:28 AM', desc: 'Impossible travel flagged' }
          ]
        },
        {
          id: 2,
          name: 'Priya Verma',
          email: 'priya.v@example.com',
          mobile: '+91 98111 22334',
          joined: '2026-09-05T14:30:00Z',
          status: 'active',
          primary_city: 'Bengaluru',
          known_cities: ['Bengaluru', 'Chennai'],
          last_payment_city: 'Singapore',
          new_locations_count: 1,
          location_alerts_count: 1,
          transactions_count: 42,
          reports_count: 1,
          cases_count: 1,
          devices: [
            { id: 'DEV-I7182', name: 'iPhone 15 Pro', trusted: true, last_seen: 'Today', city: 'Bengaluru' }
          ],
          timeline: [
            { type: 'Payments', title: 'Overseas Digital Store - ₹32,000', city: 'Singapore', time: '24 Sep, 11:42 AM', desc: 'International POS' },
            { type: 'Cases', title: 'CASE-2026-000002 Opened', city: 'Bengaluru', time: '24 Sep, 12:05 PM', desc: 'Foreign charge dispute' }
          ]
        },
        {
          id: 3,
          name: 'Rohan Mehta',
          email: 'rohan.m@example.com',
          mobile: '+91 97222 33445',
          joined: '2026-09-10T09:15:00Z',
          status: 'disabled',
          primary_city: 'Mumbai',
          known_cities: ['Mumbai', 'Pune'],
          last_payment_city: 'Mumbai',
          new_locations_count: 0,
          location_alerts_count: 0,
          transactions_count: 18,
          reports_count: 0,
          cases_count: 0,
          devices: [
            { id: 'DEV-P3912', name: 'Pixel 8', trusted: true, last_seen: '20 Sep', city: 'Mumbai' }
          ],
          timeline: [
            { type: 'Payments', title: 'Local Groceries - ₹1,420', city: 'Mumbai', time: '20 Sep, 4:15 PM', desc: 'Normal UPI' }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (user: any) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active'
    setActionLoading(user.id)
    try {
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      )
      setNotice(`User ${user.name} account is now ${nextStatus}.`)
      setTimeout(() => setNotice(null), 4000)
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      )
      setNotice(`User ${user.name} updated locally to ${nextStatus}.`)
      setTimeout(() => setNotice(null), 4000)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = (users || []).filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.mobile && u.mobile.includes(search))
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MotionBadge text="IDENTITY & RISK AUDIT" variant="admin" />
              <span className="text-[10px] text-slate-400 font-mono">LOCATION-AWARE DIRECTORY</span>
            </div>
            <MotionWordReveal
              text="User Management & Location Profiles"
              className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
            />
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Inspect user hardware registrations, travel velocities, known cities, and administrative status.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0a1718] border border-white/10 text-xs font-semibold text-slate-300">
            Total Users: <span className="text-white font-mono">{filteredUsers.length}</span>
          </div>
        </div>

        {/* Global Notice */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3"
            >
              <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
              <span>{notice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-[#0a1718] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#071014] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['ALL', 'active', 'disabled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  statusFilter === st
                    ? 'bg-[#b8f55e] text-[#071014]'
                    : 'bg-[#071014] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-[#0a1718] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#071014] text-[11px] uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">User Details</th>
                  <th className="px-5 py-3.5 font-semibold">Primary Location</th>
                  <th className="px-5 py-3.5 font-semibold">Activity Ledger</th>
                  <th className="px-5 py-3.5 font-semibold">Incidents / Cases</th>
                  <th className="px-5 py-3.5 font-semibold">Account State</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[#071014] border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{u.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <MapPin className="size-3.5 text-[#b8f55e]" />
                          <span>{u.primary_city || 'Bengaluru'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {u.known_cities?.length || 1} Known Cities
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono">
                        <span className="text-white font-semibold">{u.transactions_count || 0}</span> txns
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {u.reports_count || 0} Reports
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {u.cases_count || 0} Cases
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setProfileTab('overview')
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#b8f55e]/15 hover:bg-[#b8f55e]/25 border border-[#b8f55e]/30 text-xs font-semibold text-[#b8f55e] transition"
                          >
                            Location Profile
                          </button>

                          <button
                            onClick={() => toggleUserStatus(u)}
                            disabled={actionLoading === u.id}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                              u.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {u.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 37: User Location Profile for Admin (7 Tabs) */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a1718] border border-[#b8f55e]/30 p-6 space-y-6 shadow-2xl"
              >
                {/* Modal Top */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-[#071014] border border-[#b8f55e]/30 flex items-center justify-center font-bold text-white text-lg">
                      {selectedUser.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{selectedUser.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b8f55e]/20 text-[#b8f55e]">
                          USR-{selectedUser.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedUser.email} · {selectedUser.mobile}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 rounded-xl bg-[#071014] border border-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* 7 Tabs per Section 37: Overview, Transactions, Locations, Devices, Reports, Cases, Security */}
                <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs font-semibold">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'transactions', label: 'Transactions' },
                    { id: 'locations', label: 'Locations (Section 37)' },
                    { id: 'devices', label: 'Devices' },
                    { id: 'reports', label: 'Reports' },
                    { id: 'cases', label: 'Cases' },
                    { id: 'security', label: 'Security' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setProfileTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl transition ${
                        profileTab === tab.id
                          ? 'bg-[#b8f55e] text-[#071014]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: OVERVIEW */}
                {profileTab === 'overview' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block">Total Spend</span>
                        <span className="text-lg font-bold font-mono text-white mt-1 block">₹42,580</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block">Transactions</span>
                        <span className="text-lg font-bold font-mono text-[#b8f55e] mt-1 block">
                          {selectedUser.transactions_count}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block">Registered Devices</span>
                        <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                          {selectedUser.devices?.length || 1}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block">Active Cases</span>
                        <span className="text-lg font-bold font-mono text-rose-400 mt-1 block">
                          {selectedUser.cases_count}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: LOCATIONS (Sections 37 & 38) */}
                {profileTab === 'locations' && (
                  <div className="space-y-6 text-xs">
                    {/* Location Metrics Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase">Primary Location</span>
                        <span className="text-white font-bold text-sm block mt-1">
                          {selectedUser.primary_city || 'Bengaluru'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase">Known Cities</span>
                        <span className="text-[#b8f55e] font-bold text-sm font-mono block mt-1">
                          {selectedUser.known_cities?.length || 4}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase">Last Payment City</span>
                        <span className="text-rose-400 font-bold text-sm block mt-1">
                          {selectedUser.last_payment_city || 'Delhi'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase">New Locations</span>
                        <span className="text-amber-400 font-bold text-sm font-mono block mt-1">
                          {selectedUser.new_locations_count || 2}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#071014] border border-white/5">
                        <span className="text-slate-500 block text-[10px] uppercase">Location Alerts</span>
                        <span className="text-rose-400 font-bold text-sm font-mono block mt-1">
                          {selectedUser.location_alerts_count || 3}
                        </span>
                      </div>
                    </div>

                    {/* Section 38: Admin User Location History Filter */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                      <span className="font-bold text-white text-xs">Filter History:</span>
                      <div className="flex gap-2">
                        {['ALL', 'Payments', 'Logins', 'Device Activities', 'Cases'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setLocationHistoryFilter(f as any)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                              locationHistoryFilter === f
                                ? 'bg-[#b8f55e] text-[#071014]'
                                : 'bg-[#071014] text-slate-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location Timeline */}
                    <div className="space-y-2">
                      {(selectedUser.timeline || [])
                        .filter((item: any) => locationHistoryFilter === 'ALL' || item.type === locationHistoryFilter)
                        .map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#071014] border border-white/5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-2 rounded-lg bg-white/5 text-[#b8f55e]">
                                <Clock className="size-3.5" />
                              </span>
                              <div>
                                <span className="font-semibold text-white block">{item.title}</span>
                                <span className="text-[11px] text-slate-400">{item.desc}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-white font-bold block">{item.city}</span>
                              <span className="text-[10px] text-slate-500">{item.time}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: DEVICES */}
                {profileTab === 'devices' && (
                  <div className="space-y-3 text-xs">
                    {(selectedUser.devices || []).map((dev: any) => (
                      <div
                        key={dev.id}
                        className="p-3.5 rounded-xl bg-[#071014] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="size-4 text-[#b8f55e]" />
                          <div>
                            <span className="font-bold text-white block">{dev.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">{dev.id}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dev.trusted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {dev.trusted ? 'TRUSTED' : 'UNTRUSTED'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{dev.city} · {dev.last_seen}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2, 5, 6, 7 Placeholders */}
                {['transactions', 'reports', 'cases', 'security'].includes(profileTab) && (
                  <div className="p-8 text-center text-xs text-slate-400 bg-[#071014] rounded-xl border border-white/5">
                    Viewing {profileTab.toUpperCase()} records for {selectedUser.name} ({selectedUser.email}).
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
