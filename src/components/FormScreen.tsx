import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { colors, spacing } from '../utils/theme'

// Contenedor para formularios: el teclado no tapa los campos y se puede hacer scroll.
export default function FormScreen({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
})