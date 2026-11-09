import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import Button from '../../components/Button'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import InfoRow from '../../components/InfoRow'
import InterpretationBadge from '../../components/InterpretationBadge'
import LoadingState from '../../components/LoadingState'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { useToast } from '../../hooks/useToast'
import { isolateService } from '../../services/isolateService'
import { toApiError } from '../../utils/apiError'
import { formatDate, SPECIMEN_LABELS } from '../../utils/labels'
import { colors, spacing } from '../../utils/theme'

export default function IsolateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isolateId = Number(id)
  const { hasRole } = useAuth()
  const { showToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  // Aislamiento y resultados en paralelo; si sales de la pantalla, se cancelan los dos.
  const { data, error, isLoading, reload } = useFetch(
    (signal) => Promise.all([isolateService.findById(isolateId, signal), isolateService.results(isolateId, signal)]),
    [isolateId],
  )

  if (!Number.isInteger(isolateId) || error?.status === 404) {
    return (
      <EmptyState
        icon="search-outline"
        title="Aislamiento no encontrado"
        message={`No existe un aislamiento con el número ${id}.`}
        action={<Button title="Volver" variant="secondary" onPress={() => router.back()} />}
      />
    )
  }
  if (isLoading) return <LoadingState label="Cargando aislamiento…" />
  if (error || !data) return <ErrorState message={error?.message ?? 'No se pudo cargar el aislamiento.'} onRetry={reload} />

  const [isolate, results] = data
  const resistant = results.filter((r) => r.interpretation === 'RESISTANT').length

  const confirmDelete = () =>
    Alert.alert('Eliminar aislamiento', 'Se borrarán también sus resultados. Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true)
          try {
            await isolateService.remove(isolate.id)
            showToast('Aislamiento eliminado')
            router.back()
          } catch (err) {
            showToast(toApiError(err).message, 'error')
            setIsDeleting(false)
          }
        },
      },
    ])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `Aislamiento #${isolate.id}` }} />

      <Card>
        <Text style={styles.organism}>{isolate.microorganismName}</Text>
        <InfoRow label="Fecha de toma" value={formatDate(isolate.collectionDate)} />
        <InfoRow label="Muestra" value={SPECIMEN_LABELS[isolate.specimenType]} />
        <InfoRow label="Establecimiento" value={isolate.facilityName} />
        <InfoRow label="Distrito" value={isolate.districtName} />
        <InfoRow label="Edad" value={isolate.patientAge === null ? '—' : `${isolate.patientAge} años`} />
        <InfoRow label="Sexo" value={isolate.patientSex ?? '—'} />
        <InfoRow label="Resistente a" value={`${resistant} de ${results.length} antibióticos`} />
      </Card>

      <Card>
        <Text style={styles.section}>Antibiograma</Text>
        {results.length === 0 && <Text style={styles.muted}>Este aislamiento aún no tiene resultados de sensibilidad.</Text>}
        {results.map((result) => (
          <View key={result.id} style={styles.result}>
            <View style={styles.resultText}>
              <Text style={styles.antibiotic}>{result.antibioticName}</Text>
              <Text style={styles.muted}>
                {result.micValue !== null ? `CIM ${result.micValue} µg/mL` : result.diskDiffusionMm !== null ? `Halo ${result.diskDiffusionMm} mm` : 'Sin valor'}
                {' · '}
                {result.breakpointStandard} {result.breakpointVersion}
              </Text>
            </View>
            <InterpretationBadge value={result.interpretation} />
          </View>
        ))}
      </Card>

      {hasRole('ADMIN') && <Button title="Eliminar aislamiento" variant="danger" onPress={confirmDelete} isLoading={isDeleting} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  organism: { fontSize: 20, fontWeight: '700', fontStyle: 'italic', color: colors.text },
  section: { fontSize: 17, fontWeight: '700', color: colors.text },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultText: { flex: 1, gap: 2 },
  antibiotic: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
})