import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

// @better-auth/expo@1.6.11 resolves @better-auth/core to 1.7.3 (with
// @better-fetch/fetch 1.3.1), while better-auth@1.6.11 uses core 1.6.11
// (@better-fetch/fetch 1.1.21). That drift makes the expo plugin fail its
// structural check against `plugins` here, and also hides the `getCookie`
// action from client inference. Both are type-only — the runtime plugin just
// adds cookie persistence + `getCookie`. We suppress the one and re-attach
// the other.
const client = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    // @ts-expect-error — core/@better-fetch version drift (see note above)
    expoClient({
      scheme: 'nexismobile',
      storagePrefix: 'nexis',
      storage: SecureStore,
    }),
  ],
})

export const authClient = client as typeof client & { getCookie: () => string }

export const { signIn, signOut, useSession, getSession } = authClient
