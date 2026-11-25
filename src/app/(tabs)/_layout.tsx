import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../utils/theme'

type IconName = ComponentProps<typeof Ionicons>['name']

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />
  }

export default function TabsLayout() {
  const { hasRole } = useAuth()
  // Las alertas solo las ven los roles que el servidor autoriza; para el resto la pestaña no aparece.
  const canSeeAlerts = hasRole('ADMIN', 'LAB_TECHNICIAN', 'EPIDEMIOLOGIST')
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand },
        headerTintColor: '#fff',
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Mi zona', tabBarIcon: icon('location-outline') }} />
      <Tabs.Screen name="treatment" options={{ title: 'Tratamiento', tabBarIcon: icon('medkit-outline') }} />
      <Tabs.Screen
        name="alerts"
        options={{ title: 'Alertas', tabBarIcon: icon('notifications-outline'), href: canSeeAlerts ? undefined : null }}
      />
      <Tabs.Screen name="isolates" options={{ title: 'Aislamientos', tabBarIcon: icon('flask-outline') }} />
      <Tabs.Screen name="scan" options={{ title: 'Escanear', tabBarIcon: icon('qr-code-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  )
}