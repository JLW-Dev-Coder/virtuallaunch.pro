import type { Metadata } from 'next'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import OnboardingPrompt from '@/components/app/OnboardingPrompt'
import { getDashboardSummary } from '@/lib/api/client'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  let summary
  try { summary = await getDashboardSummary() } catch { summary = { tokensRemaining: 0, tokensTotal: 0, upcomingBookings: 0, openTickets: 0, membership: 'free', renewalDate: 'N/A' } }

  const isFree = summary.membership === 'free'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Welcome back. Here&apos;s what&apos;s happening with your practice.
        </p>
      </div>

      {/* Upgrade prompt for Free members */}
      {isFree && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="text-sm font-semibold text-amber-300">You&apos;re on the Free plan</div>
          <p className="mt-1 text-sm text-slate-300">
            Upgrade to Starter, Scale, or Advanced to access the taxpayer network, transcript tokens, and booking infrastructure.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition"
          >
            View plans →
          </Link>
        </div>
      )}

      {/* Onboarding prompt (dismissible, client-side) */}
      <OnboardingPrompt />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tokens Remaining
          </div>
          <div className="mt-2 text-3xl font-bold text-white">
            {summary.tokensRemaining.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">of {summary.tokensTotal.toLocaleString()} monthly</div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Upcoming Bookings
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{summary.upcomingBookings}</div>
          <div className="mt-1 text-xs text-slate-500">next 7 days</div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Open Support Tickets
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{summary.openTickets}</div>
          <div className="mt-1 text-xs text-slate-500">
            {summary.openTickets === 0 ? 'All clear' : 'Awaiting response'}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Membership
          </div>
          <div className="mt-2 text-lg font-bold text-white capitalize">{summary.membership}</div>
          <div className="mt-1 text-xs text-slate-500">
            Renews {summary.renewalDate}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Quick Links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Profile Setup', href: '/onboarding', desc: 'Build your Tax Monitor network profile' },
            { label: 'Account Settings', href: '/account', desc: 'Manage profile and preferences' },
            { label: 'Calendar', href: '/calendar', desc: 'View and manage your schedule' },
            { label: 'Receipts', href: '/receipts', desc: 'Download invoices and receipts' },
            { label: 'Support', href: '/support', desc: 'Get help from our team' },
            { label: 'Token Usage', href: '/token-usage', desc: 'Monitor your AI token consumption' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="text-sm font-semibold text-slate-100 group-hover:text-white">
                {link.label}
                <span className="ml-1 text-slate-500 transition group-hover:text-amber-400"> â†’</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
