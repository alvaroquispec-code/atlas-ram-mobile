import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../utils/theme'

// Mantenemos el splash hasta saber si hay una sesión guardada.
SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { isAuthenticated, isRestoring } = useAuth()

  useEffect(() => {
    if (!isRestoring) SplashScreen.hideAsync()
  }, [isRestoring])

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Rutas protegidas: si el guard es false, la pantalla no existe y expo-router redirige. */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Crear cuenta' }} />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="isolates/[id]" options={{ title: 'Aislamiento' }} />
        <Stack.Screen name="isolates/new" options={{ title: 'Registrar aislamiento' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </ToastProvider>
    </AuthProvider>
  )
}