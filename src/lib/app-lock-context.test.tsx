import { render, act, fireEvent } from '@testing-library/react-native'
import { AppState, Text, Pressable } from 'react-native'

const mockIsEnabled = jest.fn()
const mockRunAuth = jest.fn()
let mockSession: unknown = { user: { id: 'u1' } }

jest.mock('#/lib/app-lock', () => ({
  isAppLockEnabled: (...a: unknown[]) => mockIsEnabled(...a),
  runAuth: (...a: unknown[]) => mockRunAuth(...a),
}))
jest.mock('#/auth/session', () => ({
  useAuthSession: () => ({ session: mockSession, isPending: false }),
}))

import { AppLockProvider, useAppLock } from './app-lock-context'

let appStateHandler: (s: string) => void = () => {}

beforeEach(() => {
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type: string, h: (s: never) => void) => {
      appStateHandler = h as unknown as (s: string) => void
      return { remove: jest.fn() } as never
    })
})

afterEach(() => {
  jest.restoreAllMocks()
  mockIsEnabled.mockReset()
  mockRunAuth.mockReset()
  mockSession = { user: { id: 'u1' } }
})

function Probe() {
  const { locked, unlock } = useAppLock()
  return (
    <>
      <Text>{locked ? 'LOCKED' : 'OPEN'}</Text>
      <Pressable testID="unlock" onPress={unlock}>
        <Text>u</Text>
      </Pressable>
    </>
  )
}

function renderProbe() {
  return render(
    <AppLockProvider>
      <Probe />
    </AppLockProvider>,
  )
}

describe('AppLockProvider', () => {
  it('enabled + sessão → LOCKED após resolver', async () => {
    mockIsEnabled.mockResolvedValue(true)
    const { getByText } = renderProbe()
    await act(async () => {})
    expect(getByText('LOCKED')).toBeTruthy()
  })

  it('disabled → OPEN', async () => {
    mockIsEnabled.mockResolvedValue(false)
    const { getByText } = renderProbe()
    await act(async () => {})
    expect(getByText('OPEN')).toBeTruthy()
  })

  it('sem sessão → OPEN mesmo com enabled', async () => {
    mockSession = null
    mockIsEnabled.mockResolvedValue(true)
    const { getByText } = renderProbe()
    await act(async () => {})
    expect(getByText('OPEN')).toBeTruthy()
  })

  it('unlock() com runAuth→true destrava', async () => {
    mockIsEnabled.mockResolvedValue(true)
    mockRunAuth.mockResolvedValue(true)
    const { getByText, getByTestId } = renderProbe()
    await act(async () => {})
    expect(getByText('LOCKED')).toBeTruthy()
    await act(async () => {
      fireEvent.press(getByTestId('unlock'))
    })
    expect(getByText('OPEN')).toBeTruthy()
  })

  it('background + >30s + active → re-tranca', async () => {
    jest.useFakeTimers()
    mockIsEnabled.mockResolvedValue(true)
    mockRunAuth.mockResolvedValue(true)
    const { getByText, getByTestId } = renderProbe()
    await act(async () => {})
    await act(async () => {
      fireEvent.press(getByTestId('unlock'))
    })
    expect(getByText('OPEN')).toBeTruthy()
    act(() => {
      appStateHandler('background')
      jest.advanceTimersByTime(31_000)
      appStateHandler('active')
    })
    expect(getByText('LOCKED')).toBeTruthy()
    jest.useRealTimers()
  })
})
