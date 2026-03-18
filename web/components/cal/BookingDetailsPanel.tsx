'use client'

import type { Booking } from './useCal'
import { BookingActions } from './BookingActions'

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

interface BookingDetailsPanelProps {
  booking: Booking | null
  onClose: () => void
  onReschedule: (b: Booking) => void
  onCancel: (b: Booking) => void
}

export function BookingDetailsPanel({
  booking,
  onClose,
  onReschedule,
  onCancel,
}: BookingDetailsPanelProps) {
  if (!booking) {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-slate-500">Select a booking to view details</p>
      </div>
    )
  }

  const date = new Date(booking.scheduledAt)

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold text-white">{formatBookingType(booking.bookingType)}</div>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[booking.status] ?? 'bg-slate-800 text-slate-400'}`}>
            {booking.status}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:text-white transition shrink-0"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2.5 text-sm">
        {/* Date / time */}
        <div className="flex items-center gap-3">
          <svg className="h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-300">
            {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {' at '}
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {booking.timezone}
          </span>
        </div>

        {/* Duration */}
        {booking.durationMinutes && (
          <div className="flex items-center gap-3">
            <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-300">{booking.durationMinutes} minutes</span>
          </div>
        )}

        {/* Client info */}
        {(booking.clientName || booking.clientEmail) && (
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              {booking.clientName && <div className="text-slate-300">{booking.clientName}</div>}
              {booking.clientEmail && <div className="text-slate-500 text-xs">{booking.clientEmail}</div>}
            </div>
          </div>
        )}

        {/* Description */}
        {booking.description && (
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-400">{booking.description}</span>
          </div>
        )}
      </div>

      {/* Meeting URL */}
      <a
        href={booking.meetingUrl ?? '#'}
        target={booking.meetingUrl ? '_blank' : undefined}
        rel="noopener noreferrer"
        className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold transition ${
          booking.meetingUrl
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:from-orange-400 hover:to-amber-400'
            : 'cursor-not-allowed bg-slate-800 text-slate-500'
        }`}
      >
        Join Meeting
      </a>

      <BookingActions
        booking={booking}
        onReschedule={onReschedule}
        onCancel={onCancel}
        size="md"
      />
    </div>
  )
}
