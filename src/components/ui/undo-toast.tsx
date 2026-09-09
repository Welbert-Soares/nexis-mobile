import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

import { View, Text, Pressable } from '#/tw'
import { colors } from '#/theme/colors'

// Toast fixo acima da lista com contagem de 5s + "Desfazer". A exclusão de
// verdade só acontece quando os 5s acabam (o pai controla o timer).
export function UndoToast({
  visible,
  label,
  onUndo,
}: {
  visible: boolean
  label: string
  onUndo: () => void
}) {
  const progress = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!visible) return
    progress.setValue(1)
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false,
    })
    anim.start()
    return () => anim.stop()
  }, [visible, progress])

  if (!visible) return null

  return (
    <View
      className="absolute overflow-hidden rounded-2xl border border-border bg-card"
      style={{
        left: 12,
        right: 12,
        bottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 8,
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-sm text-fg">{label}</Text>
        <Pressable onPress={onUndo} className="active:opacity-70">
          <Text className="text-sm font-semibold" style={{ color: colors.accent }}>
            Desfazer
          </Text>
        </Pressable>
      </View>
      <Animated.View
        style={{
          height: 2,
          backgroundColor: colors.accent,
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  )
}
