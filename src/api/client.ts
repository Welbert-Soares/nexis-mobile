import { authClient } from '#/auth/client'

const BASE = process.env.EXPO_PUBLIC_API_URL!

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// O `fetch` do React Native (NSURLSession no iOS, OkHttp no Android) mantém um
// cache HTTP próprio e, sem isso, serve GETs de uma cópia local por vários
// minutos — o TanStack Query refazia o refetch mas a rede devolvia o valor
// velho (ex.: orçamento editado no PWA não aparecia no app). `no-store` +
// headers no-cache forçam sempre ir na origem; o cache de verdade é o do
// TanStack Query.
const NO_STORE = {
  cache: 'no-store' as RequestCache,
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } as Record<string, string>,
}

/**
 * Typed GET against the Nexis backend. Reads the Better Auth cookie from
 * SecureStore (via the expo plugin's `getCookie`, which is synchronous) and
 * sends it as a `Cookie` header with `credentials: 'omit'` — the mobile session
 * is the same cookie as the web, not a Bearer token.
 */
export async function apiGet<T>(path: string, parse: (raw: unknown) => T): Promise<T> {
  const cookie = authClient.getCookie()
  // Cache-bust no próprio URL — no iOS/Android o `cache: 'no-store'` do fetch do
  // RN nem sempre é respeitado; um param único garante que nunca volte do cache
  // nativo. A queryKey do TanStack Query não passa por aqui, então não muda.
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}_=${Date.now()}`, {
    method: 'GET',
    headers: { ...NO_STORE.headers, Cookie: cookie, Accept: 'application/json' },
    credentials: 'omit',
    cache: NO_STORE.cache,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body || res.statusText)
  }
  return parse(await res.json())
}

const identity = (r: unknown) => r as never

/**
 * Escrita (POST/DELETE) contra o backend. Mesmo cookie do `apiGet`. Em resposta
 * não-2xx, tenta extrair `{ error }` do corpo (mensagem PT-BR do backend) e a
 * carrega em `ApiError.message`. `204` resolve `undefined`.
 */
export async function apiSend<T = void>(
  method: 'POST' | 'DELETE',
  path: string,
  body?: unknown,
  parse: (raw: unknown) => T = identity,
): Promise<T> {
  const cookie = authClient.getCookie()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...NO_STORE.headers,
      Cookie: cookie,
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'omit',
    cache: NO_STORE.cache,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text || res.statusText
    try {
      const j = JSON.parse(text)
      if (j && typeof j.error === 'string') message = j.error
    } catch {
      /* corpo não é JSON — usa o texto puro */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return parse(await res.json())
}

export const apiPost = <T = void>(path: string, body?: unknown, parse?: (raw: unknown) => T) =>
  apiSend<T>('POST', path, body, parse)

export const apiDelete = (path: string) => apiSend<void>('DELETE', path)
