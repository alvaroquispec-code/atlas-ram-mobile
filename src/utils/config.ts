// Expo inyecta en el bundle las variables que empiezan con EXPO_PUBLIC_ (vienen del archivo .env).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

// Periodo que cubren los datos de vigilancia cargados en el backend.
export const SURVEILLANCE_PERIOD = { from: '2024-09-01', to: '2026-08-31' }