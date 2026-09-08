import '../global.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { SessionProvider, useAuthSession } from '#/auth/session'
import { View, Text } from '#/tw'
import { colors } from '#/theme/colors'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnReconnect: true },
  },
})

function Gate() {
  const { isPending } = useAuthSession()

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-muted">Carregando…</Text>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="light" />
        <Gate />
      </SessionProvider>
    </QueryClientProvider>
  )
}
