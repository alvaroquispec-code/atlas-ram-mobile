import { todayIso } from './labels'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export type Validator = (value: string) => string | undefined

export const required = (message: string): Validator => (value) => (value.trim() ? undefined : message)

export const email: Validator = (value) => {
  if (!value.trim()) return 'El correo es obligatorio'
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'Ingresa un correo válido'
}

export const strongPassword: Validator = (value) =>
  STRONG_PASSWORD.test(value) ? undefined : 'Mínimo 8 caracteres, con una mayúscula, una minúscula y un número'

export const pastOrTodayDate: Validator = (value) => {
  if (!ISO_DATE.test(value)) return 'Usa el formato AAAA-MM-DD'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Fecha inválida'
  // Comparar textos ISO funciona porque tienen el mismo formato.
  return value > todayIso() ? 'La fecha no puede ser futura' : undefined
}

export const optionalAge: Validator = (value) => {
  if (!value.trim()) return undefined
  const age = Number(value)
  return Number.isInteger(age) && age >= 0 && age <= 120 ? undefined : 'Edad entre 0 y 120'
}