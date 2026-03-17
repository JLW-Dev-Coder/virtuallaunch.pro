'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

type State = 'loading' | 'redirecting' | 'invalid' | 'error'

export default function VerifyPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const email = params.get('email')

    if (!token || !email) {
      setState('invalid')
      return
    }

    const url = new URL(`${API_URL}/v1/auth/magic-link/verify`)
    url.searchParams.set('token', token)
    url.searchParams.set('email', email)

    fetch(url.toString(), { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message ?? 'Verification failed.')
        setState('redirecting')
        router.push(data.redirectTo ?? '/app/dashboard')
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'This link has expired or is invalid.')
        setState('error')
      })
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-16">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-slate-950">
          VLP
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-800/70 bg-slate-900/60 p-8 text-center shadow-2xl">
        {(state === 'loading' || state === 'redirecting') && (
          <>
            <div className="mb-4 flex justify-center">
              <svg className="h-8 w-8 animate-spin text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">
              {state === 'redirecting' ? 'Signed in — redirecting…' : 'Verifying your sign-in link…'}
            </p>
          </>
        )}

        {state === 'invalid' && (
          <>
            <p className="mb-4 text-sm text-red-400">
              Invalid sign-in link — please request a new one.
            </p>
            <Link
              href="/sign-in"
              className="text-sm text-amber-400 underline underline-offset-2 hover:text-amber-300"
            >
              Back to sign in
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <p className="mb-4 text-sm text-red-400">
              {errorMsg ?? 'This link has expired or is invalid.'}
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-orange-400 hover:to-amber-400"
            >
              Request a new sign-in link
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
