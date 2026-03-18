'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled'

interface Booking {
  bookingId: string
  bookingType: 'demo_intro' | 'support'
  scheduledAt: string
  status: BookingStatus
  timezone: string
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed: 'bg-emerald-900/60 text-emerald-300',
  pending: 'bg-amber-900/60 text-amber-300',
  completed: 'bg-slate-800 text-slate-400',
  cancelled: 'bg-red-900/60 text-red-300',
  rescheduled: 'bg-blue-900/60 text-blue-300',
}

const TYPE_LABELS: Record<string, string> = {
  demo_intro: 'Demo / Intro',
  support: 'Support Call',
}

function BookingRow({ booking }: { booking: Booking }) {
  const date = new Date(booking.scheduledAt)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{TYPE_LABELS[booking.bookingType] ?? booking.bookingType}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          {booking.timezone}
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[booking.status]}`}>
        {booking.status}
      </span>
    </div>
  )
}

export default function CalendarPage() {
  const [accountId, setAccountId] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Calendar | Virtual Launch Pro'

    async function init() {
      // Get session to get accountId
      try {
        const sessionRes = await fetch('https://api.virtuallaunch.pro/v1/auth/session', { credentials: 'include' })
        if (!sessionRes.ok) { setConnected(false); return }
        const session = await sessionRes.json()
        const aid = session.account_id ?? session.accountId
        if (!aid) { setConnected(false); return }
        setAccountId(aid)

        // Try fetching bookings — if it works, Cal is connected
        const bookingsRes = await fetch(`https://api.virtuallaunch.pro/v1/bookings/by-account/${aid}`, { credentials: 'include' })
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(Array.isArray(data) ? data : (data.bookings ?? []))
          setConnected(true)
        } else {
          setConnected(false)
        }
      } catch {
        setConnected(false)
      }
    }

    init()
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch('https://api.virtuallaunch.pro/v1/cal/oauth/start', { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setConnectError((data as { message?: string }).message || 'Failed to start Cal.com authorization.')
        return
      }
      const data = await res.json()
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        setConnectError('No authorization URL returned.')
      }
    } catch {
      setConnectError('Network error. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const now = new Date()
  const upcoming = bookings.filter((b) => new Date(b.scheduledAt) >= now && b.status !== 'cancelled')
  const past = bookings.filter((b) => new Date(b.scheduledAt) < now || b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-slate-400">Your upcoming and past sessions.</p>
      </div>

      {connected === null && (
        <Card>
          <p className="text-sm text-slate-500">Loading…</p>
        </Card>
      )}

      {connected === false && (
        <Card>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Connect your Cal.com account</h2>
              <p className="mt-1 text-sm text-slate-400 max-w-md">
                Connect your Cal.com account to enable scheduling on your public profile. Once connected, upcoming and past bookings will appear here.
              </p>
              {connectError && <p className="mt-2 text-xs text-red-400">{connectError}</p>}
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
            >
              {connecting ? 'Connecting…' : 'Connect Cal.com'}
            </button>
          </div>
        </Card>
      )}

      {connected === true && (
        <>
          <Card>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">No upcoming bookings.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {upcoming.map((b) => <BookingRow key={b.bookingId} booking={b} />)}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Past ({past.length})
            </h2>
            {past.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">No past bookings.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {past.map((b) => <BookingRow key={b.bookingId} booking={b} />)}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
