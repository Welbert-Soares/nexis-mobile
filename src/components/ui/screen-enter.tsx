import { useEffect, useRef, type ReactNode } from 'react'
import { Animated } from 'react-native'

// Micro-animação de entrada pra telas empilhadas (sem push nativo). Fade +
// slide sutil de baixo pra cima, uma vez no mount.
export function ScreenEnter({ children }: { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 180, useNativeDriver: true }).start()
  }, [v])

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
