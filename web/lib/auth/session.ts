// Replace mock with real Worker session validation when /v1/auth/session is live

export interface SessionPayload {
  account_id: string
  email: string
  membership: string
  platform: string
}

const MOCK_SESSION: SessionPayload = {
  account_id: 'mock-user-1',
  email: 'user@example.com',
  membership: 'pro',
  platform: 'vlp',
}

export async function getSession(): Promise<SessionPayload> {
  return MOCK_SESSION
}
