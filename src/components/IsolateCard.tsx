import { Ionicons } from '@expo/vector-icons'
import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Isolate } from '../types/api'
import { formatDate, SPECIMEN_LABELS } from '../utils/labels'
import { colors, radius, spacing } from '../utils/theme'

interface IsolateCardProps {
  isolate: Isolate
  onPress: (id: number) => void
}

// memo: en una lista larga evita re-renderizar tarjetas que no cambiaron.
function IsolateCard({ isolate, onPress }: IsolateCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Abre el detalle del aislamiento"
      onPress={() => onPress(isolate.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.body}>
        <Text style={styles.title}>{isolate.microorganismName}</Text>
        <Text style={styles.meta}>
          {formatDate(isolate.collectionDate)} · {SPECIMEN_LABELS[isolate.specimenType]}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {isolate.facilityName} · {isolate.districtName}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  )
}

export default memo(IsolateCard)

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pressed: { backgroundColor: colors.brandSoft },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', fontStyle: 'italic', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
})