// Server component — no 'use client' needed; pathname-based active state lives in Sidebar
import Link from 'next/link'

export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-6 py-3 backdrop-blur">
      <div className="text-sm text-slate-400">
        {/* Breadcrumb placeholder — expand when routing is wired */}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications placeholder */}
        <button
          type="button"
          className="relative rounded-lg p-1.5 text-slate-400 transition hover:text-white"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Account menu placeholder */}
        <Link
          href="/app/account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-slate-950 transition hover:opacity-90"
          aria-label="Account"
        >
          U
        </Link>
      </div>
    </header>
  )
}
