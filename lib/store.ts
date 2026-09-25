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

const DEFAULT_USER: UserProfile = {
  id: 1,
  name: 'Anjan Sharma',
  email: 'demo@upishield.ai',
  mobile: '+91 98765 43210',
  role: 'admin', // Unified session with full platform rights
  status: 'active',
  primary_city: 'Bengaluru',
  secondary_city: 'Delhi'
}

const DEFAULT_ADMIN: UserProfile = {
  id: 99,
  name: 'Platform Administrator',
  email: 'admin@upishield.ai',
  role: 'admin',
  status: 'active'
}

export function setSessionCookie(sessionData: any) {
  if (typeof document !== 'undefined') {
    const data = {
      authenticated: true,
      role: 'admin', // Full access across User and Admin
      userRole: sessionData.role || 'user',
      email: sessionData.email || 'demo@upishield.ai',
      name: sessionData.name || 'Anjan Sharma',
      token: sessionData.token || 'demo-unified-token'
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
  setUser: (user: UserProfile | null, token: string | null) => void
  logout: () => void

  // Admin Session
  admin: UserProfile | null
  adminToken: string | null
  setAdmin: (admin: UserProfile | null, token: string | null) => void
  adminLogout: () => void

  // Notification Drawer
  notificationOpen: boolean
  setNotificationOpen: (open: boolean) => void

  // Unread badge count
  unreadCount: number
  setUnreadCount: (count: number) => void
  decrementNotifications: () => void
}

// Auto-check if we should bootstrap initial session
function getInitialSession() {
  if (typeof window !== 'undefined') {
    const isManualLogout = localStorage.getItem('upishield_manual_logout')
    if (isManualLogout === 'true') {
      return { user: null, token: null, admin: null, adminToken: null }
    }
  }
  return {
    user: DEFAULT_USER,
    token: 'demo-unified-token',
    admin: DEFAULT_ADMIN,
    adminToken: 'demo-admin-token'
  }
}

const initial = getInitialSession()

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      privacyMasked: false,
      togglePrivacyMask: () => set((state) => ({ privacyMasked: !state.privacyMasked })),

      // Unified Single-Sign-On Session:
      // Logging in once grants immediate access to both user and admin portals
      user: initial.user,
      token: initial.token,
      setUser: (user, token) => {
        if (user && token) {
          const unifiedUser = { ...user, role: 'admin' }
          const adminProfile = {
            id: 99,
            name: user.name || 'Platform Administrator',
            email: user.email,
            role: 'admin',
            status: 'active'
          }
          localStorage.setItem('upishield_token', token)
          localStorage.setItem('upishield_admin_token', token)
          setSessionCookie({
            role: 'admin',
            email: user.email,
            name: user.name,
            token
          })
          set({ user: unifiedUser, token, admin: adminProfile, adminToken: token })
        } else {
          localStorage.removeItem('upishield_token')
          localStorage.removeItem('upishield_admin_token')
          clearSessionCookie()
          set({ user: null, token: null, admin: null, adminToken: null })
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
      setAdmin: (admin, adminToken) => {
        if (admin && adminToken) {
          const userProfile = {
            id: 1,
            name: admin.name || 'Anjan Sharma',
            email: admin.email || 'demo@upishield.ai',
            mobile: '+91 98765 43210',
            role: 'admin',
            status: 'active',
            primary_city: 'Bengaluru',
            secondary_city: 'Delhi'
          }
          localStorage.setItem('upishield_admin_token', adminToken)
          localStorage.setItem('upishield_token', adminToken)
          setSessionCookie({
            role: 'admin',
            email: admin.email,
            name: admin.name,
            token: adminToken
          })
          set({ admin, adminToken, user: userProfile, token: adminToken })
        } else {
          localStorage.removeItem('upishield_admin_token')
          localStorage.removeItem('upishield_token')
          clearSessionCookie()
          set({ admin: null, adminToken: null, user: null, token: null })
        }
      },
      adminLogout: () => {
        localStorage.removeItem('upishield_admin_token')
        localStorage.removeItem('upishield_token')
        clearSessionCookie()
        set({ admin: null, adminToken: null, user: null, token: null })
      },

      notificationOpen: false,
      setNotificationOpen: (open) => set({ notificationOpen: open }),

      unreadCount: 2,
      setUnreadCount: (count) => set({ unreadCount: count }),
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
        // Guarantee cookie is kept alive when localStorage rehydrates
        if (typeof document !== 'undefined' && state?.token) {
          setSessionCookie({
            role: 'admin',
            email: state.user?.email || state.admin?.email || 'demo@upishield.ai',
            name: state.user?.name || state.admin?.name || 'Anjan Sharma',
            token: state.token || state.adminToken
          })
        }
      }
    }
  )
)

// Ensure session cookie is present if active session exists in client
if (typeof document !== 'undefined') {
  const current = getInitialSession()
  if (current.user && current.token) {
    if (!document.cookie.includes('upishield_session')) {
      setSessionCookie({
        role: 'admin',
        email: current.user.email,
        name: current.user.name,
        token: current.token
      })
    }
  }
}

export const useAuthStore = useAppStore
