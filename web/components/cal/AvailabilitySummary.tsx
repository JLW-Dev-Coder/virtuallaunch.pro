'use client'

import type { AvailabilityData } from './useCal'

interface AvailabilitySummaryProps {
  availability: AvailabilityData | null
  loading: boolean
}

export function AvailabilitySummary({ availability, loading }: AvailabilitySummaryProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!availability) {
    return (
      <p className="text-sm text-slate-500">
        No availability configured.{' '}
        <a
          href="https://cal.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 transition"
        >
          Set up at cal.com
        </a>
        .
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-semibold text-slate-300">
          {availability.timezone}
        </span>
      </div>

      {availability.schedules.map((sched, i) => (
        <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 space-y-2">
          <div className="text-sm font-medium text-white">{sched.name}</div>
          <div className="flex flex-wrap gap-1">
            {sched.days.map((day) => (
              <span
                key={day}
                className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300"
              >
                {day}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-400">
            {sched.startTime} – {sched.endTime}
          </div>
        </div>
      ))}
    </div>
  )
}
