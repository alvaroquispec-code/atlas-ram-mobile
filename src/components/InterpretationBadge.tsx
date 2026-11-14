import { StyleSheet, Text, View } from 'react-native'
import type { Interpretation } from '../types/api'
import { INTERPRETATION_LABELS } from '../utils/labels'
import { colors, radius } from '../utils/theme'

// Fondo suave + borde: igual que los badges de la web (bg-*-50 + ring-*-200).
const TONES: Record<Interpretation, { background: string; border: string; text: string }> = {
  SUSCEPTIBLE: { background: colors.successSoft, border: '#a7f3d0', text: colors.success },
  INTERMEDIATE: { background: colors.warningSoft, border: '#fde68a', text: colors.warning },
  RESISTANT: { background: colors.dangerSoft, border: '#fecaca', text: colors.danger },
}

export default function InterpretationBadge({ value }: { value: Interpretation }) {
  const tone = TONES[value]
  return (
    <View style={[styles.badge, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <Text style={[styles.text, { color: tone.text }]}>{INTERPRETATION_LABELS[value]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: '600' },
})
