import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Card from '../../components/Card'
import ChipSelect from '../../components/ChipSelect'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import { useFetch } from '../../hooks/useFetch'
import { alertService } from '../../services/alertService'
import type { AlertStatus, ResistanceAlert } from '../../types/api'
import { colors, radius, spacing } from '../../utils/theme'

const FILTERS: { value: AlertStatus | 'ALL'; label: string }[] = [
  { value: 'OPEN', label: 'Abiertas' },
  { value: 'ACKNOWLEDGED', label: 'Reconocidas' },
  { value: 'CLOSED', label: 'Cerradas' },
  { value: 'ALL', label: 'Todas' },
]
const STATUS_LABELS: Record<AlertStatus, string> = { OPEN: 'Abierta', ACKNOWLEDGED: 'Reconocida', CLOSED: 'Cerrada' }

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
const formatP = (p: number) => (p < 0.0001 ? 'p < 0.0001' : `p = ${p.toFixed(4)}`)

export default function AlertsScreen() {
  const [filter, setFilter] = useState<AlertStatus | 'ALL'>('OPEN')
  const { data, error, isLoading, reload } = useFetch(
    (signal) => alertService.list(filter === 'ALL' ? null : filter, signal),
    [filter],
  )

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading && !!data} onRefresh={reload} />}
    >
      <Card>
        <Text style={styles.title}>Alertas de brote</Text>
        <Text style={styles.muted}>
          Tras cada carga, se comparan las 4 semanas más recientes con datos de cada hospital con sus propios 12 meses
          anteriores. Es una señal
          temprana: la confirmación es del comité de infecciones.
        </Text>
        <ChipSelect label="Estado" options={FILTERS} value={filter} onChange={setFilter} />
      </Card>

      {isLoading && !data && <LoadingState label="Cargando alertas…" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState icon="shield-checkmark-outline" title="Sin alertas" message="No hay alertas en este estado." />
      )}
      {data?.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
    </ScrollView>
  )
}

function AlertCard({ alert }: { alert: ResistanceAlert }) {
  const open = alert.status !== 'CLOSED'
  return (
    <Card style={open ? styles.openCard : undefined}>
      <View style={styles.header}>
        <Text style={styles.organism}>{alert.microorganismName}</Text>
        <Text style={[styles.badge, open ? styles.badgeOpen : styles.badgeClosed]}>{STATUS_LABELS[alert.status]}</Text>
      </View>
      <Text style={styles.text}>Resistente a {alert.antibioticClass.toLowerCase()} · marcador: {alert.antibioticName}</Text>
      <Text style={styles.muted}>
        {alert.facilityName} · detectada el {formatDate(alert.detectedOn)}
      </Text>
      <View style={styles.numbers}>
        <View style={styles.number}>
          <Text style={styles.meta}>
            Última ventana: {formatDate(alert.windowStart)} – {formatDate(alert.windowEnd)}
          </Text>
          <Text style={[styles.big, { color: colors.danger }]}>{Math.round(alert.observedPercentage)} %</Text>
          <Text style={styles.meta}>{alert.resistantCount} de {alert.testedCount}</Text>
        </View>
        <View style={styles.number}>
          <Text style={styles.meta}>12 meses antes</Text>
          <Text style={styles.big}>{Math.round(alert.baselinePercentage)} %</Text>
          <Text style={styles.meta}>{alert.baselineResistant} de {alert.baselineTested}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Prueba binomial exacta: {formatP(alert.pValue)}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  text: { fontSize: 15, color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  openCard: { borderColor: '#fecaca' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  organism: { fontSize: 16, fontWeight: '700', fontStyle: 'italic', color: colors.text, flexShrink: 1 },
  badge: { fontSize: 12, fontWeight: '600', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
  badgeOpen: { backgroundColor: colors.dangerSoft, color: colors.danger },
  badgeClosed: { backgroundColor: colors.border, color: colors.muted },
  numbers: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  number: { flex: 1 },
  big: { fontSize: 22, fontWeight: '700', color: colors.text },
})
