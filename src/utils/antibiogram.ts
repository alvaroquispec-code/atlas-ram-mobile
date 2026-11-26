import type { Antibiotic, Interpretation } from '../types/api'

export type MicQualifierInput = '<=' | '=' | '>='

/** Un antibiótico del antibiograma mientras se escribe. */
export interface EntryRow {
  antibioticId: number
  qualifier: MicQualifierInput
  value: string
  reported: Interpretation | ''
}

export const newRow = (antibioticId: number): EntryRow => ({ antibioticId, qualifier: '=', value: '', reported: '' })
export const isFilled = (r: EntryRow) => r.value.trim() !== '' || r.reported !== ''

/** Lo que espera el servidor: la CIM como texto con su calificador ("<=0.25", ">=16", "2"). */
export function toPayload(rows: EntryRow[]) {
  return rows.map((r) => ({
    antibioticId: r.antibioticId,
    mic: r.value.trim() ? `${r.qualifier === '=' ? '' : r.qualifier}${r.value.trim().replace(',', '.')}` : undefined,
    reportedInterpretation: r.reported || undefined,
  }))
}

/** Mensaje si alguna fila agregada quedó vacía. */
export function emptyRowError(rows: EntryRow[], antibiotics: Antibiotic[]) {
  const empty = rows.find((r) => !isFilled(r))
  if (!empty) return null
  const name = antibiotics.find((a) => a.id === empty.antibioticId)?.name ?? 'Un antibiótico'
  return `${name}: escribe la CIM o marca S, I o R (o quítalo)`
}
