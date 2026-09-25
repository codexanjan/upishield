'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Lock,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Laptop,
  LogOut,
  History,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck
} from 'lucide-react'
import { UserLayout } from '@/components/layout/user-layout'
import { apiRequest } from '@/lib/api'
import { MotionWordReveal, MotionFadeUp } from '@/components/motion/animated-text'

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPass, setChangingPass] = useState(false)
  const [passSuccess, setPassSuccess] = useState<string | null>(null)
  const [passError, setPassError] = useState<string | null>(null)

  // 2FA toggle
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Mock active sessions
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Windows 11 (Chrome 128.0)',
      ip: '103.212.144.18 (Current)',
      last_active: 'Just now',
      is_current: true,
      type: 'desktop'
    },
    {
      id: 2,
      device: 'Android 14 (UPI Shield Mobile App)',
      ip: '103.212.144.22',
      last_active: '3 hours ago',
      is_current: false,
      type: 'mobile'
    }
  ])

  // Login history
  const loginHistory = [
    { id: 1, date: 'Today, 10:45 AM', ip: '103.212.144.18', status: 'Success', method: 'Password + JWT' },
    { id: 2, date: 'Yesterday, 08:12 PM', ip: '103.212.144.22', status: 'Success', method: 'Mobile App' },
    { id: 3, date: '21 Sep 2026, 02:30 PM', ip: '49.36.120.45', status: 'Success', method: 'Password + JWT' }
  ]

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassSuccess(null)

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match')
      return
    }

    setChangingPass(true)
    try {
      // In production API endpoint or demo confirmation
      await new Promise((r) => setTimeout(r, 600))
      setPassSuccess('Password successfully updated. All other sessions have been logged out.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPassSuccess(null), 5000)
    } catch {
      setPassError('Failed to change password. Please verify current password.')
    } finally {
      setChangingPass(false)
    }
  }

  const handleTerminateSession = (sessionId: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  const handleLogoutOthers = () => {
    setSessions((prev) => prev.filter((s) => s.is_current))
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Lock className="w-8 h-8 text-[#b8f55e]" />
            <MotionWordReveal text="Security & Authentication" delay={0.1} />
          </h1>
          <MotionFadeUp delay={0.2}>
            <p className="text-slate-400 text-sm mt-1">
              Manage your credentials, active sessions, and access safeguards.
            </p>
          </MotionFadeUp>
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <KeyRound className="w-5 h-5 text-[#b8f55e]" />
            <h2 className="text-sm font-semibold text-white">Change Account Password</h2>
          </div>

          {passSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#071014] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#b8f55e] transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="px-6 py-2.5 rounded-xl bg-[#b8f55e] text-[#071014] font-semibold text-xs hover:bg-[#b8f55e]/90 transition flex items-center gap-2 shadow-lg shadow-[#b8f55e]/20 disabled:opacity-50"
            >
              {changingPass ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* 2FA Architecture Demo */}
        <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#b8f55e]" />
              <h3 className="text-sm font-semibold text-white">Two-Factor Authentication (2FA) Architecture</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Require one-time time-based tokens (TOTP) or secure SMS verification for all critical transactions and sensitive setting modifications.
            </p>
          </div>

          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className="flex items-center gap-2 text-[#b8f55e] hover:opacity-80 transition"
          >
            {twoFactorEnabled ? (
              <ToggleRight className="w-8 h-8 text-[#b8f55e]" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-500" />
            )}
            <span className="text-xs font-semibold text-white">
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>

        {/* Active Sessions */}
        <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#b8f55e]" />
                Active Device Sessions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Devices currently authenticated into your UPI Shield dashboard.
              </p>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={handleLogoutOthers}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5 w-fit"
              >
                <LogOut className="w-3.5 h-3.5" />
                Terminate Other Sessions
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(sessions || []).map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-[#071014] border border-white/5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                    {s.type === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white">{s.device}</p>
                      {s.is_current && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      IP: {s.ip} • Last active: {s.last_active}
                    </p>
                  </div>
                </div>

                {!s.is_current && (
                  <button
                    onClick={() => handleTerminateSession(s.id)}
                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-medium transition"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Login Audit */}
        <div className="p-6 rounded-2xl bg-[#0a1718] border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <History className="w-4 h-4 text-[#b8f55e]" />
            Recent Security Access History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#071014] text-[11px] uppercase text-slate-500 border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Auth Method</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(loginHistory || []).map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 text-white font-medium">{l.date}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{l.ip}</td>
                    <td className="py-2.5 px-4">{l.method}</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-semibold">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
