import type { AntibiogramEntry, ReferralAntibiogram, Syndrome, Ward, WiscaResult } from '../types/api'
import { SURVEILLANCE_PERIOD } from '../utils/config'
import { apiClient } from './apiClient'

export const antibiogramService = {
  // Resistencia acumulada: una fila por microorganismo + antibiótico. Sin distrito, es toda Lima y Callao.
  // El backend solo devuelve combinaciones con 30 resultados o más (CLSI M39).
  async byDistrict(districtId: number | null, signal?: AbortSignal) {
    const { data } = await apiClient.get<AntibiogramEntry[]>('/antibiogram', {
      params: { districtId: districtId ?? undefined, ...SURVEILLANCE_PERIOD },
      signal,
    })
    return data
  },

  // Resistencia en los hospitales donde se atienden los pacientes del distrito.
  async referral(districtId: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<ReferralAntibiogram>('/antibiogram/referral', {
      params: { districtId, ...SURVEILLANCE_PERIOD },
      signal,
    })
    return data
  },

  // WISCA: probabilidad de que cada esquema empírico cubra el síndrome (10 000 simulaciones en el servidor).
  // ward: solo los aislamientos de ese servicio (p. ej. UCI); null = todos.
  async wisca(syndrome: Syndrome, ward: Ward | null, signal?: AbortSignal) {
    const { data } = await apiClient.get<WiscaResult>('/antibiogram/wisca', {
      params: { syndrome, ward: ward ?? undefined, ...SURVEILLANCE_PERIOD },
      signal,
      timeout: 30000,
    })
    return data
  },
}
