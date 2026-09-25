'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[UPI Shield AI] Global Layout Error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#071014] text-[#eef8f7] flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0a1718] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#ff7a82]/10 text-[#ff7a82] border border-[#ff7a82]/20">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">System Recovered Safely</h2>
          <p className="mt-2 text-xs text-[#8fa9a6]">
            The application intercepted a render failure. Please reload to resume your financial dashboard.
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 w-full rounded-xl bg-[#b8f55e] px-4 py-3 text-xs font-semibold text-[#09110f] hover:brightness-110 transition"
          >
            Reload Platform
          </button>
        </div>
      </body>
    </html>
  )
}
