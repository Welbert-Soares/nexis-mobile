import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

// Lê a preferência "Reduzir movimento" do sistema e reage a mudanças em runtime.
// Tolerante a erro — se a API não responder, assume que não há preferência.
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    let alive = true

    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduce(v)
      })
      .catch(() => {})

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v: boolean) => {
      setReduce(v)
    })

    return () => {
      alive = false
      sub?.remove?.()
    }
  }, [])

  return reduce
}
