import { StyleSheet, Text, View } from 'react-native'
import type { AntibiogramEntry } from '../types/api'
import { colors, radius, spacing } from '../utils/theme'

// Mismo umbral que usan los antibiogramas: con menos de 30 aislamientos el % no es confiable.
const MIN_TESTED = 30

function barColor(percentage: number) {
  if (percentage >= 50) return colors.danger
  if (percentage >= 20) return colors.warning
  return colors.success
}

export default function ResistanceRow({ entry }: { entry: AntibiogramEntry }) {
  const percentage = Math.round(entry.resistancePercentage)
  const reliable = entry.totalTested >= MIN_TESTED
  return (
    <View style={styles.row} accessibilityLabel={`${entry.antibioticName}: ${percentage}% resistente`}>
      <View style={styles.header}>
        <Text style={styles.name}>{entry.antibioticName}</Text>
        <Text style={[styles.percentage, { color: barColor(percentage) }]}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: barColor(percentage) }]} />
      </View>
      <Text style={styles.meta}>
        {entry.resistantCount} resistentes de {entry.totalTested}
        {reliable ? '' : ' · pocos datos, interpretar con cuidado'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 15, color: colors.text, flexShrink: 1 },
  percentage: { fontSize: 15, fontWeight: '700' },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill },
  meta: { fontSize: 12, color: colors.muted },
})