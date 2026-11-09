import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'
import { colors } from '../../utils/theme'

type IconName = ComponentProps<typeof Ionicons>['name']

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />
  }

export default function TabsLayout() {
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
      <Tabs.Screen name="isolates" options={{ title: 'Aislamientos', tabBarIcon: icon('flask-outline') }} />
      <Tabs.Screen name="scan" options={{ title: 'Escanear', tabBarIcon: icon('qr-code-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  )
}