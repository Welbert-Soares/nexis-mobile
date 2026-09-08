import {
  TransactionsSchema,
  TransactionInput,
  TransactionEditInput,
} from './transaction'

const BASE = {
  id: 't1',
  type: 'EXPENSE',
  amount: 42.5,
  description: 'Almoço',
  date: '2026-09-15T12:00:00.000Z',
  walletId: 'w1',
  categoryId: 'c1',
  category: { name: 'Alimentação', color: '#f00', icon: 'UtensilsCrossed' },
  wallet: { id: 'w1', name: 'Nubank', color: null },
  recurring: false,
  parentId: null,
  isInstallment: false,
  isTransfer: false,
  // campos extras do Prisma — devem ser ignorados
  _count: { children: 0 },
  parent: null,
  createdAt: '2026-09-15T12:00:00.000Z',
}

const INCOME_NO_CATEGORY = {
  ...BASE,
  id: 't2',
  type: 'INCOME',
  description: null,
  categoryId: null,
  category: null,
  recurring: true,
  parentId: 'root1',
  isInstallment: true,
  isTransfer: true,
}

describe('TransactionsSchema', () => {
  it('parseia despesa com categoria e receita sem categoria, ignorando extras', () => {
    const out = TransactionsSchema.parse([BASE, INCOME_NO_CATEGORY])
    expect(out).toHaveLength(2)
    expect(out[0]).not.toHaveProperty('_count')
    expect(out[0].category?.name).toBe('Alimentação')
    expect(out[1].category).toBeNull()
    expect(out[1].isTransfer).toBe(true)
    expect(out[1].isInstallment).toBe(true)
  })

  it('rejeita amount não-numérico', () => {
    expect(() => TransactionsSchema.parse([{ ...BASE, amount: '10' }])).toThrow()
  })

  it('rejeita quando falta o wallet', () => {
    const { wallet: _wallet, ...noWallet } = BASE
    expect(() => TransactionsSchema.parse([noWallet])).toThrow()
  })
})

describe('bodies', () => {
  it('TransactionInput exige walletId, amount positivo e type', () => {
    expect(() => TransactionInput.parse({ amount: 10, type: 'EXPENSE' })).toThrow()
    expect(() => TransactionInput.parse({ walletId: 'w1', amount: 0, type: 'EXPENSE' })).toThrow()
    expect(
      TransactionInput.parse({ walletId: 'w1', amount: 10, type: 'EXPENSE', date: '2026-09-15' }),
    ).toMatchObject({ walletId: 'w1', amount: 10 })
  })

  it('TransactionEditInput aceita categoryId/description nulos', () => {
    expect(
      TransactionEditInput.parse({ amount: 5, type: 'INCOME', categoryId: null, description: null }),
    ).toMatchObject({ categoryId: null, description: null })
  })

  it('TransactionInput aceita recurring + interval', () => {
    const out = TransactionInput.parse({
      walletId: 'w1',
      amount: 10,
      type: 'EXPENSE',
      recurring: true,
      interval: 'WEEKLY',
    })
    expect(out).toMatchObject({ recurring: true, interval: 'WEEKLY' })
  })

  it('TransactionInput aceita installments no range 2..24 e rejeita fora', () => {
    expect(
      TransactionInput.parse({ walletId: 'w1', amount: 10, type: 'EXPENSE', installments: 3 }),
    ).toMatchObject({ installments: 3 })
    expect(() =>
      TransactionInput.parse({ walletId: 'w1', amount: 10, type: 'EXPENSE', installments: 1 }),
    ).toThrow()
    expect(() =>
      TransactionInput.parse({ walletId: 'w1', amount: 10, type: 'EXPENSE', installments: 25 }),
    ).toThrow()
  })

  it('TransactionInput rejeita interval fora do enum', () => {
    expect(() =>
      TransactionInput.parse({ walletId: 'w1', amount: 10, type: 'EXPENSE', interval: 'DAILY' }),
    ).toThrow()
  })
})
