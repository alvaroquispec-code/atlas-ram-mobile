import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'atlasram.accessToken'
const REFRESH_KEY = 'atlasram.refreshToken'

// SecureStore guarda cifrado: Keychain en iOS y Keystore en Android.
// Además dejamos el access token en memoria para no leer el almacenamiento en cada request.
let accessToken: string | null = null

export const tokenStorage = {
  getAccessToken: () => accessToken,

  async load() {
    accessToken = await SecureStore.getItemAsync(ACCESS_KEY)
    return { accessToken, refreshToken: await SecureStore.getItemAsync(REFRESH_KEY) }
  },

  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),

  async save(tokens: { accessToken: string; refreshToken: string }) {
    accessToken = tokens.accessToken
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken)
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken)
  },

  async clear() {
    accessToken = null
    await SecureStore.deleteItemAsync(ACCESS_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
  },
}