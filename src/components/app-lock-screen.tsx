import { useEffect, useRef } from 'react'
import { LockKeyhole } from 'lucide-react-native'

import { View, Text, Pressable } from '#/tw'
import { colors } from '#/theme/colors'
import { useAppLock } from '#/lib/app-lock-context'

// Overlay que cobre tudo enquanto o app está travado. O root layout renderiza
// por cima do <Stack> quando useAppLock().locked.
export function AppLockScreen() {
  const { unlock } = useAppLock()
  const prompted = useRef(false)

  useEffect(() => {
    if (prompted.current) return
    prompted.current = true
    unlock()
  }, [unlock])

  return (
    <View
      className="items-center justify-center gap-4 bg-bg"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, elevation: 999 }}
    >
      <LockKeyhole size={48} color={colors.accent} strokeWidth={1.5} />
      <Text className="text-base font-semibold text-fg">Nexis bloqueado</Text>
      <Text className="text-xs text-muted">Use o Face ID pra continuar</Text>
      <Pressable
        onPress={() => unlock()}
        className="rounded-2xl px-6 py-3 active:opacity-80"
        style={{ backgroundColor: colors.accent }}
      >
        <Text className="text-sm font-semibold text-white">Desbloquear</Text>
      </Pressable>
    </View>
  )
}
