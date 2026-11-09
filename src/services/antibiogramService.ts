import type { AntibiogramEntry } from '../types/api'
import { SURVEILLANCE_PERIOD } from '../utils/config'
import { apiClient } from './apiClient'

export const antibiogramService = {
  // Resistencia acumulada de un distrito: una fila por microorganismo + antibiótico.
  async byDistrict(districtId: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<AntibiogramEntry[]>('/antibiogram', {
      params: { districtId, ...SURVEILLANCE_PERIOD },
      signal,
    })
    return data
  },
}