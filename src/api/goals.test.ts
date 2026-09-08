import {
  goalsQuery,
  createGoal,
  editGoal,
  deleteGoal,
  depositGoal,
  withdrawGoal,
} from './goals'

jest.mock('#/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockReturnValue('better-auth.session_token=abc') },
}))

const GOAL = {
  id: 'g1',
  name: 'Viagem',
  targetAmount: 5000,
  seedAmount: 0,
  currentAmount: 1200,
  deadline: null,
  color: '#3b82f6',
}

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Promise<Response>

afterEach(() => jest.restoreAllMocks())

describe('goalsQuery', () => {
  it('queryKey ["goals"] e GET em /api/mobile/goals', async () => {
    expect(goalsQuery.queryKey).toEqual(['goals'])
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson([GOAL]))
    const out = await goalsQuery.queryFn()
    expect(out).toHaveLength(1)
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/goals')
  })
})

describe('mutations', () => {
  it('createGoal manda POST com JSON e Cookie', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 'g1' }))
    await createGoal({ name: 'X', targetAmount: 100, deadline: null })
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/mobile/goals')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toMatchObject({ name: 'X', targetAmount: 100, deadline: null })
  })

  it('editGoal usa o id na URL', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 'g1' }))
    await editGoal('g1', { name: 'Y' })
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/goals/g1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('deleteGoal manda DELETE', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await deleteGoal('g1')
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/goals/g1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })

  it('depositGoal / withdrawGoal batem nos sub-caminhos certos', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ goalId: 'g1' }))
    await depositGoal('g1', { walletId: 'w1', amount: 50 })
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/goals/g1/deposit')
    await withdrawGoal('g1', { walletId: 'w1', amount: 50 })
    expect(fetchSpy.mock.calls[1][0]).toContain('/api/mobile/goals/g1/withdraw')
    expect(JSON.parse((fetchSpy.mock.calls[1][1] as RequestInit).body as string)).toEqual({ walletId: 'w1', amount: 50 })
  })
})
