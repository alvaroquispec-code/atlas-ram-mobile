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
import type { AntibiogramEntry, District, ReferralFacility } from '../../types/api'
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

const CITYWIDE_LABEL = 'Lima Metropolitana y Callao'

type Scope =
  | { kind: 'district' }
  | { kind: 'referral'; facilities: ReferralFacility[] }
  | { kind: 'citywide' }

// Quitamos el prefijo genérico: "Hospital Nacional Edgardo Rebagliati Martins" → "Edgardo Rebagliati Martins".
const shortName = (name: string) => name.replace(/^Hospital (Nacional )?/, '')

function DistrictAntibiogram({ district, placeLabel }: { district: District; placeLabel: string | null }) {
  // Si el distrito no reúne 30 resultados en ninguna combinación (mínimo de CLSI M39), no inventamos
  // un porcentaje. Primero usamos los hospitales donde se atienden sus pacientes; si ni así alcanza,
  // toda Lima y Callao. Siempre decimos de dónde vienen los datos.
  const { data, error, isLoading, reload } = useFetch(async (signal): Promise<{ entries: AntibiogramEntry[]; scope: Scope }> => {
    const local = await antibiogramService.byDistrict(district.id, signal)
    if (local.length > 0) return { entries: local, scope: { kind: 'district' } }
    const referral = await antibiogramService.referral(district.id, signal)
    if (referral.entries.length > 0) {
      return { entries: referral.entries, scope: { kind: 'referral', facilities: referral.facilities } }
    }
    return { entries: await antibiogramService.byDistrict(null, signal), scope: { kind: 'citywide' } }
  }, [district.id])
  const scope = data?.scope

  // Ordenamos de mayor a menor resistencia y mostramos las 15 combinaciones más preocupantes.
  const top = useMemo(
    () => [...(data?.entries ?? [])].sort((a, b) => b.resistancePercentage - a.resistancePercentage).slice(0, 15),
    [data],
  )

  return (
    <Card>
      <Text style={styles.title}>{district.name}</Text>
      {placeLabel && <Text style={styles.muted}>Ubicación detectada: {placeLabel}</Text>}

      {scope?.kind === 'referral' && (
        <>
          <Banner
            tone="info"
            message={`${district.name} todavía no reúne 30 resultados por bacteria y antibiótico, el mínimo que pide la norma CLSI M39. Te mostramos la resistencia en los hospitales donde se atienden sus pacientes.`}
          />
          <View style={styles.facilities}>
            {scope.facilities.map((facility) => (
              <Text key={facility.id} style={styles.facility}>
                {shortName(facility.name)} · {Math.round(facility.sharePercentage)} % de los pacientes de {district.name}
              </Text>
            ))}
          </View>
        </>
      )}
      {scope?.kind === 'citywide' && (
        <Banner
          tone="info"
          message={`${district.name} todavía no reúne 30 resultados por bacteria y antibiótico, el mínimo que pide la norma CLSI M39. Te mostramos ${CITYWIDE_LABEL}.`}
        />
      )}
      {scope?.kind === 'citywide' && top.length > 0 && <Text style={styles.scope}>Mostrando: {CITYWIDE_LABEL}</Text>}

      {isLoading && <LoadingState label="Calculando resistencia…" />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {!isLoading && !error && top.length === 0 && (
        <EmptyState
          icon="analytics-outline"
          title="Datos insuficientes"
          message="Todavía no hay 30 resultados por bacteria y antibiótico para calcular un porcentaje confiable."
        />
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
  scope: { fontSize: 13, fontWeight: '600', color: colors.brandDark },
  facilities: { gap: spacing.xs },
  facility: { fontSize: 13, fontWeight: '600', color: colors.brandDark },
  organism: { fontSize: 13, fontStyle: 'italic', color: colors.muted, marginTop: spacing.sm },
})