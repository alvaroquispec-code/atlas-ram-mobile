import * as Location from 'expo-location'
import { useCallback, useState } from 'react'
import { geocodingService } from '../services/geocodingService'
import type { District } from '../types/api'
import { normalizeName } from '../utils/labels'

export type LocateStatus = 'idle' | 'locating' | 'found' | 'denied' | 'unavailable' | 'outside' | 'error'

/**
 * GPS (expo-location) + geocodificación inversa (Nominatim) para saber en qué distrito está el usuario.
 * Cada fallo tiene su propio estado para que la pantalla muestre un mensaje claro y la opción manual.
 */
export function useCurrentDistrict(districts: District[]) {
  const [status, setStatus] = useState<LocateStatus>('idle')
  const [district, setDistrict] = useState<District | null>(null)
  const [placeLabel, setPlaceLabel] = useState<string | null>(null)

  const locate = useCallback(async () => {
    setStatus('locating')
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted') {
        setStatus('denied')
        return
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus('unavailable')
        return
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const place = await geocodingService.reverse(position.coords.latitude, position.coords.longitude)
      setPlaceLabel(place.candidates[0] ?? place.label)

      const byName = new Map(districts.map((d) => [normalizeName(d.name), d]))
      const match = place.candidates.map((name) => byName.get(normalizeName(name))).find(Boolean)
      if (match) {
        setDistrict(match)
        setStatus('found')
      } else {
        setStatus('outside')
      }
    } catch {
      setStatus('error')
    }
  }, [districts])

  const chooseManually = useCallback((chosen: District) => {
    setDistrict(chosen)
    setPlaceLabel(null)
    setStatus('found')
  }, [])

  return { status, district, placeLabel, locate, chooseManually }
}