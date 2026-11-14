import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../utils/theme'

interface EmptyStateProps {
  icon?: ComponentProps<typeof Ionicons>['name']
  title: string
  message?: string
  action?: ReactNode
}

export default function EmptyState({ icon = 'file-tray-outline', title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.muted, textAlign: 'center' },
})