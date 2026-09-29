// Dynamically resolve API URL:
// 1. Explicit NEXT_PUBLIC_API_URL if configured
// 2. Relative /api/v1 in browser (self-contained full-stack Next.js API)
export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }
  return '/api/v1'
}

const API_BASE = getApiBase()

// Helper for making authenticated requests
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Get token from parameter or localStorage
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('upishield_token') : null)
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const base = getApiBase()
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    })

    if (!res.ok) {
      let errorMsg = 'An error occurred'
      try {
        const errJson = await res.json()
        errorMsg = errJson.detail || errJson.message || JSON.stringify(errJson)
      } catch {
        errorMsg = await res.text() || res.statusText
      }
      throw new Error(errorMsg)
    }

    return await res.json()
  } catch (err: any) {
    // If backend connection fails (e.g. server starting or offline), provide helpful contextual error
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.warn(`[UPI Shield API] Backend currently unreachable at ${url}. Operating in local demo mode fallback.`)
    }
    throw err
  }
}

// Upload file helper
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {}
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('upishield_token') : null)
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const base = getApiBase()
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail || 'Upload failed')
  }

  return await res.json()
}
