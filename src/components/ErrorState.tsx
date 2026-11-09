import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../utils/theme'
import Button from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button title="Reintentar" variant="secondary" onPress={onRetry} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  message: { color: colors.text, fontSize: 15, textAlign: 'center' },
})