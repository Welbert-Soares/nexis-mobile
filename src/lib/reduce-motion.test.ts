import { AccessibilityInfo } from 'react-native'
import { act, renderHook, waitFor } from '@testing-library/react-native'

import { useReduceMotion } from '#/lib/reduce-motion'

const isEnabled = AccessibilityInfo.isReduceMotionEnabled as jest.Mock
const addListener = AccessibilityInfo.addEventListener as jest.Mock

afterEach(() => {
  isEnabled.mockReset()
  isEnabled.mockResolvedValue(false)
  addListener.mockReset()
  addListener.mockReturnValue({ remove: () => {} })
})

describe('useReduceMotion', () => {
  it('reflete o valor inicial do sistema', async () => {
    isEnabled.mockResolvedValue(true)
    const { result } = renderHook(() => useReduceMotion())
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('reage ao evento reduceMotionChanged', async () => {
    let handler: (v: boolean) => void = () => {}
    addListener.mockImplementation((_evt: string, cb: (v: boolean) => void) => {
      handler = cb
      return { remove: () => {} }
    })
    const { result } = renderHook(() => useReduceMotion())
    await waitFor(() => expect(result.current).toBe(false))
    act(() => handler(true))
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('cai para false se a consulta falhar', async () => {
    isEnabled.mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useReduceMotion())
    await waitFor(() => expect(isEnabled).toHaveBeenCalled())
    expect(result.current).toBe(false)
  })
})
