import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native'
import { colors, radius, spacing } from '../utils/theme'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string
  variant?: Variant
  isLoading?: boolean
}

export default function Button({ title, variant = 'primary', isLoading = false, disabled, ...props }: ButtonProps) {
  // Deshabilitado mientras carga: evita el doble envío.
  const isDisabled = disabled || isLoading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, isDisabled && styles.disabled]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.brand : '#fff'} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryLabel: { color: colors.brand },
})