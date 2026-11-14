import { Link } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Banner from '../components/Banner'
import Button from '../components/Button'
import FormScreen from '../components/FormScreen'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useForm, type Validators } from '../hooks/useForm'
import { toApiError } from '../utils/apiError'
import { colors, spacing } from '../utils/theme'
import { email, required } from '../utils/validators'

type LoginValues = { email: string; password: string }

const validators: Validators<LoginValues> = {
  email,
  password: required('La contraseña es obligatoria'),
}

export default function LoginScreen() {
  const { login, sessionExpired } = useAuth()
  const { values, errors, setValue, submit } = useForm<LoginValues>({ email: '', password: '' }, validators)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = submit(async (form) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      await login({ email: form.email.trim(), password: form.password })
      // No navegamos a mano: al haber usuario, Stack.Protected muestra las pestañas.
    } catch (err) {
      const error = toApiError(err)
      setFormError(error.status === 401 ? 'Correo o contraseña incorrectos.' : error.message)
      setIsSubmitting(false)
    }
  })

  return (
    <FormScreen>
      <View style={styles.header}>
        <Text style={styles.brand}>Atlas RAM</Text>
        <Text style={styles.subtitle}>Vigilancia de resistencia antimicrobiana en Lima y Callao</Text>
      </View>

      {sessionExpired && <Banner tone="info" message="Tu sesión expiró. Vuelve a iniciar sesión." />}
      {formError && <Banner message={formError} />}

      <TextField
        label="Correo"
        value={values.email}
        onChangeText={setValue('email')}
        error={errors.email}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña"
        value={values.password}
        onChangeText={setValue('password')}
        error={errors.password}
        placeholder="Tu contraseña"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={onSubmit}
      />

      <Button title="Iniciar sesión" onPress={onSubmit} isLoading={isSubmitting} />

      <Text style={styles.footer}>
        ¿No tienes cuenta?{' '}
        <Link href="/register" style={styles.link}>
          Regístrate
        </Link>
      </Text>
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  header: { marginTop: 48, marginBottom: spacing.lg, gap: spacing.xs },
  brand: { fontSize: 32, fontWeight: '700', color: colors.brand },
  subtitle: { fontSize: 15, color: colors.muted },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 15 },
  link: { color: colors.brand, fontWeight: '600' },
})