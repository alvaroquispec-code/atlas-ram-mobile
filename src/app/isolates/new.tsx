import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import Banner from '../../components/Banner'
import Button from '../../components/Button'
import ChipSelect from '../../components/ChipSelect'
import ErrorState from '../../components/ErrorState'
import FormScreen from '../../components/FormScreen'
import LoadingState from '../../components/LoadingState'
import TextField from '../../components/TextField'
import { useFetch } from '../../hooks/useFetch'
import { useForm, type Validators } from '../../hooks/useForm'
import { useToast } from '../../hooks/useToast'
import { catalogService, microorganismLabel } from '../../services/catalogService'
import { isolateService } from '../../services/isolateService'
import type { Interpretation, Specimen, Ward } from '../../types/api'
import { toApiError } from '../../utils/apiError'
import { SPECIMEN_LABELS, todayIso, WARD_LABELS } from '../../utils/labels'
import { colors } from '../../utils/theme'
import { pastOrTodayDate, required, requiredAge } from '../../utils/validators'

// Todos los valores del formulario son texto; los convertimos al enviar.
type IsolateForm = {
  collectionDate: string
  specimenType: string
  patientAge: string
  patientSex: string
  facilityId: string
  microorganismId: string
  ward: string
}

const validators: Validators<IsolateForm> = {
  collectionDate: pastOrTodayDate,
  specimenType: required('Elige el tipo de muestra'),
  // Sexo, edad y servicio: variables mínimas obligatorias del INS para la vigilancia nacional (WHONET-INS).
  patientAge: requiredAge,
  patientSex: required('Elige el sexo del paciente'),
  ward: required('Elige el servicio del paciente'),
  facilityId: required('Elige el establecimiento'),
  microorganismId: required('Elige el microorganismo'),
}

const SPECIMEN_OPTIONS = (Object.keys(SPECIMEN_LABELS) as Specimen[]).map((value) => ({ value, label: SPECIMEN_LABELS[value] }))
const WARD_OPTIONS = (Object.keys(WARD_LABELS) as Ward[]).map((value) => ({ value, label: WARD_LABELS[value] }))
const SEX_OPTIONS = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
]

export default function NewIsolateScreen() {
  const { showToast } = useToast()
  const catalogs = useFetch(
    (signal) =>
      Promise.all([catalogService.myFacilities(signal), catalogService.microorganisms(signal), catalogService.antibiotics(signal)]),
    [],
  )
  const { values, errors, setValue, submit, setServerErrors } = useForm<IsolateForm>(
    { collectionDate: todayIso(), specimenType: '', patientAge: '', patientSex: '', facilityId: '', microorganismId: '', ward: '' },
    validators,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [facilities, microorganisms, antibiotics] = catalogs.data ?? [[], [], []]
  // Antibiograma: un campo por antibiótico; acepta la CIM ("<=0.25", "2", ">=16") o la interpretación (S, I, R).
  const [results, setResults] = useState<Record<number, string>>({})
  const [resultsError, setResultsError] = useState<string | null>(null)
  const filledResults = Object.entries(results).filter(([, v]) => v.trim() !== '')
  const facilityOptions = useMemo(() => facilities.map((f) => ({ value: String(f.id), label: f.code })), [facilities])
  const microorganismOptions = useMemo(
    () => microorganisms.map((m) => ({ value: String(m.id), label: microorganismLabel(m) })),
    [microorganisms],
  )
  const selectedFacility = facilities.find((f) => String(f.id) === values.facilityId)

  // Si el usuario trabaja en un solo establecimiento, lo dejamos elegido.
  useEffect(() => {
    if (facilities.length === 1 && !values.facilityId) setValue('facilityId')(String(facilities[0].id))
  }, [facilities, values.facilityId, setValue])

  const onSubmit = submit(async (form) => {
    if (filledResults.length === 0) {
      setResultsError('Registra al menos un antibiótico del antibiograma')
      return
    }
    setResultsError(null)
    setIsSubmitting(true)
    setFormError(null)
    try {
      const created = await isolateService.create({
        collectionDate: form.collectionDate,
        specimenType: form.specimenType as Specimen,
        patientAge: Number(form.patientAge),
        patientSex: form.patientSex as 'M' | 'F',
        facilityId: Number(form.facilityId),
        microorganismId: Number(form.microorganismId),
        ward: form.ward as Ward,
        results: filledResults.map(([id, value]) => toResult(Number(id), value)),
      })
      showToast('Aislamiento registrado')
      router.replace(`/isolates/${created.id}`)
    } catch (err) {
      const error = toApiError(err)
      if (error.status === 403) setFormError('No estás asignado a ese establecimiento. Elige uno donde trabajes.')
      else if (error.fieldErrors) setServerErrors(error.fieldErrors)
      else setFormError(error.message)
      setIsSubmitting(false)
    }
  })

  if (catalogs.isLoading) return <LoadingState label="Cargando catálogos…" />
  if (catalogs.error) return <ErrorState message={catalogs.error.message} onRetry={catalogs.reload} />

  return (
    <FormScreen>
      {formError && <Banner message={formError} />}

      <TextField
        label="Fecha de toma"
        value={values.collectionDate}
        onChangeText={setValue('collectionDate')}
        error={errors.collectionDate}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
      />
      <ChipSelect label="Tipo de muestra" options={SPECIMEN_OPTIONS} value={values.specimenType || null} onChange={setValue('specimenType')} error={errors.specimenType} />
      <ChipSelect label="Microorganismo" options={microorganismOptions} value={values.microorganismId || null} onChange={setValue('microorganismId')} error={errors.microorganismId} />
      <ChipSelect label="Establecimiento" options={facilityOptions} value={values.facilityId || null} onChange={setValue('facilityId')} error={errors.facilityId} />
      {selectedFacility && <Text style={styles.hint}>{selectedFacility.name} · {selectedFacility.districtName}</Text>}
      <TextField label="Edad del paciente" value={values.patientAge} onChangeText={setValue('patientAge')} error={errors.patientAge} keyboardType="number-pad" placeholder="Ej. 34" />
      <ChipSelect label="Sexo" options={SEX_OPTIONS} value={values.patientSex || null} onChange={setValue('patientSex')} error={errors.patientSex} />
      <ChipSelect label="Servicio" options={WARD_OPTIONS} value={values.ward || null} onChange={setValue('ward')} error={errors.ward} />

      <Text style={styles.section}>Antibiograma</Text>
      <Text style={styles.hint}>
        Escribe la CIM como la informa el equipo (≤0,25 · 2 · ≥16) o, si solo tienes la lectura, S, I o R. Deja en
        blanco los no probados. {filledResults.length} con resultado.
      </Text>
      {resultsError && <Text style={styles.error}>{resultsError}</Text>}
      <View style={styles.results}>
        {antibiotics.map((a) => (
          <View key={a.id} style={styles.resultRow}>
            <Text style={styles.resultName}>{a.name}</Text>
            <TextInput
              accessibilityLabel={`CIM o interpretación de ${a.name}`}
              value={results[a.id] ?? ''}
              onChangeText={(v) => setResults((r) => ({ ...r, [a.id]: v }))}
              placeholder="—"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={styles.resultInput}
            />
          </View>
        ))}
      </View>

      <Button title="Registrar aislamiento" onPress={onSubmit} isLoading={isSubmitting} />
    </FormScreen>
  )
}

const INTERPRETATIONS: Record<string, Interpretation> = {
  S: 'SUSCEPTIBLE', SENSIBLE: 'SUSCEPTIBLE', I: 'INTERMEDIATE', INTERMEDIO: 'INTERMEDIATE', R: 'RESISTANT', RESISTENTE: 'RESISTANT',
}

// "S", "I" o "R" es la lectura del laboratorio; cualquier otra cosa es una CIM y la interpreta el servidor.
function toResult(antibioticId: number, raw: string) {
  const value = raw.trim()
  const interpretation = INTERPRETATIONS[value.toUpperCase()]
  return interpretation ? { antibioticId, reportedInterpretation: interpretation } : { antibioticId, mic: value }
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 13, marginTop: -8 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  error: { color: colors.danger, fontSize: 13 },
  results: { gap: 6 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  resultName: { flex: 1, color: colors.text, fontSize: 15 },
  resultInput: {
    width: 110, minHeight: 40, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 10, color: colors.text, textAlign: 'center',
  },
})
