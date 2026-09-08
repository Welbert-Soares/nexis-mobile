import { Redirect, Tabs } from 'expo-router'
import { LayoutDashboard } from 'lucide-react-native'

import { useAuthSession } from '#/auth/session'
import { colors } from '#/theme/colors'

export default function AppLayout() {
  const { session } = useAuthSession()

  if (!session) return <Redirect href="/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
