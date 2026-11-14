import axios from 'axios'

// API externa: Nominatim (OpenStreetMap) convierte coordenadas en una dirección.
// Su política de uso pide identificar la app con un User-Agent propio.
const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 10000,
  headers: { 'User-Agent': 'AtlasRAM-Mobile/1.0 (UTEC CS2031)', 'Accept-Language': 'es' },
})

interface NominatimAddress {
  city_district?: string
  suburb?: string
  town?: string
  city?: string
  village?: string
  municipality?: string
  county?: string
}

export interface ReverseGeocodeResult {
  label: string
  // Nombres posibles del distrito, del más específico al más general.
  candidates: string[]
}

export const geocodingService = {
  async reverse(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    const { data } = await nominatim.get<{ display_name: string; address: NominatimAddress }>('/reverse', {
      params: { lat: latitude, lon: longitude, format: 'jsonv2', zoom: 14, addressdetails: 1 },
    })
    const a = data.address ?? {}
    const candidates = [a.city_district, a.suburb, a.town, a.village, a.municipality, a.city, a.county].filter(
      (name): name is string => !!name,
    )
    return { label: data.display_name, candidates }
  },
}