import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Banner from '../../components/Banner'
import Card from '../../components/Card'
import ChipSelect from '../../components/ChipSelect'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import { useFetch } from '../../hooks/useFetch'
import { antibiogramService } from '../../services/antibiogramService'
import type { Syndrome, WiscaRegimen } from '../../types/api'
import { colors, radius, spacing } from '../../utils/theme'

const SYNDROMES: { value: Syndrome; label: string }[] = [
  { value: 'BACTEREMIA', label: 'Bacteriemia' },
  { value: 'URINARY', label: 'Urinaria' },
  { value: 'RESPIRATORY', label: 'Respiratoria' },
  { value: 'SKIN_SOFT_TISSUE', label: 'Piel y partes blandas' },
  { value: 'MENINGITIS', label: 'Meningitis' },
]

function coverageColor(percentage: number) {
  if (percentage >= 90) return colors.success
  if (percentage >= 70) return colors.warning
  return colors.danger
}

export default function TreatmentScreen() {
  const [syndrome, setSyndrome] = useState<Syndrome>('BACTEREMIA')
  const { data, error, isLoading, reload } = useFetch((signal) => antibiogramService.wisca(syndrome, signal), [syndrome])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Tratamiento empírico</Text>
        <Text style={styles.muted}>
          Antes de tener el cultivo: qué probabilidad tiene cada esquema de cubrir el germen que cause el cuadro, según
          los gérmenes y la resistencia de Lima y Callao (WISCA bayesiano).
        </Text>
        <ChipSelect label="Síndrome" options={SYNDROMES} value={syndrome} onChange={setSyndrome} />
      </Card>

      <Banner tone="info" message="Es un apoyo a la decisión, no una indicación de tratamiento. La decisión es del médico tratante." />

      {isLoading && <LoadingState label="Calculando cobertura…" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}

      {data && !isLoading && (
        <>
          {!data.sufficientData && (
            <Banner tone="error" message={`Solo ${data.isolates} aislamientos: la estimación es muy incierta.`} />
          )}
          <Card>
            <Text style={styles.subtitle}>Gérmenes más frecuentes</Text>
            {data.pathogens.slice(0, 4).map((p) => (
              <Text key={p.name} style={styles.muted}>
                <Text style={styles.italic}>{p.name}</Text> · {Math.round(p.frequency)} %
              </Text>
            ))}
            <Text style={styles.meta}>{data.isolates} aislamientos (primer aislamiento por paciente)</Text>
          </Card>
          <Card>
            <Text style={styles.subtitle}>Esquemas, de mayor a menor cobertura</Text>
            {data.regimens.map((r, index) => (
              <RegimenRow key={r.code} regimen={r} best={index === 0} target={data.targetCoverage} />
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  )
}

function RegimenRow({ regimen, best, target }: { regimen: WiscaRegimen; best: boolean; target: number }) {
  const median = Math.round(regimen.coverageMedian)
  const low = Math.max(0, regimen.credibleLow)
  const high = Math.min(100, regimen.credibleHigh)
  const color = coverageColor(regimen.coverageMedian)
  return (
    <View style={styles.regimen} accessibilityLabel={`${regimen.antibioticNames.join(' más ')}: cobertura ${median} %`}>
      <View style={styles.header}>
        <Text style={styles.name}>{regimen.antibioticNames.join(' + ')}</Text>
        <Text style={[styles.percentage, { color }]}>{median} %</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.interval, { left: `${low}%`, width: `${Math.max(1, high - low)}%`, backgroundColor: color }]} />
        <View style={[styles.target, { left: `${target}%` }]} />
      </View>
      <Text style={styles.meta}>
        Entre {Math.round(low)} y {Math.round(high)} % (95 %) · {Math.round(regimen.probabilityBest * 100)} % de ser el mejor
        {best ? ' · mayor cobertura' : ''}
      </Text>
      {regimen.untestedPathogens.length > 0 && (
        <Text style={styles.warning}>Sin pruebas contra: {regimen.untestedPathogens.join(', ')} (se cuentan como no cubiertos)</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  italic: { fontStyle: 'italic' },
  meta: { fontSize: 12, color: colors.muted },
  warning: { fontSize: 12, color: colors.warning },
  regimen: { gap: spacing.xs, paddingVertical: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  name: { fontSize: 15, color: colors.text, flexShrink: 1 },
  percentage: { fontSize: 15, fontWeight: '700' },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  interval: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill },
  target: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.text },
})
