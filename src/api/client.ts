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

/**
 * Typed GET against the Nexis backend. Reads the Better Auth cookie from
 * SecureStore (via the expo plugin's `getCookie`, which is synchronous) and
 * sends it as a `Cookie` header with `credentials: 'omit'` — the mobile session
 * is the same cookie as the web, not a Bearer token.
 */
export async function apiGet<T>(path: string, parse: (raw: unknown) => T): Promise<T> {
  const cookie = authClient.getCookie()
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: { Cookie: cookie, Accept: 'application/json' },
    credentials: 'omit',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body || res.statusText)
  }
  return parse(await res.json())
}
