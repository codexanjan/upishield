import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfile {
  id: number
  name: string
  email: string
  mobile?: string
  avatar?: string
  role: string
  status: string
  primary_city?: string
  secondary_city?: string
}

export const DEFAULT_USER: UserProfile = {
  id: 1,
  name: 'Anjan Sharma',
  email: 'demo@upishield.ai',
  mobile: '+91 98765 43210',
  role: 'user',
  status: 'active',
  primary_city: 'Bengaluru',
  secondary_city: 'Delhi'
}

export const DEFAULT_ADMIN: UserProfile = {
  id: 99,
  name: 'Platform Administrator',
  email: 'admin@upishield.ai',
  role: 'admin',
  status: 'active'
}

// Simple deterministic hash for demo accounts so passwords are never stored in plaintext
export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(password + '::upishield_salt_2026')
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // Fallback below
    }
  }
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i)
    hash |= 0
  }
  return `hash_${Math.abs(hash).toString(16)}`
}

export interface RegisteredAccount {
  id: number
  name: string
  email: string
  mobile: string
  passwordHash: string
  role: 'user' | 'admin'
  createdAt: string
}

const REGISTERED_USERS_KEY = 'upishield_registered_users'

export function getRegisteredUsers(): RegisteredAccount[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function saveRegisteredUser(account: Omit<RegisteredAccount, 'id' | 'passwordHash' | 'createdAt'> & { password: string }): Promise<RegisteredAccount> {
  const users = getRegisteredUsers()
  const passwordHash = await hashPassword(account.password)
  const newUser: RegisteredAccount = {
    id: Date.now(),
    name: account.name,
    email: account.email.trim().toLowerCase(),
    mobile: account.mobile,
    passwordHash,
    role: account.role || 'user',
    createdAt: new Date().toISOString()
  }
  users.push(newUser)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users))
  }
  return newUser
}

export async function verifyUserCredentials(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const normalizedEmail = email.trim().toLowerCase()
  
  // 1. Built-in Demo User credentials
  if (normalizedEmail === 'demo@upishield.ai' && password === 'shield123') {
    return { success: true, user: DEFAULT_USER }
  }

  // 2. Registered users in local storage
  const users = getRegisteredUsers()
  const found = users.find((u) => u.email === normalizedEmail)
  if (found) {
    const hash = await hashPassword(password)
    if (found.passwordHash === hash) {
      return {
        success: true,
        user: {
          id: found.id,
          name: found.name,
          email: found.email,
          mobile: found.mobile,
          role: found.role,
          status: 'active',
          primary_city: 'Bengaluru'
        }
      }
    }
  }

  return { success: false, message: 'Invalid email or password. Please verify your credentials.' }
}

export function verifyAdminCredentials(email: string, password: string): { success: boolean; admin?: UserProfile; message?: string } {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail === 'admin@upishield.ai' && password === 'admin123') {
    return { success: true, admin: DEFAULT_ADMIN }
  }
  return { success: false, message: 'Invalid administrator credentials. Access restricted.' }
}

export function setSessionCookie(sessionData: any) {
  if (typeof document !== 'undefined') {
    const userRole = sessionData.role === 'admin' ? 'admin' : 'user'
    const data = {
      authenticated: true,
      role: userRole,
      userRole: userRole,
      email: sessionData.email || 'demo@upishield.ai',
      name: sessionData.name || 'User',
      token: sessionData.token || `token-${Date.now()}`
    }
    const encoded = encodeURIComponent(JSON.stringify(data))
    document.cookie = `upishield_session=${encoded}; path=/; max-age=31536000; SameSite=Lax`
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('upishield_manual_logout')
    }
  }
}

export function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'upishield_session=; path=/; max-age=0; SameSite=Lax'
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('upishield_manual_logout', 'true')
    }
  }
}

interface AppState {
  // Financial balance visibility privacy toggle
  privacyMasked: boolean
  togglePrivacyMask: () => void

  // User Session
  user: UserProfile | null
  token: string | null
  setUser: (user: UserProfile | null, token?: string | null) => void
  logout: () => void

  // Admin Session
  admin: UserProfile | null
  adminToken: string | null
  setAdmin: (admin: UserProfile | null, token?: string | null) => void
  adminLogout: () => void

  // Notification Drawer
  notificationOpen: boolean
  setNotificationOpen: (open: boolean) => void

  // Unread badge count
  unreadCount: number
  setUnreadCount: (count: number) => void
  decrementNotifications: () => void
}

// Initial session check without auto-granting access to fresh visitors
function getInitialSession() {
  if (typeof window !== 'undefined') {
    const isManualLogout = localStorage.getItem('upishield_manual_logout')
    if (isManualLogout === 'true') {
      return { user: null, token: null, admin: null, adminToken: null }
    }

    const userToken = localStorage.getItem('upishield_token')
    const adminToken = localStorage.getItem('upishield_admin_token')

    // If no tokens exist, stay unauthenticated
    if (!userToken && !adminToken) {
      return { user: null, token: null, admin: null, adminToken: null }
    }

    // Try reading cached session state
    try {
      const stored = localStorage.getItem('upishield-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.state) {
          return {
            user: parsed.state.user || null,
            token: parsed.state.token || userToken || null,
            admin: parsed.state.admin || null,
            adminToken: parsed.state.adminToken || adminToken || null
          }
        }
      }
    } catch {
      // Fallback below
    }

    if (adminToken) {
      return { user: null, token: null, admin: DEFAULT_ADMIN, adminToken }
    }
    if (userToken) {
      return { user: DEFAULT_USER, token: userToken, admin: null, adminToken: null }
    }
  }
  return {
    user: null,
    token: null,
    admin: null,
    adminToken: null
  }
}

const initial = getInitialSession()

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      privacyMasked: false,
      togglePrivacyMask: () => set((state) => ({ privacyMasked: !state.privacyMasked })),

      // User Session
      user: initial.user,
      token: initial.token,
      setUser: (user, token = 'demo-user-token') => {
        if (user && token) {
          const userProfile = { ...user, role: user.role || 'user' }
          localStorage.setItem('upishield_token', token)
          if (userProfile.role !== 'admin') {
            localStorage.removeItem('upishield_admin_token')
          }
          setSessionCookie({
            role: userProfile.role,
            email: userProfile.email,
            name: userProfile.name,
            token
          })
          set({
            user: userProfile,
            token,
            admin: userProfile.role === 'admin' ? (get().admin || DEFAULT_ADMIN) : null,
            adminToken: userProfile.role === 'admin' ? token : null
          })
        } else {
          localStorage.removeItem('upishield_token')
          if (get().user?.role !== 'admin') {
            localStorage.removeItem('upishield_admin_token')
          }
          clearSessionCookie()
          set({ user: null, token: null })
        }
      },
      logout: () => {
        localStorage.removeItem('upishield_token')
        localStorage.removeItem('upishield_admin_token')
        clearSessionCookie()
        set({ user: null, token: null, admin: null, adminToken: null })
      },

      // Admin Session
      admin: initial.admin,
      adminToken: initial.adminToken,
      setAdmin: (admin, adminToken = 'demo-admin-token') => {
        if (admin && adminToken) {
          const adminProfile = { ...admin, role: 'admin' }
          localStorage.setItem('upishield_admin_token', adminToken)
          setSessionCookie({
            role: 'admin',
            email: adminProfile.email,
            name: adminProfile.name,
            token: adminToken
          })
          set({ admin: adminProfile, adminToken })
        } else {
          localStorage.removeItem('upishield_admin_token')
          clearSessionCookie()
          set({ admin: null, adminToken: null })
        }
      },
      adminLogout: () => {
        localStorage.removeItem('upishield_admin_token')
        clearSessionCookie()
        set({ admin: null, adminToken: null })
      },

      notificationOpen: false,
      setNotificationOpen: (open) => set({ notificationOpen: open }),

      unreadCount: 2,
      setUnreadCount: (count) =>
        set((state) => (state.unreadCount === count ? state : { unreadCount: count })),
      decrementNotifications: () =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
    }),
    {
      name: 'upishield-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        admin: state.admin,
        adminToken: state.adminToken,
        privacyMasked: state.privacyMasked,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof document !== 'undefined') {
          if (state?.admin && state?.adminToken) {
            setSessionCookie({
              role: 'admin',
              email: state.admin.email,
              name: state.admin.name,
              token: state.adminToken
            })
          } else if (state?.user && state?.token) {
            setSessionCookie({
              role: state.user.role || 'user',
              email: state.user.email,
              name: state.user.name,
              token: state.token
            })
          }
        }
      }
    }
  )
)

export const useAuthStore = useAppStore
