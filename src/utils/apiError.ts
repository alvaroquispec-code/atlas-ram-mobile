import axios from 'axios'
import type { ApiErrorBody } from '../types/api'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string>
  readonly retryable: boolean

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    // 0 = sin conexión o timeout; 5xx = falla del servidor. En ambos casos tiene sentido reintentar.
    this.retryable = status === 0 || status >= 500
  }
}

const MESSAGES_BY_STATUS: Record<number, string> = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'Ese registro ya existe.',
  422: 'La operación no cumple las reglas del sistema.',
  500: 'Tuvimos un problema en el servidor. Intenta de nuevo en unos minutos.',
}

export const CANCELLED = -1

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isCancel(error)) return new ApiError('Solicitud cancelada', CANCELLED)
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const timeout = error.code === 'ECONNABORTED'
      return new ApiError(
        timeout
          ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
          : 'No hay conexión con el servidor. Revisa tu internet.',
        0,
      )
    }
    const { status, data } = error.response as { status: number; data?: ApiErrorBody }
    const serverMessage = status === 409 || status === 422 ? data?.message : undefined
    const message = serverMessage ?? MESSAGES_BY_STATUS[status] ?? 'Ocurrió un error inesperado.'
    return new ApiError(message, status, data?.fieldErrors)
  }
  return new ApiError('Ocurrió un error inesperado.', -2)
}

export const isCancelled = (error: unknown) => toApiError(error).status === CANCELLED