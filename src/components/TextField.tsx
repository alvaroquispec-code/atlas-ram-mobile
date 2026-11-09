import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, radius, spacing } from '../utils/theme'

interface TextFieldProps extends TextInputProps {
  label: string
  error?: string
  hint?: string
}

export default function TextField({ label, error, hint, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 13, color: colors.danger },
  hint: { fontSize: 13, color: colors.muted },
})