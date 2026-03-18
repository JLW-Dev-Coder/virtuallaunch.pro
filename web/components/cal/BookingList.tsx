'use client'

import type { Booking } from './useCal'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-900/60 text-emerald-300',
  pending: 'bg-amber-900/60 text-amber-300',
  completed: 'bg-slate-800 text-slate-400',
  cancelled: 'bg-red-900/60 text-red-300',
  rescheduled: 'bg-blue-900/60 text-blue-300',
}

function formatBookingType(t: string): string {
  if (t === 'demo_intro') return 'Demo / Intro'
  if (t === 'support') return 'Support Call'
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
] as const

const EMPTY_MESSAGES: Record<string, string> = {
  all: 'No bookings found.',
  upcoming: 'No upcoming bookings.',
  past: 'No past bookings.',
  cancelled: 'No cancelled bookings.',
}

interface BookingListProps {
  bookings: Booking[]
  loading: boolean
  filter: 'all' | 'upcoming' | 'past' | 'cancelled'
  onFilterChange: (f: string) => void
  onSelect: (b: Booking) => void
  selectedId: string | null
  hideFilters?: boolean
}

export function BookingList({
  bookings,
  loading,
  filter,
  onFilterChange,
  onSelect,
  selectedId,
  hideFilters = false,
}: BookingListProps) {
  const now = new Date()

  const filtered = bookings.filter((b) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return new Date(b.scheduledAt) >= now && b.status !== 'cancelled'
    if (filter === 'past') return new Date(b.scheduledAt) < now && b.status !== 'cancelled'
    if (filter === 'cancelled') return b.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-800/60 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!hideFilters && (
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                filter === key
                  ? 'bg-amber-500/15 border border-amber-500/35 text-white'
                  : 'border border-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">{EMPTY_MESSAGES[filter] ?? 'No bookings.'}</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((b) => {
            const d = new Date(b.scheduledAt)
            const isSelected = b.bookingId === selectedId
            return (
              <button
                key={b.bookingId}
                type="button"
                onClick={() => onSelect(b)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {b.clientName || 'Anonymous'} — {formatBookingType(b.bookingType)}
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[b.status] ?? 'bg-slate-800 text-slate-400'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}
                    {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {b.durationMinutes && <span>· {b.durationMinutes} min</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
