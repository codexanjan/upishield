'use client'

import { Suspense } from 'react'
import { AuthScreen } from '@/components/auth-screen'

export default function UserLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#071014] flex items-center justify-center text-[#b8f55e]">Loading Security Console...</div>}>
      <AuthScreen />
    </Suspense>
  )
}
