import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
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
import type { Specimen } from '../../types/api'
import { toApiError } from '../../utils/apiError'
import { SPECIMEN_LABELS, todayIso } from '../../utils/labels'
import { colors } from '../../utils/theme'
import { optionalAge, pastOrTodayDate, required } from '../../utils/validators'

// Todos los valores del formulario son texto; los convertimos al enviar.
type IsolateForm = {
  collectionDate: string
  specimenType: string
  patientAge: string
  patientSex: string
  facilityId: string
  microorganismId: string
}

const validators: Validators<IsolateForm> = {
  collectionDate: pastOrTodayDate,
  specimenType: required('Elige el tipo de muestra'),
  patientAge: optionalAge,
  facilityId: required('Elige el establecimiento'),
  microorganismId: required('Elige el microorganismo'),
}

const SPECIMEN_OPTIONS = (Object.keys(SPECIMEN_LABELS) as Specimen[]).map((value) => ({ value, label: SPECIMEN_LABELS[value] }))
const SEX_OPTIONS = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
]

export default function NewIsolateScreen() {
  const { showToast } = useToast()
  const catalogs = useFetch(
    (signal) => Promise.all([catalogService.facilities(signal), catalogService.microorganisms(signal)]),
    [],
  )
  const { values, errors, setValue, submit, setServerErrors } = useForm<IsolateForm>(
    { collectionDate: todayIso(), specimenType: '', patientAge: '', patientSex: '', facilityId: '', microorganismId: '' },
    validators,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [facilities, microorganisms] = catalogs.data ?? [[], []]
  const facilityOptions = useMemo(() => facilities.map((f) => ({ value: String(f.id), label: f.code })), [facilities])
  const microorganismOptions = useMemo(
    () => microorganisms.map((m) => ({ value: String(m.id), label: microorganismLabel(m) })),
    [microorganisms],
  )
  const selectedFacility = facilities.find((f) => String(f.id) === values.facilityId)

  const onSubmit = submit(async (form) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      const created = await isolateService.create({
        collectionDate: form.collectionDate,
        specimenType: form.specimenType as Specimen,
        patientAge: form.patientAge ? Number(form.patientAge) : null,
        patientSex: form.patientSex ? (form.patientSex as 'M' | 'F') : null,
        facilityId: Number(form.facilityId),
        microorganismId: Number(form.microorganismId),
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
      <TextField label="Edad del paciente (opcional)" value={values.patientAge} onChangeText={setValue('patientAge')} error={errors.patientAge} keyboardType="number-pad" placeholder="Ej. 34" />
      <ChipSelect label="Sexo (opcional)" options={SEX_OPTIONS} value={values.patientSex || null} onChange={setValue('patientSex')} />

      <Button title="Registrar aislamiento" onPress={onSubmit} isLoading={isSubmitting} />
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 13, marginTop: -8 },
})
