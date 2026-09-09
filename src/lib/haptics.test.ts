const selectionAsync = jest.fn().mockResolvedValue(undefined)
const notificationAsync = jest.fn().mockResolvedValue(undefined)
const impactAsync = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-haptics', () => ({
  selectionAsync: (...a: unknown[]) => selectionAsync(...a),
  notificationAsync: (...a: unknown[]) => notificationAsync(...a),
  impactAsync: (...a: unknown[]) => impactAsync(...a),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  ImpactFeedbackStyle: { Medium: 'medium' },
}))

import { useHaptic } from './haptics'

afterEach(() => {
  selectionAsync.mockClear()
  notificationAsync.mockClear()
  impactAsync.mockClear()
})

describe('useHaptic', () => {
  it('tap → selectionAsync', () => {
    useHaptic().tap()
    expect(selectionAsync).toHaveBeenCalled()
  })

  it('success / error → notificationAsync com o tipo certo', () => {
    useHaptic().success()
    expect(notificationAsync).toHaveBeenCalledWith('success')
    useHaptic().error()
    expect(notificationAsync).toHaveBeenCalledWith('error')
  })

  it('heavy → impactAsync', () => {
    useHaptic().heavy()
    expect(impactAsync).toHaveBeenCalledWith('medium')
  })

  it('não propaga erro se a API rejeitar', () => {
    notificationAsync.mockRejectedValueOnce(new Error('no haptics'))
    expect(() => useHaptic().error()).not.toThrow()
  })
})
