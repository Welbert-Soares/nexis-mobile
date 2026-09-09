import { groupByDay } from './tx-group'
import type { Transaction } from '#/schemas/transaction'

function tx(id: string, date: Date): Transaction {
  return {
    id,
    type: 'EXPENSE',
    amount: 10,
    description: id,
    date: date.toISOString(),
    walletId: 'w1',
    categoryId: null,
    category: null,
    wallet: { id: 'w1', name: 'Nubank', color: null },
    recurring: false,
    parentId: null,
    isInstallment: false,
    isTransfer: false,
  }
}

describe('groupByDay', () => {
  it('agrupa por dia, com título relativo, preservando a ordem', () => {
    const today = new Date()
    const yesterday = new Date(Date.now() - 86_400_000)
    const out = groupByDay([tx('a', today), tx('b', today), tx('c', yesterday)])
    expect(out).toHaveLength(2)
    expect(out[0].title).toBe('Hoje')
    expect(out[0].data.map((t) => t.id)).toEqual(['a', 'b'])
    expect(out[1].title).toBe('Ontem')
    expect(out[1].data.map((t) => t.id)).toEqual(['c'])
  })

  it('array vazio → []', () => {
    expect(groupByDay([])).toEqual([])
  })
})
