import { budgetsQuery, saveBudget, removeBudget } from './budgets'

jest.mock('#/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockReturnValue('better-auth.session_token=abc') },
}))

const ROW = {
  id: 'b1',
  categoryId: 'c1',
  categoryName: 'Mercado',
  categoryColor: '#71717a',
  categoryIcon: null,
  limit: 500,
  spent: 320,
}

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Promise<Response>

afterEach(() => jest.restoreAllMocks())

describe('budgetsQuery', () => {
  it('tem a queryKey ["budgets", year, month]', () => {
    expect(budgetsQuery(2026, 9).queryKey).toEqual(['budgets', 2026, 9])
  })

  it('monta a URL com year/month e parseia o array', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson([ROW]))
    const out = await budgetsQuery(2026, 9).queryFn()
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/budgets?year=2026&month=9')
    expect(out).toHaveLength(1)
    expect(out[0].categoryName).toBe('Mercado')
  })
})

describe('mutations', () => {
  it('saveBudget manda POST com Cookie + JSON e tolera resposta enxuta', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 'b1', categoryId: 'c1', amount: 200 }))
    await saveBudget({ categoryId: 'c1', month: 9, year: 2026, amount: 200 })
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/mobile/budgets')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Cookie).toBe('better-auth.session_token=abc')
    expect(JSON.parse(init.body as string)).toEqual({ categoryId: 'c1', month: 9, year: 2026, amount: 200 })
  })

  it('removeBudget manda DELETE com o id na URL', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await removeBudget('b1')
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/budgets/b1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })
})
