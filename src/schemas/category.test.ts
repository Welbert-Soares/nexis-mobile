import { CategoriesSchema, CategoriesManagementSchema, CategoryInput } from './category'

const GLOBAL = {
  id: 'c1',
  name: 'Alimentação',
  color: '#f00',
  icon: 'UtensilsCrossed',
  type: 'EXPENSE',
  userId: null,
  // extras do Prisma
  createdAt: '2026-01-01T00:00:00.000Z',
}

const USER = {
  id: 'c2',
  name: 'Mercado',
  color: null,
  icon: null,
  type: 'EXPENSE',
  userId: 'u1',
}

describe('CategoriesSchema', () => {
  it('parseia categoria global (userId null) e do usuário, ignorando extras', () => {
    const out = CategoriesSchema.parse([GLOBAL, USER])
    expect(out).toHaveLength(2)
    expect(out[0]).not.toHaveProperty('createdAt')
    expect(out[0].userId).toBeNull()
    expect(out[1].userId).toBe('u1')
    expect(out[1].color).toBeNull()
  })

  it('rejeita type fora do enum', () => {
    expect(() => CategoriesSchema.parse([{ ...GLOBAL, type: 'FOO' }])).toThrow()
  })
})

describe('CategoriesManagementSchema', () => {
  it('exige _count.transactions', () => {
    const ok = CategoriesManagementSchema.parse([{ ...USER, _count: { transactions: 3 } }])
    expect(ok[0]._count.transactions).toBe(3)
    expect(() => CategoriesManagementSchema.parse([USER])).toThrow()
  })
})

describe('CategoryInput', () => {
  it('rejeita name vazio', () => {
    expect(() => CategoryInput.parse({ name: '', color: '#f00', type: 'EXPENSE' })).toThrow()
  })
})
