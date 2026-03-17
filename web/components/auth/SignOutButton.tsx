'use client'

import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    try {
      await fetch(`${API_URL}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // proceed to sign-in regardless
    }
    router.push('/sign-in')
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-xs text-slate-500 transition hover:text-red-400"
    >
      Sign out
    </button>
  )
}
