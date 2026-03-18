'use client'

import { useState } from 'react'

interface CalConnectionCardProps {
  vlpConnected: boolean
  proConnected: boolean
  onConnectVlp: () => void
  onConnectPro: () => void
  connecting: boolean
  error: string | null
  variant: 'calendar' | 'profile' | 'analytics'
}

const VLP_SCOPES = [
  'View bookings',
  'Manage bookings',
  'View availability',
  'View personal info',
]

function FlowACard({
  vlpConnected,
  onConnectVlp,
  connecting,
  error,
}: {
  vlpConnected: boolean
  onConnectVlp: () => void
  connecting: boolean
  error: string | null
}) {
  const [bookingUrl, setBookingUrl] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('vlp_cal_booking_url') ?? '' : ''
  )
  const [saved, setSaved] = useState(false)

  function saveUrl() {
    localStorage.setItem('vlp_cal_booking_url', bookingUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function copyUrl() {
    if (bookingUrl) navigator.clipboard.writeText(bookingUrl).catch(() => {})
  }

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-base font-semibold text-white">Connect Your Cal.com Account</h2>
        {vlpConnected && (
          <span className="rounded-full bg-emerald-900/60 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            ✓ Cal.com Connected
          </span>
        )}
      </div>

      {!vlpConnected ? (
        <>
          <p className="mb-4 text-sm text-slate-400">
            View your booked sessions with the VLP team directly in the calendar. Connect to enable
            reschedule and cancel actions.
          </p>
          <ul className="mb-5 space-y-1.5 text-sm text-slate-400">
            {VLP_SCOPES.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={onConnectVlp}
            disabled={connecting}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
          >
            {connecting ? 'Connecting…' : 'Connect Cal.com'}
          </button>
        </>
      ) : (
        <>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your Booking Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://cal.com/your-name"
                className="flex-1 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={saveUrl}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition"
              >
                {saved ? 'Saved' : 'Save'}
              </button>
              {bookingUrl && (
                <button
                  type="button"
                  onClick={copyUrl}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FlowBCard({
  proConnected,
  onConnectPro,
  connecting,
  error,
}: {
  proConnected: boolean
  onConnectPro: () => void
  connecting: boolean
  error: string | null
}) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-base font-semibold text-white">Cal.com Integration</h2>
        {proConnected && (
          <span className="rounded-full bg-emerald-900/60 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            ✓ Connected
          </span>
        )}
      </div>

      {!proConnected ? (
        <>
          <p className="mb-4 text-sm text-slate-400">
            Connect your Cal.com account so clients can book you directly from your public profile.
          </p>
          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={onConnectPro}
            disabled={connecting}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
          >
            {connecting ? 'Connecting…' : 'Connect Cal.com Account'}
          </button>
        </>
      ) : (
        <p className="text-sm text-slate-400">
          Your Cal.com account is connected. Clients can book you from your public profile.
        </p>
      )}
    </div>
  )
}

export function CalConnectionCard({
  vlpConnected,
  proConnected,
  onConnectVlp,
  onConnectPro,
  connecting,
  error,
  variant,
}: CalConnectionCardProps) {
  if (variant === 'calendar') {
    return (
      <FlowACard
        vlpConnected={vlpConnected}
        onConnectVlp={onConnectVlp}
        connecting={connecting}
        error={error}
      />
    )
  }

  if (variant === 'profile') {
    return (
      <FlowBCard
        proConnected={proConnected}
        onConnectPro={onConnectPro}
        connecting={connecting}
        error={error}
      />
    )
  }

  // analytics — both side by side
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <FlowACard
        vlpConnected={vlpConnected}
        onConnectVlp={onConnectVlp}
        connecting={connecting}
        error={error}
      />
      <FlowBCard
        proConnected={proConnected}
        onConnectPro={onConnectPro}
        connecting={connecting}
        error={error}
      />
    </div>
  )
}
