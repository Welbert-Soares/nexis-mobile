const mockSelectionAsync = jest.fn().mockResolvedValue(undefined)
const mockNotificationAsync = jest.fn().mockResolvedValue(undefined)
const mockImpactAsync = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-haptics', () => ({
  selectionAsync: (...a: unknown[]) => mockSelectionAsync(...a),
  notificationAsync: (...a: unknown[]) => mockNotificationAsync(...a),
  impactAsync: (...a: unknown[]) => mockImpactAsync(...a),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  ImpactFeedbackStyle: { Medium: 'medium' },
}))

import { useHaptic } from './haptics'

afterEach(() => {
  mockSelectionAsync.mockClear()
  mockNotificationAsync.mockClear()
  mockImpactAsync.mockClear()
})

describe('useHaptic', () => {
  it('tap → selectionAsync', () => {
    useHaptic().tap()
    expect(mockSelectionAsync).toHaveBeenCalled()
  })

  it('success / error → notificationAsync com o tipo certo', () => {
    useHaptic().success()
    expect(mockNotificationAsync).toHaveBeenCalledWith('success')
    useHaptic().error()
    expect(mockNotificationAsync).toHaveBeenCalledWith('error')
  })

  it('heavy → impactAsync', () => {
    useHaptic().heavy()
    expect(mockImpactAsync).toHaveBeenCalledWith('medium')
  })

  it('não propaga erro se a API rejeitar', () => {
    mockNotificationAsync.mockRejectedValueOnce(new Error('no haptics'))
    expect(() => useHaptic().error()).not.toThrow()
  })
})
