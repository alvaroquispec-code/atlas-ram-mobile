import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Banner from '../../components/Banner'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ChipSelect from '../../components/ChipSelect'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import LoadingState from '../../components/LoadingState'
import ResistanceRow from '../../components/ResistanceRow'
import { useCurrentDistrict, type LocateStatus } from '../../hooks/useCurrentDistrict'
import { useFetch } from '../../hooks/useFetch'
import { antibiogramService } from '../../services/antibiogramService'
import { catalogService } from '../../services/catalogService'
import type { District } from '../../types/api'
import { colors, spacing } from '../../utils/theme'

const STATUS_MESSAGES: Partial<Record<LocateStatus, string>> = {
  denied: 'No diste permiso de ubicación. Puedes elegir tu distrito manualmente.',
  unavailable: 'El GPS está apagado. Actívalo o elige tu distrito manualmente.',
  outside: 'Tu ubicación está fuera de los distritos que vigilamos (Lima y Callao). Elige uno manualmente.',
  error: 'No pudimos obtener tu ubicación. Revisa tu conexión o elige tu distrito manualmente.',
}

export default function MyZoneScreen() {
  const districtsQuery = useFetch((signal) => catalogService.districts(signal), [])
  const districts = districtsQuery.data ?? []
  const { status, district, placeLabel, locate, chooseManually } = useCurrentDistrict(districts)
  const [showPicker, setShowPicker] = useState(false)

  if (districtsQuery.isLoading) return <LoadingState label="Cargando distritos…" />
  if (districtsQuery.error) return <ErrorState message={districtsQuery.error.message} onRetry={districtsQuery.reload} />

  const fallbackMessage = STATUS_MESSAGES[status]

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Resistencia en tu distrito</Text>
        <Text style={styles.muted}>
          Usamos tu ubicación para mostrarte qué antibióticos están fallando más cerca de ti.
        </Text>
        <Button title="Usar mi ubicación" onPress={locate} isLoading={status === 'locating'} />
        <Button title="Elegir distrito manualmente" variant="secondary" onPress={() => setShowPicker((v) => !v)} />
      </Card>

      {fallbackMessage && <Banner tone="info" message={fallbackMessage} />}

      {showPicker && (
        <DistrictPicker
          districts={districts}
          selectedId={district?.id ?? null}
          onSelect={(chosen) => {
            chooseManually(chosen)
            setShowPicker(false)
          }}
        />
      )}

      {district && status === 'found' && <DistrictAntibiogram district={district} placeLabel={placeLabel} />}
    </ScrollView>
  )
}

function DistrictPicker({ districts, selectedId, onSelect }: { districts: District[]; selectedId: number | null; onSelect: (d: District) => void }) {
  const options = useMemo(() => districts.map((d) => ({ value: d.id, label: d.name })), [districts])
  return (
    <Card>
      <ChipSelect
        label="Distrito"
        options={options}
        value={selectedId}
        onChange={(id) => {
          const chosen = districts.find((d) => d.id === id)
          if (chosen) onSelect(chosen)
        }}
      />
    </Card>
  )
}

function DistrictAntibiogram({ district, placeLabel }: { district: District; placeLabel: string | null }) {
  const { data, error, isLoading, reload } = useFetch((signal) => antibiogramService.byDistrict(district.id, signal), [district.id])

  // Ordenamos de mayor a menor resistencia y mostramos las 15 combinaciones más preocupantes.
  const top = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.resistancePercentage - a.resistancePercentage).slice(0, 15),
    [data],
  )

  return (
    <Card>
      <Text style={styles.title}>{district.name}</Text>
      {placeLabel && <Text style={styles.muted}>Ubicación detectada: {placeLabel}</Text>}

      {isLoading && <LoadingState label="Calculando resistencia…" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {!isLoading && !error && top.length === 0 && (
        <EmptyState icon="analytics-outline" title="Sin datos para este distrito" message="Aún no hay aislamientos registrados aquí." />
      )}

      {top.map((entry) => (
        <View key={`${entry.microorganismName}-${entry.antibioticName}`}>
          <Text style={styles.organism}>{entry.microorganismName}</Text>
          <ResistanceRow entry={entry} />
        </View>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  organism: { fontSize: 13, fontStyle: 'italic', color: colors.muted, marginTop: spacing.sm },
})