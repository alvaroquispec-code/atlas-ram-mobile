import { useState } from 'react'
import { Alert, StyleSheet, Text } from 'react-native'
import Banner from '../../components/Banner'
import Button from '../../components/Button'
import Card from '../../components/Card'
import FormScreen from '../../components/FormScreen'
import InfoRow from '../../components/InfoRow'
import TextField from '../../components/TextField'
import { useAuth } from '../../hooks/useAuth'
import { useForm, type Validators } from '../../hooks/useForm'
import { useToast } from '../../hooks/useToast'
import { toApiError } from '../../utils/apiError'
import { ROLE_LABELS } from '../../utils/labels'
import { colors } from '../../utils/theme'
import { required, strongPassword } from '../../utils/validators'

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string }

const EMPTY: PasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' }

const validators: Validators<PasswordValues> = {
  currentPassword: required('Ingresa tu contraseña actual'),
  newPassword: (value, values) =>
    strongPassword(value) ?? (value === values.currentPassword ? 'Debe ser distinta de la actual' : undefined),
  confirmPassword: (value, values) => (value === values.newPassword ? undefined : 'Las contraseñas no coinciden'),
}

export default function ProfileScreen() {
  const { user, logout, logoutEverywhere } = useAuth()
  // La clave remonta el formulario y lo deja vacío después de un cambio exitoso.
  const [formKey, setFormKey] = useState(0)
  if (!user) return null

  // Confirmación antes de una acción que saca al usuario.
  const confirmLogout = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ])

  const confirmLogoutEverywhere = () =>
    Alert.alert(
      'Cerrar sesión en todos los dispositivos',
      'Se cerrará la sesión en la web y en cualquier celular, incluido este.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar todas', style: 'destructive', onPress: () => void logoutEverywhere() },
      ],
    )

  return (
    <FormScreen>
      <Card>
        <Text style={styles.name}>{user.fullName}</Text>
        <InfoRow label="Correo" value={user.email} />
        <InfoRow label="Rol" value={ROLE_LABELS[user.role]} />
        <InfoRow label="Miembro desde" value={user.createdAt.slice(0, 10)} />
      </Card>

      <ChangePasswordCard key={formKey} onChanged={() => setFormKey((k) => k + 1)} />

      <Button title="Cerrar sesión" variant="danger" onPress={confirmLogout} />
      <Button title="Cerrar sesión en todos los dispositivos" variant="secondary" onPress={confirmLogoutEverywhere} />
    </FormScreen>
  )
}

function ChangePasswordCard({ onChanged }: { onChanged: () => void }) {
  const { changePassword } = useAuth()
  const { showToast } = useToast()
  const { values, errors, setValue, submit, setServerErrors } = useForm<PasswordValues>(EMPTY, validators)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = submit(async (form) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      showToast('Contraseña actualizada. Se cerraron tus otras sesiones.')
      onChanged()
    } catch (err) {
      const error = toApiError(err)
      if (error.fieldErrors) setServerErrors(error.fieldErrors)
      // 422: contraseña actual incorrecta o nueva igual a la actual (mensaje del servidor).
      else setFormError(error.message)
      setIsSubmitting(false)
    }
  })

  return (
    <Card>
      <Text style={styles.title}>Cambiar contraseña</Text>
      <Text style={styles.hint}>Al cambiarla se cierran tus sesiones en los demás dispositivos.</Text>
      {formError && <Banner message={formError} />}
      <TextField
        label="Contraseña actual"
        value={values.currentPassword}
        onChangeText={setValue('currentPassword')}
        error={errors.currentPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      <TextField
        label="Nueva contraseña"
        value={values.newPassword}
        onChangeText={setValue('newPassword')}
        error={errors.newPassword}
        hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        label="Confirma la nueva contraseña"
        value={values.confirmPassword}
        onChangeText={setValue('confirmPassword')}
        error={errors.confirmPassword}
        secureTextEntry
      />
      <Button title="Guardar contraseña" onPress={onSubmit} isLoading={isSubmitting} />
    </Card>
  )
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.muted },
})
