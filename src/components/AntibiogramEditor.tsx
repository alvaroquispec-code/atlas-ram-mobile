import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { Antibiotic, Interpretation } from '../types/api'
import { newRow, type EntryRow, type MicQualifierInput } from '../utils/antibiogram'
import { normalizeName } from '../utils/labels'
import { colors, radius, spacing } from '../utils/theme'

const QUALIFIERS: { value: MicQualifierInput; label: string; hint: string }[] = [
  { value: '<=', label: '≤', hint: 'menor o igual' },
  { value: '=', label: '=', hint: 'igual' },
  { value: '>=', label: '≥', hint: 'mayor o igual' },
]
const READINGS: { value: Interpretation; label: string; hint: string }[] = [
  { value: 'SUSCEPTIBLE', label: 'S', hint: 'sensible' },
  { value: 'INTERMEDIATE', label: 'I', hint: 'intermedio' },
  { value: 'RESISTANT', label: 'R', hint: 'resistente' },
]

interface Props {
  antibiotics: Antibiotic[]
  rows: EntryRow[]
  onChange: (rows: EntryRow[]) => void
  /** Códigos que el aislamiento ya tiene: no se ofrecen. */
  excludeCodes?: string[]
}

/**
 * Antibiograma en el celular: se agregan solo los antibióticos probados (buscador), y la CIM se elige con tres
 * botones ≤ · = · ≥ más el teclado numérico, en vez de escribir "<=" en la segunda página del teclado.
 */
export default function AntibiogramEditor({ antibiotics, rows, onChange, excludeCodes = [] }: Props) {
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')
  const used = new Set(rows.map((r) => r.antibioticId))
  const q = normalizeName(query)
  const available = antibiotics.filter(
    (a) => !used.has(a.id) && !excludeCodes.includes(a.code) && (!q || normalizeName(`${a.name} ${a.code}`).includes(q)),
  )
  const update = (id: number, patch: Partial<EntryRow>) =>
    onChange(rows.map((r) => (r.antibioticId === id ? { ...r, ...patch } : r)))

  return (
    <View style={styles.wrapper}>
      {rows.map((r) => {
        const a = antibiotics.find((x) => x.id === r.antibioticId)
        return (
          <View key={r.antibioticId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{a?.name} <Text style={styles.code}>{a?.code}</Text></Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${a?.name}`}
                hitSlop={10}
                onPress={() => onChange(rows.filter((x) => x.antibioticId !== r.antibioticId))}
              >
                <Ionicons name="close-circle-outline" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <View style={styles.line}>
              <Text style={styles.label}>CIM</Text>
              <Segmented options={QUALIFIERS} value={r.qualifier} onSelect={(v) => update(r.antibioticId, { qualifier: v })} />
              <TextInput
                accessibilityLabel={`Valor de la CIM de ${a?.name} en microgramos por mililitro`}
                value={r.value}
                onChangeText={(v) => update(r.antibioticId, { value: v.replace(/[^0-9.,/]/g, '') })}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Text style={styles.unit}>µg/mL</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.label}>Lectura</Text>
              <Segmented
                options={READINGS}
                value={r.reported}
                onSelect={(v) => update(r.antibioticId, { reported: r.reported === v ? '' : v })}
              />
              <Text style={styles.unit}>opcional</Text>
            </View>
          </View>
        )
      })}

      {picking ? (
        <View style={styles.picker}>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar antibiótico…"
            placeholderTextColor={colors.muted}
            style={styles.search}
          />
          {available.slice(0, 30).map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              onPress={() => {
                onChange([...rows, newRow(a.id)])
                setPicking(false)
                setQuery('')
              }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Text style={styles.optionText}>{a.name} <Text style={styles.code}>{a.code}</Text></Text>
            </Pressable>
          ))}
          {available.length === 0 && <Text style={styles.unit}>No hay antibióticos con ese nombre.</Text>}
          <Pressable onPress={() => { setPicking(false); setQuery('') }} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setPicking(true)} style={styles.add}>
          <Ionicons name="add-circle-outline" size={22} color={colors.brand} />
          <Text style={styles.addText}>Agregar antibiótico</Text>
        </Pressable>
      )}
    </View>
  )
}

function Segmented<T extends string>({ options, value, onSelect }: {
  options: { value: T; label: string; hint: string }[]
  value: T | ''
  onSelect: (value: T) => void
}) {
  return (
    <View accessibilityRole="radiogroup" style={styles.segmented}>
      {options.map((o, i) => {
        const selected = value === o.value
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.hint}
            onPress={() => onSelect(o.value)}
            style={[styles.segment, i > 0 && styles.segmentDivider, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  card: {
    gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  code: { fontSize: 13, fontWeight: '400', color: colors.muted },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 58, fontSize: 14, color: colors.muted },
  unit: { fontSize: 13, color: colors.muted },
  input: {
    width: 76, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, fontSize: 16, color: colors.text, textAlign: 'center', backgroundColor: colors.surface,
  },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  segment: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  segmentSelected: { backgroundColor: colors.brand },
  segmentText: { fontSize: 17, fontWeight: '600', color: colors.text },
  segmentTextSelected: { color: '#fff' },
  add: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.brand, justifyContent: 'center',
  },
  addText: { fontSize: 15, fontWeight: '600', color: colors.brand },
  picker: { gap: 2, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  search: {
    minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md,
    fontSize: 16, color: colors.text, marginBottom: spacing.xs,
  },
  option: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  optionPressed: { backgroundColor: colors.brandSoft },
  optionText: { fontSize: 15, color: colors.text },
  cancel: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { color: colors.muted, fontSize: 14 },
})
