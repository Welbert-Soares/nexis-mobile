import { WalletsSchema, WalletInput, WalletEditInput, TransferInput } from './wallet'

const CHECKING = {
  id: 'w1',
  name: 'Nubank',
  type: 'CHECKING',
  color: null,
  icon: null,
  balance: 1234.5,
  initialBalance: 1000,
  creditLimit: null,
  closingDay: null,
  dueDay: null,
  // campos extras do Prisma — devem ser ignorados
  currency: 'BRL',
  userId: 'u1',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-08T00:00:00.000Z',
}

const CREDIT = {
  id: 'w2',
  name: 'Cartão',
  type: 'CREDIT',
  color: '#ef4444',
  icon: 'CreditCard',
  balance: -300,
  initialBalance: 0,
  creditLimit: 2000,
  closingDay: 5,
  dueDay: 15,
}

describe('WalletsSchema', () => {
  it('parseia lista com CHECKING (null) e CREDIT, ignorando campos extras', () => {
    const out = WalletsSchema.parse([CHECKING, CREDIT])
    expect(out).toHaveLength(2)
    expect(out[0]).not.toHaveProperty('userId')
    expect(out[1].creditLimit).toBe(2000)
    expect(out[1].closingDay).toBe(5)
  })

  it('rejeita balance não-numérico', () => {
    expect(() => WalletsSchema.parse([{ ...CHECKING, balance: '10' }])).toThrow()
  })
})

describe('bodies', () => {
  it('WalletInput rejeita name vazio e closingDay fora de 1..28', () => {
    expect(() => WalletInput.parse({ name: '', type: 'CASH' })).toThrow()
    expect(() => WalletInput.parse({ name: 'X', type: 'CREDIT', closingDay: 40 })).toThrow()
  })

  it('WalletInput aceita o mínimo (name + type)', () => {
    expect(WalletInput.parse({ name: 'X', type: 'CASH' })).toEqual({ name: 'X', type: 'CASH' })
  })

  it('WalletEditInput aceita tudo opcional e icon nulo', () => {
    expect(WalletEditInput.parse({ icon: null })).toEqual({ icon: null })
  })

  it('TransferInput exige amount positivo', () => {
    expect(() => TransferInput.parse({ fromWalletId: 'a', toWalletId: 'b', amount: 0 })).toThrow()
    expect(TransferInput.parse({ fromWalletId: 'a', toWalletId: 'b', amount: 10 })).toBeTruthy()
  })
})
