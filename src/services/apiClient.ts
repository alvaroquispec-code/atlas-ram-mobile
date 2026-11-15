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

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _attempt?: number }

// En el celular la señal se corta seguido. Un GET que falla por red, timeout o 5xx se repite
// hasta 2 veces (500 ms y 1 s). POST y DELETE no se repiten para no duplicar registros.
const MAX_RETRIES = 2
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 2) Después de cada respuesta: si es 401, renueva el token una vez y repite la request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthCall = AUTH_PATHS.some((path) => original?.url?.startsWith(path))
    const status = error.response?.status
    const isRecoverable = !axios.isCancel(error) && (status === undefined || status >= 500)
    const isIdempotent = (original?.method ?? 'get').toLowerCase() === 'get'

    // 3) Reintento automático con espera exponencial para errores recuperables.
    if (original && isRecoverable && isIdempotent && (original._attempt ?? 0) < MAX_RETRIES) {
      original._attempt = (original._attempt ?? 0) + 1
      await wait(500 * 2 ** (original._attempt - 1))
      if (!original.signal?.aborted) return apiClient(original)
    }

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