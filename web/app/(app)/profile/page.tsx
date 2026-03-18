'use client'

import { useEffect, useRef, useState } from 'react'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix',
]

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
}

interface Prefs {
  inApp: boolean
  sms: boolean
  appearance: 'dark' | 'light' | 'system'
  timezone: string
}

export default function ProfilePage() {
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<ProfileData>({ firstName: '', lastName: '', email: '', phone: '', organization: '' })
  const [prefs, setPrefs] = useState<Prefs>({ inApp: true, sms: false, appearance: 'dark', timezone: 'America/New_York' })
  const [twoFa, setTwoFa] = useState(false)

  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Profile | Virtual Launch Pro'

    const saved = localStorage.getItem('vlp_avatar_b64')
    if (saved) setAvatarSrc(saved)

    async function init() {
      try {
        const sessionRes = await fetch('https://api.virtuallaunch.pro/v1/auth/session', { credentials: 'include' })
        if (!sessionRes.ok) return
        const session = await sessionRes.json()
        const aid = session.session?.account_id ?? session.account_id
        if (!aid) return
        setAccountId(aid)

        const [profileRes, notifRes, vlpRes] = await Promise.allSettled([
          fetch(`https://api.virtuallaunch.pro/v1/accounts/${aid}`, { credentials: 'include' }),
          fetch(`https://api.virtuallaunch.pro/v1/notifications/preferences/${aid}`, { credentials: 'include' }),
          fetch(`https://api.virtuallaunch.pro/v1/vlp/preferences/${aid}`, { credentials: 'include' }),
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const d = await profileRes.value.json()
          const p = d.profile ?? d
          setProfile({
            firstName: p.firstName ?? p.first_name ?? '',
            lastName: p.lastName ?? p.last_name ?? '',
            email: p.email ?? session.session?.email ?? '',
            phone: p.phone ?? '',
            organization: p.organization ?? p.firmName ?? '',
          })
          setTwoFa(!!p.twoFactorEnabled)
        }

        if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
          const d = await notifRes.value.json()
          const n = d.preferences ?? d
          setPrefs((prev) => ({ ...prev, inApp: n.inAppEnabled ?? true, sms: n.smsEnabled ?? false }))
        }

        if (vlpRes.status === 'fulfilled' && vlpRes.value.ok) {
          const d = await vlpRes.value.json()
          const v = d.preferences ?? d
          setPrefs((prev) => ({
            ...prev,
            appearance: v.appearance ?? 'dark',
            timezone: v.timezone ?? 'America/New_York',
          }))
        }
      } catch {/* ignore */} finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  async function saveProfile() {
    if (!accountId) return
    setSavingProfile(true)
    setProfileError(null)
    try {
      const res = await fetch(`https://api.virtuallaunch.pro/v1/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          organization: profile.organization,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setProfileError((d as { message?: string }).message || 'Save failed.')
        return
      }
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch {
      setProfileError('Network error. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePrefs(update: Partial<Prefs>) {
    if (!accountId) return
    const next = { ...prefs, ...update }
    setPrefs(next)
    setSavingPrefs(true)
    try {
      await Promise.allSettled([
        fetch(`https://api.virtuallaunch.pro/v1/notifications/preferences/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ inAppEnabled: next.inApp, smsEnabled: next.sms }),
        }),
        fetch(`https://api.virtuallaunch.pro/v1/vlp/preferences/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ appearance: next.appearance, timezone: next.timezone }),
        }),
      ])
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2000)
    } catch {/* ignore */} finally {
      setSavingPrefs(false)
    }
  }

  async function handleSignOutAll() {
    await fetch('https://api.virtuallaunch.pro/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/sign-in'
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Image must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result as string
      localStorage.setItem('vlp_avatar_b64', b64)
      setAvatarSrc(b64)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
      // TODO: upload to /v1/accounts/{accountId}/avatar when Worker endpoint is available
    }
    reader.readAsDataURL(file)
  }

  const initials = ((profile.firstName[0] ?? '') + (profile.lastName[0] ?? '')).toUpperCase() || '??'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">Your personal information, security, and preferences.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 text-center text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          {/* Profile hero */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-xl font-bold text-slate-950 overflow-hidden">
                    {avatarSrc
                      ? <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                      : initials
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 hover:bg-orange-400 transition shadow-lg"
                    aria-label="Change photo"
                  >
                    <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">400×400px · PNG or WebP · Max 2MB</p>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your Name'}</div>
                <div className="mt-0.5 text-sm text-slate-400">{profile.email}</div>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-emerald-900/60 px-2.5 py-1 text-xs font-semibold text-emerald-300">Verified</span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">In service</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal information */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                  <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-xs font-semibold text-emerald-300 normal-case">Verified</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-slate-800/40 bg-slate-950/20 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Organization / Firm</label>
                <input
                  type="text"
                  value={profile.organization}
                  onChange={(e) => setProfile((p) => ({ ...p, organization: e.target.value }))}
                  placeholder="Smith Tax Group"
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none"
                />
              </div>
            </div>
            {profileError && <p className="mt-3 text-xs text-red-400">{profileError}</p>}
            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
            >
              {profileSaved ? 'Saved!' : savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">Change Password</div>
                  <div className="mt-0.5 text-xs text-slate-500">Sign in uses magic link or Google — no password required.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Manage
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">Two-Factor Authentication</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {twoFa ? 'Enabled — your account has extra protection.' : 'Not enabled — add an extra layer of security.'}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${twoFa ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {twoFa ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">Active Sessions</div>
                  <div className="mt-0.5 text-xs text-slate-500">Sign out of all devices.</div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutAll}
                  className="rounded-xl border border-red-900/40 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 transition"
                >
                  Sign Out All
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-400">Preferences</h2>
            <div className="space-y-5">
              {/* Notifications */}
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Notifications</div>
                <div className="space-y-3">
                  {([
                    { key: 'inApp' as const, label: 'In-App Notifications' },
                    { key: 'sms' as const, label: 'SMS Notifications' },
                  ]).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="text-sm text-white">{label}</div>
                      <button
                        type="button"
                        onClick={() => savePrefs({ [key]: !prefs[key] })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${prefs[key] ? 'bg-orange-500' : 'bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Appearance</div>
                <div className="flex gap-2">
                  {(['dark', 'light', 'system'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => savePrefs({ appearance: a })}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                        prefs.appearance === a
                          ? 'bg-orange-500 text-slate-950'
                          : 'border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-orange-500/40'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</label>
                <select
                  value={prefs.timezone}
                  onChange={(e) => savePrefs({ timezone: e.target.value })}
                  className="w-full max-w-sm rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white focus:border-orange-500/60 focus:outline-none"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
            {prefsSaved && <p className="mt-3 text-xs text-emerald-400">Preferences saved.</p>}
          </div>
        </>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-3 text-base font-bold text-white">Password Management</h2>
            <p className="text-sm text-slate-400">
              Virtual Launch Pro uses magic links and Google OAuth for authentication — there is no password to change.
              To update your sign-in method, contact support.
            </p>
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
