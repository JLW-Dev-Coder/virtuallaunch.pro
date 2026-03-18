import type { Metadata } from 'next'
import Card from '@/components/ui/Card'
import { getDashboardSummary } from '@/lib/api/client'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const summary = await getDashboardSummary()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Welcome back. Here&apos;s what&apos;s happening with your practice.
        </p>
      </div>

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
