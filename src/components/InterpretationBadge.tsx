import { StyleSheet, Text, View } from 'react-native'
import type { Interpretation } from '../types/api'
import { INTERPRETATION_LABELS } from '../utils/labels'
import { colors, radius } from '../utils/theme'

const TONES: Record<Interpretation, { background: string; text: string }> = {
  SUSCEPTIBLE: { background: colors.successSoft, text: colors.success },
  INTERMEDIATE: { background: colors.warningSoft, text: colors.warning },
  RESISTANT: { background: colors.dangerSoft, text: colors.danger },
}

export default function InterpretationBadge({ value }: { value: Interpretation }) {
  const tone = TONES[value]
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <Text style={[styles.text, { color: tone.text }]}>{INTERPRETATION_LABELS[value]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: '600' },
})