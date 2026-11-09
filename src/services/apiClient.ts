import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '../types/api'
import { toApiError } from '../utils/apiError'
import { API_URL } from '../utils/config'
import { tokenStorage } from './tokenStorage'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']

// El AuthContext registra aquí qué hacer cuando la sesión ya no se puede renovar.
let onSessionExpired: () => void = () => {}
export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler
}

// 1) Antes de cada request: agrega el token.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si varias requests reciben 401 a la vez, todas esperan el mismo refresh.
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('Sin refresh token')
  // axios directo (no apiClient) para no pasar otra vez por este interceptor.
  const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken })
  await tokenStorage.save(data)
  return data.accessToken
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// 2) Después de cada respuesta: si es 401, renueva el token una vez y repite la request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthCall = AUTH_PATHS.some((path) => original?.url?.startsWith(path))

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        await tokenStorage.clear()
        onSessionExpired()
      }
    }
    return Promise.reject(toApiError(error))
  },
)