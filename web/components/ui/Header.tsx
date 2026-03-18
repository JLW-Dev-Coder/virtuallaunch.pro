'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
]

const RESOURCES_EXPLORE = [
  { href: '/blog', label: 'Blog', desc: 'Insights and growth content for tax pros' },
  { href: '/features/booking', label: 'Booking', desc: 'See the booking workflow in action' },
  { href: '/features/public-profile', label: 'Public Profile', desc: 'Preview the professional profile experience' },
  { href: '/help', label: 'Help Center', desc: 'Answers, guides, and support' },
]

const RESOURCES_PLATFORM = [
  { href: '/account', label: 'Account' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/support', label: 'Support' },
  { href: '/token-usage', label: 'Token Usage' },
]

const RESOURCES_TRUST = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/MARKET.md', label: 'Marketplace Notes' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close desktop dropdown on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResourcesOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setResourcesOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-slate-950">
            VLP
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight text-white">Virtual Launch Pro</span>
            <span className="text-xs text-slate-400">Launch systems for tax professionals</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-10 md:flex">
          <nav className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
                {link.label}
              </Link>
            ))}

            {/* Resources dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                aria-expanded={resourcesOpen}
                onClick={(e) => { e.stopPropagation(); setResourcesOpen((o) => !o) }}
                className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
              >
                Resources
                <svg
                  className={`h-4 w-4 opacity-80 transition-transform duration-150 ${resourcesOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {resourcesOpen && (
                <div className="absolute left-1/2 mt-3 w-[min(920px,calc(100vw-3rem))] -translate-x-1/2 rounded-2xl border border-slate-800/70 bg-slate-950 shadow-2xl">
                  <div className="grid gap-4 p-4 lg:grid-cols-3">

                    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Explore</div>
                      <div className="mt-2 space-y-1">
                        {RESOURCES_EXPLORE.map((item) => (
                          <Link key={item.href} href={item.href}
                            className="group flex items-start justify-between gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-900">
                            <div>
                              <div className="text-sm font-semibold text-slate-100 group-hover:text-white">{item.label}</div>
                              <div className="text-xs text-slate-400">{item.desc}</div>
                            </div>
                            <span className="text-slate-500 transition group-hover:text-amber-300">→</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Platform</div>
                      <div className="mt-2 space-y-1">
                        {RESOURCES_PLATFORM.map((item) => (
                          <Link key={item.href} href={item.href}
                            className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900">
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trust</div>
                      <div className="mt-2 space-y-1">
                        {RESOURCES_TRUST.map((item) => (
                          <Link key={item.href} href={item.href}
                            className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-900">
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/60 p-4">
                        <div className="text-xs text-slate-400">
                          Need a cleaner launch system than duct tape, calendar links, and prayer?
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          <Link href="/contact"
                            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-amber-400 hover:to-amber-500">
                            Contact Sales →
                          </Link>
                          <Link href="/sign-in"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
                            Sign In
                          </Link>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Log In
            </Link>
            <Link href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-orange-400 hover:to-amber-400">
              Start Here →
            </Link>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-300 hover:text-white md:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-950 md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6 text-sm">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-slate-300 transition hover:text-white">
                {link.label}
              </Link>
            ))}

            <button
              type="button"
              aria-expanded={mobileResourcesOpen}
              onClick={() => setMobileResourcesOpen((o) => !o)}
              className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3 text-left text-slate-200 transition hover:bg-slate-900"
            >
              <span>Resources</span>
              <svg
                className={`h-4 w-4 opacity-80 transition-transform duration-150 ${mobileResourcesOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileResourcesOpen && (
              <div className="flex flex-col gap-2 pl-2">
                {[...RESOURCES_EXPLORE, ...RESOURCES_PLATFORM, ...RESOURCES_TRUST].map((item) => (
                  <Link key={item.href} href={item.href}
                    className="rounded-lg px-4 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/sign-in" className="text-slate-300 transition hover:text-white">Log In</Link>

            <div className="mt-2 border-t border-slate-800 pt-4">
              <Link href="/contact"
                className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:from-orange-400 hover:to-amber-400">
                Start Here →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

