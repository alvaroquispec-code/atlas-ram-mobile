import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import AntibiogramEditor from '../../components/AntibiogramEditor'
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
import type { Specimen, Ward } from '../../types/api'
import { emptyRowError, toPayload, type EntryRow } from '../../utils/antibiogram'
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
  patientId: string
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
  // ?from=ID: otro aislamiento del mismo paciente; el formulario se llena con sus datos.
  const { from } = useLocalSearchParams<{ from?: string }>()
  const fromId = Number(from) || null
  const catalogs = useFetch(
    (signal) =>
      Promise.all([catalogService.myFacilities(signal), catalogService.microorganisms(signal), catalogService.antibiotics(signal)]),
    [],
  )
  const { values, errors, setValue, submit, setServerErrors } = useForm<IsolateForm>(
    { collectionDate: todayIso(), specimenType: '', patientAge: '', patientSex: '', facilityId: '', microorganismId: '', ward: '', patientId: '' },
    validators,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [facilities, microorganisms, antibiotics] = catalogs.data ?? [[], [], []]
  const [rows, setRows] = useState<EntryRow[]>([])
  const [resultsError, setResultsError] = useState<string | null>(null)

  useEffect(() => {
    if (!fromId) return
    const controller = new AbortController()
    isolateService
      .findById(fromId, controller.signal)
      .then((i) => {
        setValue('collectionDate')(i.collectionDate)
        setValue('specimenType')(i.specimenType)
        if (i.facilityId) setValue('facilityId')(String(i.facilityId))
        if (i.patientAge !== null) setValue('patientAge')(String(i.patientAge))
        if (i.patientSex === 'M' || i.patientSex === 'F') setValue('patientSex')(i.patientSex)
        if (i.ward) setValue('ward')(i.ward)
      })
      .catch(() => undefined)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId])
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
    const problem = rows.length === 0 ? 'Agrega al menos un antibiótico del antibiograma' : emptyRowError(rows, antibiotics)
    if (problem) {
      setResultsError(problem)
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
        results: toPayload(rows),
        patientId: form.patientId.trim() || undefined,
        samePatientAsIsolateId: fromId ?? undefined,
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
      {fromId && <Banner tone="info" message={`Otro aislamiento del paciente del #${fromId}: se copiaron sus datos. Elige el microorganismo y su antibiograma.`} />}
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

      {!fromId && (
        <TextField
          label="Historia clínica o DNI (opcional)"
          value={values.patientId}
          onChangeText={setValue('patientId')}
          error={errors.patientId}
          hint="No se guarda: solo un seudónimo, para contar un aislamiento por paciente"
          autoCapitalize="characters"
        />
      )}

      <Text style={styles.section}>Antibiograma</Text>
      <Text style={styles.hint}>
        Agrega solo los antibióticos probados. Elige ≤, = o ≥ y escribe la CIM; si solo tienes la lectura del laboratorio,
        marca S, I o R.
      </Text>
      {resultsError && <Text style={styles.error}>{resultsError}</Text>}
      <AntibiogramEditor
        antibiotics={antibiotics}
        rows={rows}
        onChange={(r) => { setRows(r); setResultsError(null) }}
        microorganismId={values.microorganismId ? Number(values.microorganismId) : undefined}
        specimen={(values.specimenType || undefined) as Specimen | undefined}
      />

      <Button title="Registrar aislamiento" onPress={onSubmit} isLoading={isSubmitting} />
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 13, marginTop: -8 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  error: { color: colors.danger, fontSize: 13 },
})
