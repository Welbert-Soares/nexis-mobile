import { useState } from 'react'
import { Redirect } from 'expo-router'

import { View, Text, Pressable } from '#/tw'
import { signIn } from '#/auth/client'
import { useAuthSession } from '#/auth/session'

export default function Login() {
  const { session } = useAuthSession()
  const [loading, setLoading] = useState(false)

  if (session) return <Redirect href="/" />

  async function handleGoogle() {
    setLoading(true)
    try {
      // Caminho A: @better-auth/expo abre o browser do sistema e volta pelo
      // scheme nexismobile://. Ao voltar, useSession atualiza e o Redirect
      // acima leva pro dashboard.
      await signIn.social({ provider: 'google', callbackURL: '/' })
    } catch {
      // usuário fechou o browser — sem erro ruidoso
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-bg px-8">
      <Text className="text-3xl font-bold text-fg">Nexis</Text>
      <Text className="text-center text-sm text-muted">Seu sistema financeiro pessoal</Text>
      <Pressable
        onPress={handleGoogle}
        disabled={loading}
        className="w-full items-center rounded-xl bg-accent py-4 active:opacity-80"
      >
        <Text className="text-sm font-semibold text-white">
          {loading ? 'Abrindo…' : 'Entrar com Google'}
        </Text>
      </Pressable>
    </View>
  )
}
