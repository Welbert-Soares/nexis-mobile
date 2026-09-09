import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Redirect } from 'expo-router'
import Svg, { Path } from 'react-native-svg'

import { View, Text, Pressable } from '#/tw'
import { Image } from '#/tw/image'
import { signIn } from '#/auth/client'
import { useAuthSession } from '#/auth/session'
import { colors } from '#/theme/colors'
import { useReduceMotion } from '#/lib/reduce-motion'

export default function Login() {
  const { session } = useAuthSession()
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()

  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const enter = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (reduce) {
      enter.setValue(1)
      return
    }
    Animated.timing(enter, { toValue: 1, duration: 420, useNativeDriver: true }).start()
  }, [reduce, enter])

  if (session) return <Redirect href="/" />

  async function handleGoogle() {
    setFailed(false)
    setLoading(true)
    try {
      // @better-auth/expo abre o browser do sistema e volta pelo scheme
      // nexismobile://. Ao voltar, useSession atualiza e o Redirect acima leva
      // pro app. Fechar o browser resolve sem sessão e sem erro — sem ruído.
      const res = await signIn.social({ provider: 'google', callbackURL: '/' })
      if (res && 'error' in res && res.error) setFailed(true)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const lift = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] })

  return (
    <View
      className="flex-1 bg-bg px-8"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
    >
      <View className="flex-1 justify-center">
        <Animated.View style={{ opacity: enter, transform: [{ translateY: lift }] }}>
          <View className="flex-row items-center gap-3">
            <Image
              source={require('../../../assets/images/nexis-mark.webp')}
              style={{ width: 42, height: 36 }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <Text
              className="text-5xl font-bold text-fg"
              style={{ letterSpacing: -1.5 }}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
            >
              Nexis
            </Text>
          </View>
          <Text className="mt-4 text-base text-muted" style={{ lineHeight: 22, maxWidth: 300 }}>
            Contas, gastos, metas e orçamentos num só lugar.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: enter }}>
        {failed && (
          <Text className="mb-3 text-xs" style={{ color: colors.negative }}>
            Não foi possível entrar. Verifique a conexão e tente de novo.
          </Text>
        )}

        <Pressable
          onPress={handleGoogle}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continuar com Google"
          accessibilityState={{ disabled: loading }}
          className="w-full flex-row items-center justify-center gap-3 rounded-xl py-4 active:opacity-90"
          style={{ backgroundColor: '#ffffff', opacity: loading ? 0.7 : 1 }}
        >
          <GoogleMark />
          <Text className="text-[15px] font-semibold" style={{ color: '#1f1f1f' }}>
            {loading ? 'Conectando…' : 'Continuar com Google'}
          </Text>
        </Pressable>

        <Text className="mt-3 text-center text-xs text-muted">
          Use a mesma conta do Nexis na web.
        </Text>
      </Animated.View>
    </View>
  )
}

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  )
}
