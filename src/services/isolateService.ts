import type {
  CreateIsolatePayload,
  Interpretation,
  InterpretationPreview,
  Isolate,
  Page,
  Specimen,
  SusceptibilityResult,
} from '../types/api'
import { apiClient } from './apiClient'

export type IsolateSort = 'collectionDate,desc' | 'collectionDate,asc'

export interface IsolateFilters {
  microorganismId?: number | null
  specimen?: Specimen | null
  sort?: IsolateSort
}

export const isolateService = {
  // Filtros opcionales y combinables (el backend los arma con JPA Specifications).
  async list(page: number, size: number, filters: IsolateFilters = {}, signal?: AbortSignal) {
    const { microorganismId, specimen, sort = 'collectionDate,desc' } = filters
    const { data } = await apiClient.get<Page<Isolate>>('/isolates', {
      params: { page, size, sort, microorganismId: microorganismId ?? undefined, specimen: specimen ?? undefined },
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

  // Antibióticos que llegan después: se agregan todos o ninguno.
  async addResults(id: number, results: CreateIsolatePayload['results']) {
    const { data } = await apiClient.post<Isolate>(`/isolates/${id}/results`, { results })
    return data
  },

  /** Interpretación S/I/R que tendría un resultado, con la misma lógica que al guardar; no guarda nada. */
  async previewInterpretation(
    params: { microorganismId: number; antibioticId: number; specimen?: Specimen; mic?: string; reported?: Interpretation },
    signal?: AbortSignal,
  ) {
    const { data } = await apiClient.get<InterpretationPreview>('/isolates/interpretation-preview', { params, signal })
    return data
  },

  async remove(id: number) {
    await apiClient.delete(`/isolates/${id}`)
  },
}