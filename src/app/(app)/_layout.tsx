import { Redirect, Tabs } from 'expo-router'
import { ArrowLeftRight, LayoutDashboard, Wallet } from 'lucide-react-native'

import { useAuthSession } from '#/auth/session'
import { colors } from '#/theme/colors'
import { TransactionSheetProvider } from '#/components/transactions/transaction-sheet-context'
import { Fab } from '#/components/layout/fab'

export default function AppLayout() {
  const { session } = useAuthSession()

  if (!session) return <Redirect href="/login" />

  return (
    <TransactionSheetProvider>
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
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transações',
            tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="wallets"
          options={{
            title: 'Carteiras',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
      </Tabs>
      <Fab />
    </TransactionSheetProvider>
  )
}
