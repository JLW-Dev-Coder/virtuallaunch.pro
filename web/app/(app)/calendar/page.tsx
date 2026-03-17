import type { Metadata } from 'next'
import Card from '@/components/ui/Card'
import { getBookingsByAccount } from '@/lib/api/client'
import { getSession } from '@/lib/auth/session'
import type { Booking } from '@/lib/api/types'

export const metadata: Metadata = { title: 'Calendar' }

const STATUS_STYLES: Record<Booking['status'], string> = {
  confirmed: 'bg-emerald-900/60 text-emerald-300',
  pending: 'bg-amber-900/60 text-amber-300',
  completed: 'bg-slate-800 text-slate-400',
  cancelled: 'bg-red-900/60 text-red-300',
  rescheduled: 'bg-blue-900/60 text-blue-300',
}

const TYPE_LABELS: Record<Booking['bookingType'], string> = {
  demo_intro: 'Demo / Intro',
  support: 'Support Call',
}

function BookingRow({ booking }: { booking: Booking }) {
  const date = new Date(booking.scheduledAt)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{TYPE_LABELS[booking.bookingType]}</div>
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

export default async function CalendarPage() {
  const session = await getSession()
  const bookings = await getBookingsByAccount(session.account_id)

  const now = new Date()
  const upcoming = bookings.filter((b) => new Date(b.scheduledAt) >= now && b.status !== 'cancelled')
  const past = bookings.filter((b) => new Date(b.scheduledAt) < now || b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-slate-400">Your upcoming and past sessions.</p>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No upcoming bookings.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {upcoming.map((b) => (
              <BookingRow key={b.bookingId} booking={b} />
            ))}
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
            {past.map((b) => (
              <BookingRow key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
