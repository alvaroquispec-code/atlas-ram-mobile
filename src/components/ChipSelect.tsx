import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../utils/theme'

export interface ChipOption<T extends string | number> {
  value: T
  label: string
}

interface ChipSelectProps<T extends string | number> {
  label: string
  options: ChipOption<T>[]
  value: T | null
  onChange: (value: T) => void
  error?: string
}

// Selector de una opción con "chips": más cómodo que un <select> en el celular.
export default function ChipSelect<T extends string | number>({ label, options, value, onChange, error }: ChipSelectProps<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  error: { fontSize: 13, color: colors.danger },
})