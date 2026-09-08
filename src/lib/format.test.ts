import { fmtBRL, fmtDate, fmtMonthKeyShort, fmtBudgetMonth } from './format'

// fmtBRL normalizes the ICU narrow/no-break space to a plain ASCII space,
// so these literals use a regular space on purpose.
describe('fmtBRL', () => {
  it('formata reais com 2 casas e separadores pt-BR', () => {
    expect(fmtBRL(1234.5)).toBe('R$ 1.234,50')
  })
  it('zero', () => {
    expect(fmtBRL(0)).toBe('R$ 0,00')
  })
  it('negativo', () => {
    expect(fmtBRL(-78)).toBe('-R$ 78,00')
  })
  it('nao deixa espaco no-break no resultado', () => {
    expect(fmtBRL(1234.5)).not.toMatch(/[  ]/)
  })
})

describe('fmtDate', () => {
  it('dia e mes abreviado pt-BR', () => {
    // 2026-09-03 -> "03 de set."
    expect(fmtDate(new Date(2026, 8, 3))).toMatch(/03 de set/)
  })
})

describe('fmtMonthKeyShort', () => {
  it('mapeia a chave YYYY-MM pro rotulo curto', () => {
    expect(fmtMonthKeyShort('2026-09')).toBe('set')
    expect(fmtMonthKeyShort('2026-01')).toBe('jan')
    expect(fmtMonthKeyShort('2026-12')).toBe('dez')
  })
})

describe('fmtBudgetMonth', () => {
  it('mes curto + ano de 2 digitos', () => {
    expect(fmtBudgetMonth(2025, 9)).toBe('set/25')
    expect(fmtBudgetMonth(2026, 1)).toBe('jan/26')
  })
})
