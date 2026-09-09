import { render, fireEvent } from '@testing-library/react-native'

import { AppLockScreen } from '#/components/app-lock-screen'

const mockUnlock = jest.fn()

jest.mock('#/lib/app-lock-context', () => ({
  useAppLock: () => ({ locked: true, unlock: mockUnlock, enabled: true, refreshEnabled: jest.fn() }),
}))
jest.mock('#/tw', () => {
  const RN = require('react-native')
  return { View: RN.View, Text: RN.Text, Pressable: RN.Pressable }
})
jest.mock('lucide-react-native', () => ({ LockKeyhole: () => null }))

afterEach(() => mockUnlock.mockClear())

describe('AppLockScreen', () => {
  it('mostra a mensagem + botão e chama unlock no mount (auto-prompt)', () => {
    const { getByText } = render(<AppLockScreen />)
    expect(getByText('Nexis bloqueado')).toBeTruthy()
    expect(getByText('Desbloquear')).toBeTruthy()
    expect(mockUnlock).toHaveBeenCalledTimes(1)
  })

  it('tocar "Desbloquear" chama unlock de novo', () => {
    const { getByText } = render(<AppLockScreen />)
    fireEvent.press(getByText('Desbloquear'))
    expect(mockUnlock).toHaveBeenCalledTimes(2)
  })
})
