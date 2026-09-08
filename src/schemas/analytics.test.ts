import { AnalyticsSchema } from './analytics'

const BASE = {
  monthly: { income: 5000, expenses: 3200 },
  categoryBreakdown: [
    { id: 'c1', name: 'Mercado', color: '#f00', amount: 1200 },
    { id: 'c2', name: 'Transporte', color: '#0f0', amount: 400 },
  ],
  trend: [
    { month: '2026-04', income: 4800, expenses: 3000 },
    { month: '2026-05', income: 5100, expenses: 3300 },
    { month: '2026-06', income: 4900, expenses: 2800 },
    { month: '2026-07', income: 5200, expenses: 3500 },
    { month: '2026-08', income: 5000, expenses: 3100 },
    { month: '2026-09', income: 5000, expenses: 3200 },
  ],
  dayOfMonth: 8,
  daysInMonth: 30,
  // campo extra do backend — ignorado
  generatedAt: '2026-09-08T00:00:00.000Z',
}

describe('AnalyticsSchema', () => {
  it('parseia o payload completo e ignora campos extras', () => {
    const out = AnalyticsSchema.parse(BASE)
    expect(out).not.toHaveProperty('generatedAt')
    expect(out.trend).toHaveLength(6)
    expect(out.monthly.income).toBe(5000)
    expect(out.categoryBreakdown[0].name).toBe('Mercado')
  })

  it('aceita trend e categoryBreakdown vazios', () => {
    const out = AnalyticsSchema.parse({ ...BASE, trend: [], categoryBreakdown: [] })
    expect(out.trend).toEqual([])
    expect(out.categoryBreakdown).toEqual([])
  })

  it('rejeita item de trend sem month', () => {
    const bad = { ...BASE, trend: [{ income: 1, expenses: 2 }] }
    expect(() => AnalyticsSchema.parse(bad)).toThrow()
  })

  it('rejeita monthly não-numérico', () => {
    expect(() => AnalyticsSchema.parse({ ...BASE, monthly: { income: '5000', expenses: 3200 } })).toThrow()
  })
})
