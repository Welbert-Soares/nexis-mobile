import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AppState } from 'react-native'

import { useAuthSession } from '#/auth/session'
import { isAppLockEnabled, runAuth } from '#/lib/app-lock'

const BG_TIMEOUT_MS = 30_000

type Ctx = {
  locked: boolean
  unlock: () => Promise<void>
  enabled: boolean
  refreshEnabled: () => void
}

const AppLockContext = createContext<Ctx | null>(null)

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuthSession()
  const hasSession = !!session

  const [enabled, setEnabled] = useState(false)
  // Pessimista: começa travado; o useEffect destrava se não for pra travar.
  const [locked, setLocked] = useState(true)
  const bgAt = useRef(0)

  useEffect(() => {
    isAppLockEnabled().then((e) => {
      setEnabled(e)
      setLocked(e && hasSession)
    })
  }, [hasSession])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' || s === 'inactive') {
        bgAt.current = Date.now()
      } else if (
        s === 'active' &&
        enabled &&
        hasSession &&
        bgAt.current > 0 &&
        Date.now() - bgAt.current > BG_TIMEOUT_MS
      ) {
        setLocked(true)
      }
    })
    return () => sub.remove()
  }, [enabled, hasSession])

  const unlock = useCallback(async () => {
    if (await runAuth()) setLocked(false)
  }, [])

  const refreshEnabled = useCallback(() => {
    isAppLockEnabled().then((e) => {
      setEnabled(e)
      if (!e) setLocked(false)
    })
  }, [])

  const value = useMemo<Ctx>(
    () => ({ locked: locked && hasSession, unlock, enabled, refreshEnabled }),
    [locked, hasSession, unlock, enabled, refreshEnabled],
  )

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
}

export function useAppLock(): Ctx {
  const v = useContext(AppLockContext)
  if (!v) throw new Error('useAppLock fora do AppLockProvider')
  return v
}
