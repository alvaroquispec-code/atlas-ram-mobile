import type { Antibiotic, District, Facility, Microorganism, Page, Standards } from '../types/api'
import { apiClient } from './apiClient'

export const catalogService = {
  async standards(signal?: AbortSignal) {
    const { data } = await apiClient.get<Standards>('/standards', { signal })
    return data
  },

  async districts(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<District>>('/districts', { params: { size: 100, sort: 'name' }, signal })
    return data.content
  },

  async facilities(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Facility>>('/facilities', { params: { size: 200, sort: 'name' }, signal })
    return data.content
  },

  // Establecimientos donde el usuario puede registrar: un técnico solo ve los suyos.
  // Si el backend todavía no tiene el endpoint, usamos el catálogo completo.
  async myFacilities(signal?: AbortSignal) {
    try {
      const { data } = await apiClient.get<Facility[]>('/auth/me/facilities', { signal })
      return data
    } catch (err) {
      if (signal?.aborted) throw err
      return catalogService.facilities(signal)
    }
  },

  async antibiotics(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Antibiotic>>('/antibiotics', { params: { size: 100, sort: 'name' }, signal })
    return data.content
  },

  async microorganisms(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Microorganism>>('/microorganisms', { params: { size: 100 }, signal })
    return data.content
  },
}

export const microorganismLabel = (m: Microorganism) => `${m.genus} ${m.species ?? ''}`.trim()