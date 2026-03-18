'use client'

import type { EventType } from './useCal'

interface EventTypesListProps {
  eventTypes: EventType[]
  loading: boolean
}

export function EventTypesList({ eventTypes, loading }: EventTypesListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
        ))}
      </div>
    )
  }

  if (eventTypes.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No event types found.{' '}
        <a
          href="https://cal.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 transition"
        >
          Create one at cal.com
        </a>
        .
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {eventTypes.map((et) => (
        <div
          key={et.id}
          className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-white truncate">{et.title}</span>
              {et.hidden && (
                <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
                  Hidden
                </span>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {et.length} min
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 truncate">cal.com/…/{et.slug}</span>
            {et.bookingUrl && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(et.bookingUrl!).catch(() => {})}
                className="shrink-0 text-xs text-slate-400 hover:text-white transition"
              >
                Copy link
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
