import { apiGet, ApiError } from './client'

jest.mock('#/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockReturnValue('better-auth.session_token=abc') },
}))

const okJson = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Promise<Response>

const errStatus = (status: number) =>
  Promise.resolve({
    ok: false,
    status,
    statusText: 'err',
    text: () => Promise.resolve(''),
  }) as unknown as Promise<Response>

describe('apiGet', () => {
  afterEach(() => jest.restoreAllMocks())

  it('anexa o cookie, parseia e valida o JSON', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ n: 1 }))
    const out = await apiGet('/api/mobile/x', (raw) => (raw as { n: number }).n)
    expect(out).toBe(1)
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Cookie).toBe('better-auth.session_token=abc')
    expect(init.credentials).toBe('omit')
  })

  it('joga ApiError com o status em resposta nao-ok', async () => {
    jest.spyOn(globalThis, 'fetch').mockReturnValue(errStatus(401))
    await expect(apiGet('/api/mobile/x', (r) => r)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    })
    await expect(apiGet('/api/mobile/x', (r) => r)).rejects.toBeInstanceOf(ApiError)
  })
})
