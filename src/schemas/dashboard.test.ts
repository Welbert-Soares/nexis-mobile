import { DashboardResponseSchema } from './dashboard'

const VALID = {
  totalBalance: 2395,
  hasWallets: true,
  monthly: { income: 5077, expenses: 2682 },
  recent: [
    {
      id: 't1',
      type: 'INCOME',
      amount: 3577,
      description: 'Salario',
      date: '2026-09-03T12:00:00.000Z',
      category: {
        id: 'c1',
        name: 'Salario',
        color: '#22c55e',
        icon: 'briefcase',
        type: 'INCOME',
        userId: 'u1',
      },
      wallet: { id: 'w1', name: 'Santander', color: '#ef4444' },
    },
    {
      id: 't2',
      type: 'EXPENSE',
      amount: 25,
      description: null,
      date: '2026-09-03T12:00:00.000Z',
      category: null,
      wallet: { id: 'w2', name: 'Nubank', color: null },
    },
  ],
  categoryBreakdown: [{ id: 'c1', name: 'Alimentacao', color: '#f97316', amount: 25 }],
}

describe('DashboardResponseSchema', () => {
  it('parseia um payload valido e ignora campos extras da category', () => {
    const out = DashboardResponseSchema.parse(VALID)
    expect(out.totalBalance).toBe(2395)
    expect(out.recent).toHaveLength(2)
    expect(out.recent[0].category?.name).toBe('Salario')
    expect((out.recent[0].category as Record<string, unknown>).userId).toBeUndefined()
  })

  it('parseia recent vazio e hasWallets false', () => {
    const out = DashboardResponseSchema.parse({ ...VALID, recent: [], hasWallets: false })
    expect(out.recent).toEqual([])
    expect(out.hasWallets).toBe(false)
  })

  it('rejeita amount nao-numerico', () => {
    const bad = { ...VALID, recent: [{ ...VALID.recent[0], amount: '3577' }] }
    expect(() => DashboardResponseSchema.parse(bad)).toThrow()
  })
})
