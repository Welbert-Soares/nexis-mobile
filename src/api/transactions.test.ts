import {
  monthTransactionsQuery,
  createTransaction,
  editTransaction,
  deleteTransaction,
  triggerRecurring,
} from './transactions'

jest.mock('#/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockReturnValue('better-auth.session_token=abc') },
}))

const TX = {
  id: 't1',
  type: 'EXPENSE',
  amount: 42.5,
  description: null,
  date: '2026-09-15T12:00:00.000Z',
  walletId: 'w1',
  categoryId: null,
  category: null,
  wallet: { id: 'w1', name: 'Nubank', color: null },
  recurring: false,
  parentId: null,
  isInstallment: false,
  isTransfer: false,
}

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Promise<Response>

afterEach(() => jest.restoreAllMocks())

describe('monthTransactionsQuery', () => {
  it('monta a URL com year/month e parseia o array', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson([TX]))
    const out = await monthTransactionsQuery(2026, 9).queryFn()
    expect(out).toHaveLength(1)
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/transactions?year=2026&month=9')
  })

  it('tem a queryKey ["transactions", year, month]', () => {
    expect(monthTransactionsQuery(2026, 9).queryKey).toEqual(['transactions', 2026, 9])
  })
})

describe('mutations', () => {
  it('createTransaction manda POST com Cookie + JSON', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 't9' }))
    await createTransaction({ walletId: 'w1', amount: 10, type: 'EXPENSE', date: '2026-09-15' })
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/mobile/transactions')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Cookie).toBe('better-auth.session_token=abc')
    expect(JSON.parse(init.body as string)).toMatchObject({ walletId: 'w1', amount: 10, date: '2026-09-15' })
  })

  it('editTransaction usa o id na URL', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 't1' }))
    await editTransaction('t1', { amount: 5, type: 'INCOME' })
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/transactions/t1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('deleteTransaction manda DELETE', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await deleteTransaction('t1')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('DELETE')
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/transactions/t1')
  })

  it('createTransaction resolve null quando a resposta é null (parcelamento)', async () => {
    jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await expect(
      createTransaction({ walletId: 'w1', amount: 300, type: 'EXPENSE', installments: 3 }),
    ).resolves.toBeNull()
  })

  it('deleteTransaction(id, mode) monta ?mode=', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await deleteTransaction('t1', 'all')
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/transactions/t1?mode=all')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })

  it('deleteTransaction(id) sem mode não põe query', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await deleteTransaction('t1')
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/transactions/t1')
    expect(fetchSpy.mock.calls[0][0]).not.toContain('?mode=')
  })

  it('triggerRecurring manda POST e devolve o count', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ count: 2 }))
    await expect(triggerRecurring()).resolves.toBe(2)
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/transactions/trigger-recurring')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('triggerRecurring devolve 0 quando a resposta não traz count', async () => {
    jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({}))
    await expect(triggerRecurring()).resolves.toBe(0)
  })
})
