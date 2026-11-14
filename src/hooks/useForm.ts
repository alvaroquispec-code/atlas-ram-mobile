import { useCallback, useState } from 'react'

export type Validators<T> = Partial<Record<keyof T, (value: string, values: T) => string | undefined>>

/**
 * Formulario controlado con validación en tiempo real:
 * un campo muestra su error solo después de que el usuario lo tocó (o al intentar enviar).
 */
export function useForm<T extends Record<string, string>>(initialValues: T, validators: Validators<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof T, string>>>({})

  const validateField = useCallback(
    (name: keyof T, currentValues: T) => validators[name]?.(currentValues[name], currentValues),
    [validators],
  )

  const errors = (Object.keys(values) as (keyof T)[]).reduce<Partial<Record<keyof T, string>>>((acc, name) => {
    const message = serverErrors[name] ?? (touched[name] ? validateField(name, values) : undefined)
    if (message) acc[name] = message
    return acc
  }, {})

  // En React Native no hay event.target.name: cada campo llama a setValue con su nombre.
  const setValue = (name: keyof T) => (text: string) => {
    setValues((prev) => ({ ...prev, [name]: text }))
    setTouched((prev) => ({ ...prev, [name]: true }))
    setServerErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const submit = (onValid: (values: T) => void | Promise<void>) => () => {
    const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    setTouched(allTouched)
    const hasErrors = (Object.keys(values) as (keyof T)[]).some((name) => validateField(name, values))
    if (!hasErrors) return onValid(values)
  }

  return { values, errors, setValue, submit, setServerErrors }
}