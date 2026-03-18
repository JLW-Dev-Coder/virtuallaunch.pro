'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function Topbar() {
  const [email, setEmail] = useState<string | null>(null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('vlp_avatar_b64')
    if (saved) setAvatarSrc(saved)

    fetch('https://api.virtuallaunch.pro/v1/auth/session', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return
        const e = d.session?.email ?? d.email
        if (e) setEmail(e)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const initial = email?.[0]?.toUpperCase() ?? 'U'

  async function handleSignOut() {
    await fetch('https://api.virtuallaunch.pro/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/sign-in'
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-6 py-3 backdrop-blur">
      <div className="text-sm text-slate-400">
        {/* Breadcrumb placeholder — expand when routing is wired */}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-1.5 text-slate-400 transition hover:text-white"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-slate-950 transition hover:opacity-90"
            aria-label="Account menu"
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
              : initial
            }
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-2xl border border-slate-800/60 bg-slate-900 shadow-2xl p-2">
              {email && (
                <div className="truncate px-3 py-2 text-xs text-slate-500">{email}</div>
              )}
              <div className="my-1 border-t border-slate-800/60" />
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Account
              </Link>
              <div className="my-1 border-t border-slate-800/60" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
