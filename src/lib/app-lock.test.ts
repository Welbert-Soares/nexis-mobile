const mockGet = jest.fn()
const mockSet = jest.fn().mockResolvedValue(undefined)
const mockHasHw = jest.fn()
const mockEnrolled = jest.fn()
const mockAuth = jest.fn()

jest.mock('expo-secure-store', () => ({
  getItemAsync: (...a: unknown[]) => mockGet(...a),
  setItemAsync: (...a: unknown[]) => mockSet(...a),
}))
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: (...a: unknown[]) => mockHasHw(...a),
  isEnrolledAsync: (...a: unknown[]) => mockEnrolled(...a),
  authenticateAsync: (...a: unknown[]) => mockAuth(...a),
}))

import { isAppLockEnabled, setAppLockEnabled, canUseAppLock, runAuth } from './app-lock'

afterEach(() => {
  mockGet.mockReset()
  mockSet.mockReset().mockResolvedValue(undefined)
  mockHasHw.mockReset()
  mockEnrolled.mockReset()
  mockAuth.mockReset()
})

describe('isAppLockEnabled', () => {
  it('"1" → true; ausente → false; erro → false', async () => {
    mockGet.mockResolvedValueOnce('1')
    expect(await isAppLockEnabled()).toBe(true)
    mockGet.mockResolvedValueOnce(null)
    expect(await isAppLockEnabled()).toBe(false)
    mockGet.mockRejectedValueOnce(new Error('x'))
    expect(await isAppLockEnabled()).toBe(false)
  })
})

describe('setAppLockEnabled', () => {
  it('grava "1"/"0"', async () => {
    await setAppLockEnabled(true)
    expect(mockSet).toHaveBeenCalledWith('app-lock', '1')
    await setAppLockEnabled(false)
    expect(mockSet).toHaveBeenCalledWith('app-lock', '0')
  })
})

describe('canUseAppLock', () => {
  it('AND de hasHardware/isEnrolled', async () => {
    mockHasHw.mockResolvedValue(true)
    mockEnrolled.mockResolvedValue(true)
    expect(await canUseAppLock()).toBe(true)
    mockEnrolled.mockResolvedValue(false)
    expect(await canUseAppLock()).toBe(false)
  })
  it('erro → false', async () => {
    mockHasHw.mockRejectedValue(new Error('x'))
    mockEnrolled.mockResolvedValue(true)
    expect(await canUseAppLock()).toBe(false)
  })
})

describe('runAuth', () => {
  it('mapeia { success } e engole exceção', async () => {
    mockAuth.mockResolvedValueOnce({ success: true })
    expect(await runAuth()).toBe(true)
    mockAuth.mockResolvedValueOnce({ success: false })
    expect(await runAuth()).toBe(false)
    mockAuth.mockRejectedValueOnce(new Error('x'))
    expect(await runAuth()).toBe(false)
  })
})
