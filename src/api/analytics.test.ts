import { analyticsQuery } from './analytics'

jest.mock('#/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockReturnValue('better-auth.session_token=abc') },
}))

const PAYLOAD = {
  monthly: { income: 5000, expenses: 3200 },
  categoryBreakdown: [{ id: 'c1', name: 'Mercado', color: '#f00', amount: 1200 }],
  trend: [{ month: '2026-09', income: 5000, expenses: 3200 }],
  dayOfMonth: 8,
  daysInMonth: 30,
}

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Promise<Response>

afterEach(() => jest.restoreAllMocks())

describe('analyticsQuery', () => {
  it('tem a queryKey ["analytics"]', () => {
    expect(analyticsQuery.queryKey).toEqual(['analytics'])
  })

  it('faz GET em /api/mobile/analytics e parseia o payload', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(PAYLOAD))
    const out = await analyticsQuery.queryFn()
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/analytics')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('GET')
    expect(out.monthly.income).toBe(5000)
    expect(out.trend).toHaveLength(1)
  })
})
