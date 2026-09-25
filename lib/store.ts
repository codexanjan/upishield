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

function setSessionCookie(sessionData: any) {
  if (typeof document !== 'undefined') {
    const encoded = encodeURIComponent(JSON.stringify(sessionData))
    document.cookie = `upishield_session=${encoded}; path=/; max-age=86400; SameSite=Lax`
  }
}

function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'upishield_session=; path=/; max-age=0; SameSite=Lax'
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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      privacyMasked: false,
      togglePrivacyMask: () => set((state) => ({ privacyMasked: !state.privacyMasked })),

      // User Session defaults to null for strict RBAC protection
      user: null,
      token: null,
      setUser: (user, token) => {
        if (user && token) {
          localStorage.setItem('upishield_token', token)
          setSessionCookie({
            role: user.role || 'user',
            email: user.email,
            name: user.name,
            token
          })
        } else {
          localStorage.removeItem('upishield_token')
          clearSessionCookie()
        }
        set({ user, token })
      },
      logout: () => {
        localStorage.removeItem('upishield_token')
        clearSessionCookie()
        set({ user: null, token: null })
      },

      // Admin Session defaults to null for strict RBAC protection
      admin: null,
      adminToken: null,
      setAdmin: (admin, adminToken) => {
        if (admin && adminToken) {
          localStorage.setItem('upishield_admin_token', adminToken)
          setSessionCookie({
            role: 'admin',
            email: admin.email,
            name: admin.name,
            token: adminToken
          })
        } else {
          localStorage.removeItem('upishield_admin_token')
          clearSessionCookie()
        }
        set({ admin, adminToken })
      },
      adminLogout: () => {
        localStorage.removeItem('upishield_admin_token')
        clearSessionCookie()
        set({ admin: null, adminToken: null })
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
    }
  )
)

export const useAuthStore = useAppStore
