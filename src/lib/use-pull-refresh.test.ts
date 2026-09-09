import { act, renderHook } from '@testing-library/react-native'

import { usePullRefresh } from '#/lib/use-pull-refresh'

describe('usePullRefresh', () => {
  it('não gira em refetch de fundo (sem pull)', () => {
    const { result, rerender } = renderHook(({ f }) => usePullRefresh(f, () => {}), {
      initialProps: { f: false },
    })
    expect(result.current.refreshing).toBe(false)
    rerender({ f: true }) // foco de tela dispara refetch
    expect(result.current.refreshing).toBe(false)
    rerender({ f: false })
    expect(result.current.refreshing).toBe(false)
  })

  it('gira quando o usuário puxa e para quando o refetch termina', () => {
    const onRefresh = jest.fn()
    const { result, rerender } = renderHook(({ f }) => usePullRefresh(f, onRefresh), {
      initialProps: { f: false },
    })
    act(() => result.current.onRefresh())
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(result.current.refreshing).toBe(true)
    rerender({ f: true })
    expect(result.current.refreshing).toBe(true)
    rerender({ f: false })
    expect(result.current.refreshing).toBe(false)
  })

  it('destrava por timeout se o refetch nem começa (cache quente)', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => usePullRefresh(false, () => {}))
    act(() => result.current.onRefresh())
    expect(result.current.refreshing).toBe(true)
    act(() => jest.advanceTimersByTime(2500))
    expect(result.current.refreshing).toBe(false)
    jest.useRealTimers()
  })
})
