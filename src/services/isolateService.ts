import type { CreateIsolatePayload, Isolate, Page, SusceptibilityResult } from '../types/api'
import { apiClient } from './apiClient'

export const isolateService = {
  async list(page: number, size: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Isolate>>('/isolates', {
      params: { page, size, sort: 'collectionDate,desc' },
      signal,
    })
    return data
  },

  async findById(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<Isolate>(`/isolates/${id}`, { signal })
    return data
  },

  async results(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<SusceptibilityResult[]>(`/isolates/${id}/results`, { signal })
    return data
  },

  async create(payload: CreateIsolatePayload) {
    const { data } = await apiClient.post<Isolate>('/isolates', payload)
    return data
  },

  async remove(id: number) {
    await apiClient.delete(`/isolates/${id}`)
  },
}