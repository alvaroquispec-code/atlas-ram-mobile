import type { District, Facility, Microorganism, Page } from '../types/api'
import { apiClient } from './apiClient'

export const catalogService = {
  async districts(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<District>>('/districts', { params: { size: 100, sort: 'name' }, signal })
    return data.content
  },

  async facilities(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Facility>>('/facilities', { params: { size: 200, sort: 'name' }, signal })
    return data.content
  },

  async microorganisms(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Microorganism>>('/microorganisms', { params: { size: 100 }, signal })
    return data.content
  },
}

export const microorganismLabel = (m: Microorganism) => `${m.genus} ${m.species ?? ''}`.trim()