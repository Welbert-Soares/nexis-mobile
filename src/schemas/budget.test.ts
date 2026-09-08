import { BudgetsSchema, BudgetSchema, BudgetInput } from './budget'

const ROW = {
  id: 'b1',
  categoryId: 'c1',
  categoryName: 'Mercado',
  categoryColor: '#71717a',
  categoryIcon: null,
  limit: 500,
  spent: 320,
}

describe('BudgetsSchema', () => {
  it('parseia a lista de orçamentos com icon nulo', () => {
    const out = BudgetsSchema.parse([ROW, { ...ROW, id: 'b2', categoryIcon: 'ShoppingCart' }])
    expect(out).toHaveLength(2)
    expect(out[0].categoryIcon).toBeNull()
    expect(out[1].categoryIcon).toBe('ShoppingCart')
  })

  it('rejeita limit não-numérico', () => {
    expect(() => BudgetsSchema.parse([{ ...ROW, limit: '500' }])).toThrow()
  })

  it('BudgetSchema.partial() tolera a resposta enxuta do POST (upsert cru)', () => {
    // O POST responde o registro cru do upsert: { id, categoryId, month, year, amount }.
    const out = BudgetSchema.partial().parse({ id: 'b1', categoryId: 'c1', amount: 200 })
    expect(out.id).toBe('b1')
  })
})

describe('BudgetInput', () => {
  it('aceita um body válido', () => {
    expect(BudgetInput.parse({ categoryId: 'c1', month: 9, year: 2026, amount: 200 })).toEqual({
      categoryId: 'c1',
      month: 9,
      year: 2026,
      amount: 200,
    })
  })

  it('rejeita amount <= 0', () => {
    expect(() => BudgetInput.parse({ categoryId: 'c1', month: 9, year: 2026, amount: 0 })).toThrow()
  })

  it('rejeita month fora de 1..12', () => {
    expect(() => BudgetInput.parse({ categoryId: 'c1', month: 13, year: 2026, amount: 200 })).toThrow()
  })
})
