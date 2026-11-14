import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import Banner from '../../components/Banner'
import Button from '../../components/Button'
import Card from '../../components/Card'
import LoadingState from '../../components/LoadingState'
import TextField from '../../components/TextField'
import { useToast } from '../../hooks/useToast'
import { parseIsolateQr } from '../../utils/qr'
import { colors, radius, spacing } from '../../utils/theme'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [isFocused, setIsFocused] = useState(false)
  const [manualId, setManualId] = useState('')
  const [manualError, setManualError] = useState<string | undefined>()
  const { showToast } = useToast()
  // Evita abrir varias veces el mismo detalle: la cámara lee el QR muchas veces por segundo.
  const handled = useRef(false)

  // La cámara solo se monta mientras la pestaña está visible (ahorra batería y libera la cámara).
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true)
      handled.current = false
      return () => setIsFocused(false)
    }, []),
  )

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return
    const id = parseIsolateQr(data)
    if (id === null) {
      handled.current = true
      showToast('Ese QR no es una etiqueta de Atlas RAM', 'error')
      setTimeout(() => (handled.current = false), 2000)
      return
    }
    handled.current = true
    router.push(`/isolates/${id}`)
  }

  const openManual = () => {
    const id = parseIsolateQr(manualId)
    if (id === null) {
      setManualError('Ingresa el número del aislamiento')
      return
    }
    setManualError(undefined)
    router.push(`/isolates/${id}`)
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!permission ? (
        <LoadingState label="Preparando la cámara…" />
      ) : permission.granted ? (
        <View style={styles.cameraBox}>
          {isFocused && (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={onScanned}
            />
          )}
          <View style={styles.frame} pointerEvents="none" />
        </View>
      ) : (
        <Card>
          <Text style={styles.title}>Permiso de cámara</Text>
          <Text style={styles.muted}>Necesitamos la cámara para leer el código QR de la etiqueta de la muestra.</Text>
          {permission.canAskAgain ? (
            <Button title="Permitir cámara" onPress={requestPermission} />
          ) : (
            <>
              <Banner tone="info" message="Bloqueaste el permiso. Actívalo desde los ajustes del teléfono o usa el número abajo." />
              <Button title="Abrir ajustes" variant="secondary" onPress={() => Linking.openSettings()} />
            </>
          )}
        </Card>
      )}

      <Text style={styles.muted}>Apunta al QR de la etiqueta de la muestra para abrir su antibiograma.</Text>

      {/* Alternativa sin cámara: escribir el número que va impreso debajo del QR. */}
      <Card>
        <TextField
          label="¿Sin cámara? Escribe el número del aislamiento"
          value={manualId}
          onChangeText={setManualId}
          error={manualError}
          keyboardType="number-pad"
          placeholder="Ej. 1024"
          onSubmitEditing={openManual}
        />
        <Button title="Abrir aislamiento" variant="secondary" onPress={openManual} />
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  cameraBox: { height: 320, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  frame: { width: 200, height: 200, borderWidth: 3, borderColor: '#fff', borderRadius: radius.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, textAlign: 'center' },
})
