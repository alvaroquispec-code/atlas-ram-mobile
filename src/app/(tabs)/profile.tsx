import { Alert, ScrollView, StyleSheet, Text } from 'react-native'
import Button from '../../components/Button'
import Card from '../../components/Card'
import InfoRow from '../../components/InfoRow'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS } from '../../utils/labels'
import { colors, spacing } from '../../utils/theme'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  if (!user) return null

  // Confirmación antes de una acción que saca al usuario.
  const confirmLogout = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.name}>{user.fullName}</Text>
        <InfoRow label="Correo" value={user.email} />
        <InfoRow label="Rol" value={ROLE_LABELS[user.role]} />
        <InfoRow label="Miembro desde" value={user.createdAt.slice(0, 10)} />
      </Card>
      <Button title="Cerrar sesión" variant="danger" onPress={confirmLogout} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
})