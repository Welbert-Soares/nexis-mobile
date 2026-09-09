import { useCallback, useEffect, useRef, useState } from 'react'

// O RefreshControl do RN é controlado: se ligarmos `refreshing` em qualquer
// refetch, o spinner aparece sozinho toda vez que a tela ganha foco (o
// useFocusEffect invalida a query). Aqui ele só gira quando o usuário puxa —
// refetch de fundo fica silencioso (a tela já mostra o cache; o skeleton cobre
// o cold load).
export function usePullRefresh(isFetching: boolean, onRefresh: () => void) {
  const [pulling, setPulling] = useState(false)
  const wasFetching = useRef(isFetching)
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const finished = wasFetching.current && !isFetching
    wasFetching.current = isFetching
    if (finished) setPulling(false)
  }, [isFetching])

  useEffect(
    () => () => {
      if (safety.current) clearTimeout(safety.current)
    },
    [],
  )

  const handleRefresh = useCallback(() => {
    setPulling(true)
    onRefresh()
    // Cache quente / offline: o refetch pode nem chegar a `isFetching`. Garante
    // que o spinner não trava.
    if (safety.current) clearTimeout(safety.current)
    safety.current = setTimeout(() => setPulling(false), 2500)
  }, [onRefresh])

  return { refreshing: pulling, onRefresh: handleRefresh }
}
