import { apiGet, apiPost, apiDelete, ApiError } from './client'

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

describe('apiSend / apiPost / apiDelete', () => {
  afterEach(() => jest.restoreAllMocks())

  it('apiPost manda Content-Type + body JSON + Cookie e parseia a resposta', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson({ id: 'w1' }))
    const out = await apiPost('/api/mobile/wallets', { name: 'X', type: 'CASH' }, (r) => (r as { id: string }).id)
    expect(out).toBe('w1')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect((init.headers as Record<string, string>).Cookie).toBe('better-auth.session_token=abc')
    expect(init.credentials).toBe('omit')
    expect(init.body).toBe(JSON.stringify({ name: 'X', type: 'CASH' }))
  })

  it('resposta 400 { error } vira ApiError.message com a string PT-BR', async () => {
    jest.spyOn(globalThis, 'fetch').mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('{"error":"Saldo insuficiente na carteira de origem"}'),
      }) as unknown as Promise<Response>,
    )
    await expect(apiPost('/api/mobile/wallets/transfer', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Saldo insuficiente na carteira de origem',
    })
  })

  it('204 resolve undefined sem chamar .json()', async () => {
    const json = jest.fn()
    jest.spyOn(globalThis, 'fetch').mockReturnValue(
      Promise.resolve({ ok: true, status: 204, json }) as unknown as Promise<Response>,
    )
    await expect(apiDelete('/api/mobile/wallets/w1')).resolves.toBeUndefined()
    expect(json).not.toHaveBeenCalled()
  })

  it('apiDelete: method DELETE, sem Content-Type, sem body', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(okJson(null))
    await apiDelete('/api/mobile/wallets/w1')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('DELETE')
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
    expect(init.body).toBeUndefined()
  })
})
