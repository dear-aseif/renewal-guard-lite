// Lightweight auth helpers for the client. The session lives in an HttpOnly
// cookie, so this only talks to /api/auth/me and /api/auth/login.

export async function checkAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' })
    if (!response.ok) return false
    const data = (await response.json()) as { authenticated: boolean }
    return data.authenticated
  } catch {
    return false
  }
}

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'same-origin',
    })
    if (response.ok) return { ok: true }
    return { ok: false, error: response.status === 401 ? 'incorrect' : 'server' }
  } catch {
    return { ok: false, error: 'offline' }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  } catch {
    // Ignore network errors on logout; the UI navigates away regardless.
  }
}
