import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, View } from 'react-native'

import { useReduceMotion } from '#/lib/reduce-motion'

// Micro-animação de entrada pra telas empilhadas (sem push nativo). Fade +
// slide sutil de baixo pra cima, uma vez no mount. Respeita "Reduzir movimento".
export function ScreenEnter({ children }: { children: ReactNode }) {
  const reduce = useReduceMotion()
  const v = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduce) return
    Animated.timing(v, { toValue: 1, duration: 180, useNativeDriver: true }).start()
  }, [reduce, v])

  if (reduce) return <View style={{ flex: 1 }}>{children}</View>

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  )
}
