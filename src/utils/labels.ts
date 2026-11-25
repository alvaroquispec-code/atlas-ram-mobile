import type { Interpretation, Role, Specimen } from '../types/api'

export const SPECIMEN_LABELS: Record<Specimen, string> = {
  BLOOD: 'Sangre',
  URINE: 'Orina',
  RESPIRATORY: 'Respiratoria',
  WOUND: 'Herida',
  CSF: 'Líquido cefalorraquídeo',
  STOOL: 'Heces',
  OTHER: 'Otra',
}

export const INTERPRETATION_LABELS: Record<Interpretation, string> = {
  SUSCEPTIBLE: 'Sensible',
  INTERMEDIATE: 'Intermedio',
  RESISTANT: 'Resistente',
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  LAB_TECHNICIAN: 'Técnico de laboratorio',
  EPIDEMIOLOGIST: 'Epidemiólogo',
  PHARMACIST: 'Farmacéutico',
  PUBLIC_VIEWER: 'Consulta pública',
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']

// Formateamos a mano: Intl no siempre trae el idioma español en Android.
export function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`
}

export function todayIso() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// "San Martín de Porres" y "SAN MARTIN DE PORRES" deben considerarse iguales.
export const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^distrito de /i, '')
    .trim()
    .toLowerCase()

/** ">=16" → "≥ 16", "<=0.25" → "≤ 0.25": el calificador indica que la CIM está fuera del rango del panel. */
export function formatMic(display: string | null | undefined, value: number | null): string | null {
  const text = display ?? (value === null ? null : String(value))
  if (!text) return null
  return text.replace(/^>=/, '≥ ').replace(/^<=/, '≤ ').replace(/^>/, '> ').replace(/^</, '< ')
}
