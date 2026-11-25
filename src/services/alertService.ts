import type { AlertStatus, ResistanceAlert } from '../types/api'
import { apiClient } from './apiClient'

export const alertService = {
  // El servidor solo devuelve las alertas de los establecimientos del usuario.
  async list(status: AlertStatus | null, signal?: AbortSignal) {
    const { data } = await apiClient.get<ResistanceAlert[]>('/alerts', {
      params: status ? { status } : {},
      signal,
    })
    return data
  },
}
