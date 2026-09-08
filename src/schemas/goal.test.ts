import { GoalsSchema, GoalSchema, GoalInput, GoalMoveInput } from './goal'

const BASE = {
  id: 'g1',
  name: 'Viagem',
  targetAmount: 5000,
  seedAmount: 500,
  currentAmount: 1200,
  deadline: '2026-12-31T12:00:00.000Z',
  color: '#3b82f6',
  createdAt: '2026-09-01T00:00:00.000Z', // extra — ignorado
}

describe('GoalsSchema', () => {
  it('parseia meta com deadline string e com deadline null', () => {
    const out = GoalsSchema.parse([BASE, { ...BASE, id: 'g2', deadline: null, color: null }])
    expect(out).toHaveLength(2)
    expect(out[0]).not.toHaveProperty('createdAt')
    expect(out[1].deadline).toBeNull()
    expect(out[1].color).toBeNull()
  })

  it('rejeita targetAmount não-numérico', () => {
    expect(() => GoalsSchema.parse([{ ...BASE, targetAmount: '5000' }])).toThrow()
  })

  it('GoalSchema.partial() tolera a resposta enxuta do POST', () => {
    expect(GoalSchema.partial().parse({ id: 'g1', name: 'X' }).id).toBe('g1')
  })
})

describe('GoalInput / GoalMoveInput', () => {
  it('GoalInput rejeita targetAmount <= 0', () => {
    expect(() => GoalInput.parse({ name: 'X', targetAmount: 0 })).toThrow()
  })
  it('GoalInput aceita deadline null e ausente', () => {
    expect(GoalInput.parse({ name: 'X', targetAmount: 10, deadline: null }).deadline).toBeNull()
    expect(GoalInput.parse({ name: 'X', targetAmount: 10 }).deadline).toBeUndefined()
  })
  it('GoalMoveInput rejeita amount <= 0', () => {
    expect(() => GoalMoveInput.parse({ walletId: 'w1', amount: 0 })).toThrow()
  })
})
