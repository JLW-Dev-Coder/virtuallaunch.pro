import { redirect } from 'next/navigation'
import { getSession } from './session'
import type { SessionPayload } from './session'

export async function requireAuth(): Promise<SessionPayload> {
  try {
    const session = await getSession()
    return session
  } catch {
    redirect('/sign-in')
  }
}
