import { createContext, useContext, type ReactNode } from 'react'
import { useSession } from './client'

type SessionValue = ReturnType<typeof useSession>

const Ctx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useSession()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Public contract: `{ session, isPending }`. */
export function useAuthSession() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuthSession fora do SessionProvider')
  return { session: v.data ?? null, isPending: v.isPending }
}
