import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import AntibiogramEditor from '../../components/AntibiogramEditor'
import Banner from '../../components/Banner'
import Button from '../../components/Button'
import ErrorState from '../../components/ErrorState'
import FormScreen from '../../components/FormScreen'
import LoadingState from '../../components/LoadingState'
import { useFetch } from '../../hooks/useFetch'
import { useToast } from '../../hooks/useToast'
import { catalogService } from '../../services/catalogService'
import { isolateService } from '../../services/isolateService'
import { emptyRowError, toPayload, type EntryRow } from '../../utils/antibiogram'
import { toApiError } from '../../utils/apiError'
import { colors } from '../../utils/theme'

/** Antibióticos que llegan después (por ejemplo, la segunda lectura del panel): se agregan todos o ninguno. */
export default function AddResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isolateId = Number(id)
  const { showToast } = useToast()
  const { data, error, isLoading, reload } = useFetch(
    (signal) =>
      Promise.all([isolateService.findById(isolateId, signal), isolateService.results(isolateId, signal), catalogService.antibiotics(signal)]),
    [isolateId],
  )
  const [rows, setRows] = useState<EntryRow[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) return <LoadingState label="Cargando aislamiento…" />
  if (error || !data) return <ErrorState message={error?.message ?? 'No se pudo cargar el aislamiento.'} onRetry={reload} />
  const [isolate, results, antibiotics] = data

  const save = async () => {
    const problem = rows.length === 0 ? 'Agrega al menos un antibiótico' : emptyRowError(rows, antibiotics)
    if (problem) {
      setFormError(problem)
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      await isolateService.addResults(isolateId, toPayload(rows))
      showToast(`${rows.length} antibiótico(s) agregado(s)`)
      router.back()
    } catch (err) {
      setFormError(toApiError(err).message)
      setIsSaving(false)
    }
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: `Agregar a #${isolateId}` }} />
      <Text style={styles.title}>{isolate.microorganismName}</Text>
      <Text style={styles.hint}>
        Ya tiene {results.length} antibiótico(s); aquí solo aparecen los que faltan. Se guardan todos juntos o ninguno.
      </Text>
      {formError && <Banner message={formError} />}
      <AntibiogramEditor
        antibiotics={antibiotics}
        rows={rows}
        onChange={(r) => { setRows(r); setFormError(null) }}
        excludeCodes={results.map((r) => r.antibioticCode)}
      />
      <Button title="Guardar" onPress={save} isLoading={isSaving} />
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', fontStyle: 'italic', color: colors.text },
  hint: { color: colors.muted, fontSize: 13 },
})
