import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
  hasRole: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

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

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isRestoring, sessionExpired, login, register, logout, hasRole }),
    [user, isRestoring, sessionExpired, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}