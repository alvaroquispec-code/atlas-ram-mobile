import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import Banner from '../components/Banner'
import Button from '../components/Button'
import FormScreen from '../components/FormScreen'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useForm, type Validators } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { toApiError } from '../utils/apiError'
import { colors } from '../utils/theme'
import { email, required, strongPassword } from '../utils/validators'

type RegisterValues = { fullName: string; email: string; password: string; confirmPassword: string }

const validators: Validators<RegisterValues> = {
  fullName: required('Tu nombre es obligatorio'),
  email,
  password: strongPassword,
  confirmPassword: (value, values) => (value === values.password ? undefined : 'Las contraseñas no coinciden'),
}

export default function RegisterScreen() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const { values, errors, setValue, submit, setServerErrors } = useForm<RegisterValues>(
    { fullName: '', email: '', password: '', confirmPassword: '' },
    validators,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = submit(async (form) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password })
      showToast('Cuenta creada. ¡Bienvenido!')
    } catch (err) {
      const error = toApiError(err)
      if (error.status === 409) setServerErrors({ email: 'Ya existe una cuenta con este correo' })
      else if (error.fieldErrors) setServerErrors(error.fieldErrors)
      else setFormError(error.message)
      setIsSubmitting(false)
    }
  })

  return (
    <FormScreen>
      <Text style={styles.intro}>Las cuentas nuevas tienen acceso de consulta. Un administrador puede asignarte otro rol.</Text>
      {formError && <Banner message={formError} />}

      <TextField label="Nombre completo" value={values.fullName} onChangeText={setValue('fullName')} error={errors.fullName} placeholder="Ana Pérez" autoComplete="name" />
      <TextField label="Correo" value={values.email} onChangeText={setValue('email')} error={errors.email} placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <TextField label="Contraseña" value={values.password} onChangeText={setValue('password')} error={errors.password} hint="Mínimo 8 caracteres, con mayúscula, minúscula y número" secureTextEntry autoComplete="new-password" />
      <TextField label="Confirma tu contraseña" value={values.confirmPassword} onChangeText={setValue('confirmPassword')} error={errors.confirmPassword} secureTextEntry />

      <Button title="Crear cuenta" onPress={onSubmit} isLoading={isSubmitting} />
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 14 },
})