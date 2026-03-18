'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      {/* Logo */}
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-base font-bold text-slate-950">
        VLP
      </div>

      {/* 404 */}
      <div className="mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-8xl font-black text-transparent">
        404
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white">This page could not be found</h1>
      <p className="mb-10 max-w-md text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Navigation cards */}
      <div className="mb-8 grid w-full max-w-lg gap-4 sm:grid-cols-3">
        <Link
          href="/help"
          className="group rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 transition hover:border-amber-500/40"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-white">Help Center</div>
          <div className="mt-1 text-xs text-slate-400">Answers and guides</div>
        </Link>

        <Link
          href="/blog"
          className="group rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 transition hover:border-amber-500/40"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-white">Blog</div>
          <div className="mt-1 text-xs text-slate-400">Insights for tax pros</div>
        </Link>

        <Link
          href="/"
          className="group rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 transition hover:border-amber-500/40"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-white">Home</div>
          <div className="mt-1 text-xs text-slate-400">Back to Virtual Launch Pro</div>
        </Link>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-slate-500 transition hover:text-slate-300"
      >
        ← Go back
      </button>
    </div>
  )
}
