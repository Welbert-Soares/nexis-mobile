import {
  categoriesQuery,
  categoriesManagementQuery,
  createCategory,
  editCategory,
  removeCategory,
} from './categories'

jest.mock('#/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockReturnValue('better-auth.session_token=abc') },
}))

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Promise<Response>

afterEach(() => jest.restoreAllMocks())

describe('categoriesManagementQuery', () => {
  it('queryKey ["categories-management"] e GET em /api/mobile/categories/manage', async () => {
    expect(categoriesManagementQuery.queryKey).toEqual(['categories-management'])
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(
      okJson([{ id: 'c1', name: 'X', color: null, icon: null, type: 'EXPENSE', userId: 'u1', _count: { transactions: 0 } }]),
    )
    const out = await categoriesManagementQuery.queryFn()
    expect(out).toHaveLength(1)
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/categories/manage')
  })
})

describe('categoriesQuery (?type=) segue funcionando', () => {
  it('monta a URL com type', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson([]))
    await categoriesQuery('EXPENSE').queryFn()
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/categories?type=EXPENSE')
  })
})

describe('mutations', () => {
  it('createCategory manda POST com JSON', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 'c9' }))
    await createCategory({ name: 'Pets', color: '#f00', icon: 'Dog', type: 'EXPENSE' })
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/mobile/categories')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Pets', color: '#f00', icon: 'Dog', type: 'EXPENSE' })
  })

  it('editCategory usa o id na URL', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 'c1' }))
    await editCategory('c1', { name: 'X', color: '#0f0' })
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/categories/c1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('removeCategory manda DELETE', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await removeCategory('c1')
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/mobile/categories/c1')
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })
})
