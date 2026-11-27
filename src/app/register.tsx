import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import Banner from '../components/Banner'
import Button from '../components/Button'
import FormScreen from '../components/FormScreen'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useForm, type Validators } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { toApiError } from '../utils/apiError'
import { colors, spacing } from '../utils/theme'
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
  const [accepted, setAccepted] = useState(false)

  const onSubmit = submit(async (form) => {
    if (!accepted) {
      setFormError('Para crear la cuenta debes aceptar la política de datos personales')
      return
    }
    setIsSubmitting(true)
    setFormError(null)
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        acceptedDataPolicy: true,
      })
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

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted((a) => !a)}
        style={styles.consent}
      >
        <Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={24} color={accepted ? colors.brand : colors.muted} />
        <View style={styles.consentText}>
          <Text style={styles.consentLabel}>Acepto la política de tratamiento de datos personales (Ley 29733).</Text>
          <Text style={styles.link} onPress={() => Linking.openURL('https://atlas-ram-web.vercel.app/privacidad')}>
            Leer la política
          </Text>
        </View>
      </Pressable>

      <Button title="Crear cuenta" onPress={onSubmit} isLoading={isSubmitting} />
      <Text style={styles.intro}>
        ¿Eres profesional de la salud? Después de crear tu cuenta, pide tu rol desde la web, en «Mi cuenta».
      </Text>
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 14 },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: 44 },
  consentText: { flex: 1, gap: 2 },
  consentLabel: { color: colors.text, fontSize: 14 },
  link: { color: colors.brand, fontSize: 14, fontWeight: '600' },
})