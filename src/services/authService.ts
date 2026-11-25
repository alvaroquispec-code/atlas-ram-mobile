import type { AuthResponse, User } from '../types/api'
import { apiClient } from './apiClient'
import { tokenStorage } from './tokenStorage'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  fullName: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials)
    await tokenStorage.save(data)
    return authService.me()
  },

  async register(payload: RegisterData): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
    await tokenStorage.save(data)
    return authService.me()
  },

  // Al abrir la app: si hay tokens guardados, pedimos /me. Si el access token venció,
  // el interceptor lo renueva solo con el refresh token.
  async restoreSession(): Promise<User | null> {
    const { refreshToken } = await tokenStorage.load()
    if (!refreshToken) return null
    return authService.me()
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  // El servidor revoca las demás sesiones y devuelve tokens nuevos para esta.
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { data } = await apiClient.put<AuthResponse>('/auth/me/password', { currentPassword, newPassword })
    await tokenStorage.save(data)
  },

  // Invalida en el servidor todos los tokens del usuario (también los de este celular).
  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/me/logout-all')
    } finally {
      await tokenStorage.clear()
    }
  },

  logout: () => tokenStorage.clear(),
}