import { useEffect, useRef } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'

import { colors } from '#/theme/colors'
import { useReduceMotion } from '#/lib/reduce-motion'

// Placeholder de carregamento. Pulso de opacidade, desligado por "Reduzir
// movimento" ou por pulse={false}. Baixo nível: recebe style, não className.
export function Skeleton({
  style,
  pulse = true,
}: {
  style?: StyleProp<ViewStyle>
  pulse?: boolean
}) {
  const reduce = useReduceMotion()
  const animate = pulse && !reduce
  const v = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!animate) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [animate, v])

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { backgroundColor: colors.card, borderRadius: 12 },
        style,
        animate ? { opacity: v } : null,
      ]}
    />
  )
}
