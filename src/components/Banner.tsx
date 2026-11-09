import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../utils/theme'

type Tone = 'error' | 'info'

export default function Banner({ message, tone = 'error' }: { message: string; tone?: Tone }) {
  return (
    <View accessibilityRole="alert" style={[styles.banner, tone === 'error' ? styles.error : styles.info]}>
      <Text style={[styles.text, { color: tone === 'error' ? colors.danger : colors.brandDark }]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.sm, padding: spacing.md, borderWidth: 1 },
  error: { backgroundColor: colors.dangerSoft, borderColor: '#fecaca' },
  info: { backgroundColor: colors.brandSoft, borderColor: '#bfdbfe' },
  text: { fontSize: 14 },
})