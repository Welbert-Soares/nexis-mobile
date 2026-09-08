import { fmtBRL, fmtDate } from './format'

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
