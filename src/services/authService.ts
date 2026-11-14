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

  logout: () => tokenStorage.clear(),
}