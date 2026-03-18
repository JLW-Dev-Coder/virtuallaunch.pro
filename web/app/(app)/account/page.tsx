import type { Metadata } from 'next'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import MembershipSection from '@/components/app/MembershipSection'
import { getDashboardSummary } from '@/lib/api/client'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Account' }

export default async function AccountPage() {
  const session = await getSession()
  const summary = await getDashboardSummary().catch(() => ({ membership: 'free' }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Account</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your membership and billing.</p>
      </div>

      {/* Profile link card */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Profile &amp; Preferences</div>
            <p className="mt-0.5 text-xs text-slate-400">
              Manage your profile, security, and notification preferences.
            </p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Go to Profile →
          </Link>
        </div>
      </Card>

      {/* Membership */}
      <MembershipSection accountId={session.account_id} membership={summary.membership} />
    </div>
  )
}
