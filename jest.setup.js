// Roda depois do preset jest-expo. Neutraliza AccessibilityInfo por padrão —
// testes que precisam de "reduzir movimento" ligado sobrescrevem o spy.
const { AccessibilityInfo } = require('react-native')

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false)
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: () => {} })
