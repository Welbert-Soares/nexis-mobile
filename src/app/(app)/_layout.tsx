import { useEffect } from 'react'
import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Redirect, Tabs } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, ChartColumnBig, LayoutDashboard, Wallet } from 'lucide-react-native'

import { useAuthSession } from '#/auth/session'
import { colors } from '#/theme/colors'
import { triggerRecurring } from '#/api/transactions'
import { TransactionSheetProvider } from '#/components/transactions/transaction-sheet-context'
import { FabTabButton } from '#/components/layout/fab'

export default function AppLayout() {
  const { session } = useAuthSession()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()

  // Gera as ocorrências recorrentes vencidas ao entrar no app (o PWA faz o
  // mesmo no mount do layout autenticado). Só invalida se algo foi lançado.
  useEffect(() => {
    if (!session) return
    triggerRecurring()
      .then((count) => {
        if (count > 0) {
          qc.invalidateQueries({ queryKey: ['transactions'] })
          qc.invalidateQueries({ queryKey: ['transactions-max-date'] })
          qc.invalidateQueries({ queryKey: ['wallets'] })
          qc.invalidateQueries({ queryKey: ['dashboard'] })
        }
      })
      .catch(() => {})
  }, [session, qc])

  if (!session) return <Redirect href="/login" />

  return (
    <TransactionSheetProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          // Altura explícita da faixa de conteúdo (46) + só o safe-area embaixo.
          // O default do bottom-tabs v7 dava uma sobra vertical na faixa.
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            height: 46 + insets.bottom,
            paddingTop: 0,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 10 },
          sceneStyle: { backgroundColor: colors.bg },
          // No bottom-tabs v7 o conteúdo do slot alinha ao topo
          // (`justifyContent: 'flex-start'`) — centraliza vertical.
          tabBarItemStyle: { justifyContent: 'center' },
          tabBarButton: (props) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Pressable {...(props as any)} style={[props.style, { flex: 1, justifyContent: 'center' }]} />
          ),
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
        {/* Slot central: botão "+" que abre o sheet (não navega). */}
        <Tabs.Screen
          name="new"
          options={{
            title: '',
            tabBarButton: (props) => <FabTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="wallets"
          options={{
            title: 'Carteiras',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Análise',
            tabBarIcon: ({ color, size }) => <ChartColumnBig color={color} size={size} />,
          }}
        />
        {/* Metas — tela empilhada, aberta por router.push('/goals'). Não é aba. */}
        <Tabs.Screen name="goals" options={{ href: null }} />
      </Tabs>
    </TransactionSheetProvider>
  )
}
