import { cookies } from 'next/headers'

export interface SessionPayload {
  account_id: string
  email: string
  membership: string
  platform: string
  expires_at?: string
}

const MOCK_SESSION: SessionPayload = {
  account_id: 'mock-user-1',
  email: 'user@example.com',
  membership: 'pro',
  platform: 'vlp',
}

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_API === 'true'
  || !process.env.NEXT_PUBLIC_API_URL

// Replace mock with real Worker session validation
// when /v1/auth/session is live
export async function getSession(): Promise<SessionPayload> {
  if (USE_MOCK) return MOCK_SESSION

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('vlp_session')?.value

  if (!sessionToken) {
    throw new Error('No session cookie found')
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/session`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    throw new Error('Session validation failed')
  }

  const data = await res.json()
  return data.session as SessionPayload
}

// Export session token for use in API calls
export async function getSessionToken(): Promise<string | null> {
  if (USE_MOCK) return 'mock-session-token'

  const cookieStore = await cookies()
  return cookieStore.get('vlp_session')?.value ?? null
}
