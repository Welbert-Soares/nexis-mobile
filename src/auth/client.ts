import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

const client = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: 'nexismobile',
      storagePrefix: 'nexis',
      storage: SecureStore,
    }),
  ],
})

// `getCookie` is contributed by expoClient's actions; re-attach the type so
// consumers (apiGet) see it regardless of plugin-inference quirks.
export const authClient = client as typeof client & { getCookie: () => string }

export const { signIn, signOut, useSession, getSession } = authClient
