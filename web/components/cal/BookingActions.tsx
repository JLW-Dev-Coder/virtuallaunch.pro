'use client'

import type { Booking } from './useCal'

interface BookingActionsProps {
  booking: Booking
  onReschedule: (b: Booking) => void
  onCancel: (b: Booking) => void
  size: 'sm' | 'md'
}

export function BookingActions({ booking, onReschedule, onCancel, size }: BookingActionsProps) {
  const disabled = booking.status === 'cancelled' || booking.status === 'completed'
  const sizeClass = size === 'sm'
    ? 'text-xs px-3 py-1.5'
    : 'text-sm px-4 py-2'

  function handleReschedule() {
    if (booking.rescheduleUrl) {
      window.open(booking.rescheduleUrl, '_blank')
    } else {
      onReschedule(booking)
    }
  }

  function handleCancel() {
    if (booking.cancelUrl) {
      window.open(booking.cancelUrl, '_blank')
    } else {
      onCancel(booking)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleReschedule}
        disabled={disabled}
        className={`rounded-xl border border-slate-700 font-semibold transition ${sizeClass} ${
          disabled
            ? 'cursor-not-allowed text-slate-600 border-slate-800'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        Reschedule
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={disabled}
        className={`rounded-xl border font-semibold transition ${sizeClass} ${
          disabled
            ? 'cursor-not-allowed border-slate-800 text-slate-600'
            : 'border-red-900/40 text-red-400 hover:text-red-300 hover:border-red-800/60'
        }`}
      >
        Cancel
      </button>
    </div>
  )
}
