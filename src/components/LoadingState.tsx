import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../utils/theme'

export default function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.container} accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  label: { color: colors.muted, fontSize: 15 },
})