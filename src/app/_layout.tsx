import '../global.css'

import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { SessionProvider, useAuthSession } from '#/auth/session'
import { AppLockProvider, useAppLock } from '#/lib/app-lock-context'
import { AppLockScreen } from '#/components/app-lock-screen'
import { View, Text } from '#/tw'
import { colors } from '#/theme/colors'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnReconnect: true },
  },
})

function Gate() {
  const { isPending } = useAuthSession()
  const { locked } = useAppLock()

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-muted">Carregando…</Text>
      </View>
    )
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      {locked && <AppLockScreen />}
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AppLockProvider>
            <BottomSheetModalProvider>
              <StatusBar style="light" />
              <Gate />
            </BottomSheetModalProvider>
          </AppLockProvider>
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
