import { Accelerometer } from 'expo-sensors'
import { useEffect, useRef, useState } from 'react'

const THRESHOLD_G = 1.8 // en reposo la aceleración total es ~1 g (la gravedad)
const COOLDOWN_MS = 1500

/**
 * Llama a onShake cuando el usuario agita el teléfono.
 * Devuelve si el acelerómetro está disponible para que la pantalla muestre otra opción si no lo está.
 */
export function useShake(onShake: () => void, enabled = true) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const lastShake = useRef(0)
  const callback = useRef(onShake)
  callback.current = onShake

  useEffect(() => {
    if (!enabled) return
    let subscription: { remove: () => void } | undefined
    let cancelled = false

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (cancelled) return
        setIsAvailable(available)
        if (!available) return
        Accelerometer.setUpdateInterval(150)
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const force = Math.sqrt(x * x + y * y + z * z)
          const now = Date.now()
          if (force > THRESHOLD_G && now - lastShake.current > COOLDOWN_MS) {
            lastShake.current = now
            callback.current()
          }
        })
      })
      .catch(() => setIsAvailable(false))

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [enabled])

  return { isAvailable }
}