import type { Metadata } from 'next'
import Card from '@/components/ui/Card'
import MembershipSection from '@/components/app/MembershipSection'
import { getAccountProfile, getNotificationPreferences, getVlpPreferences, getDashboardSummary } from '@/lib/api/client'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Account' }

export default async function AccountPage() {
  const session = await getSession()
  const [profile, notifPrefs, vlpPrefs, summary] = await Promise.all([
    getAccountProfile(session.account_id),
    getNotificationPreferences(session.account_id),
    getVlpPreferences(session.account_id),
    getDashboardSummary().catch(() => ({ membership: 'free' })),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your profile, security, and preferences.</p>
      </div>

      {/* Membership */}
      <MembershipSection accountId={session.account_id} membership={summary.membership} />

      {/* Profile */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Profile</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">First Name</dt>
            <dd className="mt-1 text-sm text-white">{profile.firstName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Last Name</dt>
            <dd className="mt-1 text-sm text-white">{profile.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-white">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Phone</dt>
            <dd className="mt-1 text-sm text-white">{profile.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Timezone</dt>
            <dd className="mt-1 text-sm text-white">{profile.timezone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Member Since</dt>
            <dd className="mt-1 text-sm text-white">
              {new Date(profile.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Security */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Security</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white">Two-Factor Authentication</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {profile.twoFactorEnabled
                ? 'Enabled — your account has extra protection.'
                : 'Not enabled — add an extra layer of security.'}
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              profile.twoFactorEnabled
                ? 'bg-emerald-900/60 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {profile.twoFactorEnabled ? 'On' : 'Off'}
          </span>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Notifications
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white">In-App Notifications</div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                notifPrefs.inAppEnabled
                  ? 'bg-emerald-900/60 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {notifPrefs.inAppEnabled ? 'On' : 'Off'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-white">SMS Notifications</div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                notifPrefs.smsEnabled
                  ? 'bg-emerald-900/60 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {notifPrefs.smsEnabled ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </Card>

      {/* VLP Preferences */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Preferences
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Appearance</dt>
            <dd className="mt-1 text-sm capitalize text-white">{vlpPrefs.appearance}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Timezone</dt>
            <dd className="mt-1 text-sm text-white">{vlpPrefs.timezone ?? '—'}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
