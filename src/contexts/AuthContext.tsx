import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { setSessionExpiredHandler } from '../services/apiClient'
import { authService, type LoginCredentials, type RegisterData } from '../services/authService'
import type { Role, User } from '../types/api'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isRestoring: boolean
  sessionExpired: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterData) => Promise<void>
  logout: () => Promise<void>
  logoutEverywhere: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  hasRole: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// Cada cuánto se verifica que la sesión siga vigente mientras la app está en primer plano. Si se cerró desde
// otro dispositivo (o se cambió la contraseña), /auth/me responde 401, el refresh falla y se vuelve al login.
const SESSION_CHECK_MS = 30_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    // Si el refresh falla, el interceptor nos avisa. Al quedar user en null,
    // el Stack.Protected del layout saca al usuario de las pantallas privadas y lo lleva a /login.
    setSessionExpiredHandler(() => {
      setUser(null)
      setSessionExpired(true)
    })
  }, [])

  useEffect(() => {
    authService
      .restoreSession()
      .then(setUser)
      .catch(() => authService.logout())
      .finally(() => setIsRestoring(false))
  }, [])

  // Verificación de sesión: al volver la app a primer plano y cada 30 s mientras está abierta.
  const isLoggedIn = !!user
  useEffect(() => {
    if (!isLoggedIn) return
    const check = () => {
      if (AppState.currentState === 'active') authService.me().catch(() => {})
    }
    const timer = setInterval(check, SESSION_CHECK_MS)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
    })
    return () => {
      clearInterval(timer)
      subscription.remove()
    }
  }, [isLoggedIn])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setUser(await authService.login(credentials))
    setSessionExpired(false)
  }, [])

  const register = useCallback(async (payload: RegisterData) => {
    setUser(await authService.register(payload))
    setSessionExpired(false)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const logoutEverywhere = useCallback(async () => {
    try {
      await authService.logoutAll()
    } finally {
      setUser(null)
    }
  }, [])

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string) => authService.changePassword(currentPassword, newPassword),
    [],
  )

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isRestoring,
      sessionExpired,
      login,
      register,
      logout,
      logoutEverywhere,
      changePassword,
      hasRole,
    }),
    [user, isRestoring, sessionExpired, login, register, logout, logoutEverywhere, changePassword, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}