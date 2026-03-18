'use client'

declare global { interface Window { Cal?: (...args: unknown[]) => void } }

import { useEffect, useRef, useState } from 'react'
import { useCal, type Booking } from '@/components/cal/useCal'
import { CalConnectionCard } from '@/components/cal/CalConnectionCard'
import { BookingList } from '@/components/cal/BookingList'

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled'

interface GoogleEvent {
  googleEventId: string
  title: string
  startAt: string
  endAt: string
  allDay: boolean
  htmlLink: string
  description: string
  location: string
  status: string
  colorId: string
}

const STATUS_STYLES: Record<BookingStatus, string> = {
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

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso: string, allDay: boolean): string {
  if (allDay) return 'All day'
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// ── Event Detail Modal ────────────────────────────────────────────────────────

function EventModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const date = new Date(booking.scheduledAt)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-base font-bold text-white">{formatBookingType(booking.bookingType)}</div>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[booking.status as BookingStatus]}`}>
              {booking.status}
            </span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
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
          {booking.durationMinutes && (
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-300">{booking.durationMinutes} minutes</span>
            </div>
          )}
          {booking.description && (
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-400">{booking.description}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={booking.meetingUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition ${booking.meetingUrl ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:from-orange-400 hover:to-amber-400' : 'cursor-not-allowed bg-slate-800 text-slate-500'}`}
          >
            Join Meeting
          </a>
          <a
            href={booking.rescheduleUrl ?? '#'}
            target={booking.rescheduleUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${booking.rescheduleUrl ? 'border-slate-700 text-slate-300 hover:text-white' : 'cursor-not-allowed border-slate-800 text-slate-600'}`}
          >
            Reschedule
          </a>
          <a
            href={booking.cancelUrl ?? '#'}
            target={booking.cancelUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${booking.cancelUrl ? 'border-slate-700 text-slate-300 hover:text-white' : 'cursor-not-allowed border-slate-800 text-slate-600'}`}
          >
            Cancel
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-800 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Google Events Modal ───────────────────────────────────────────────────────

function GoogleEventsModal({ events, onClose }: { events: GoogleEvent[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            <h2 className="text-base font-bold text-white">Google Calendar Events</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.googleEventId} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-white">{e.title}</span>
                {e.status === 'tentative' && (
                  <span className="shrink-0 rounded-full bg-amber-900/60 px-2 py-0.5 text-xs font-semibold text-amber-300">Tentative</span>
                )}
                {e.status === 'cancelled' && (
                  <span className="shrink-0 rounded-full bg-red-900/60 px-2 py-0.5 text-xs font-semibold text-red-300">Cancelled</span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {formatTime(e.startAt, e.allDay)}
                {!e.allDay && ` – ${formatTime(e.endAt, false)}`}
              </div>
              {e.location && (
                <div className="mt-1 text-xs text-slate-500 truncate">{e.location}</div>
              )}
              {e.htmlLink && (
                <a
                  href={e.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Open in Google Calendar →
                </a>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-800 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Google Calendar Modal (connect / status) ──────────────────────────────────

function GoogleCalModal({
  googleConnected, googleConnecting, googleError, onConnect, onClose,
}: {
  googleConnected: boolean | null
  googleConnecting: boolean
  googleError: string | null
  onConnect: () => void
  onClose: () => void
}) {
  const [disconnectMsg, setDisconnectMsg] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-bold text-white">
            {googleConnected ? 'Google Calendar Connected' : 'Connect Google Calendar'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {googleConnected ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-emerald-900/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">✓ Connected</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your Google Calendar events are shown in blue on the calendar.
            </p>
            {disconnectMsg ? (
              <p className="mt-3 text-sm text-amber-400">To disconnect Google Calendar, please contact support.</p>
            ) : (
              <button
                type="button"
                onClick={() => setDisconnectMsg(true)}
                className="mt-5 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                Disconnect
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400 leading-relaxed">
              Show your Google Calendar events alongside your VLP bookings.
            </p>
            <p className="mt-2 text-xs text-slate-500">Read-only access to your primary calendar.</p>
            {googleError && <p className="mt-3 text-xs text-red-400">{googleError}</p>}
            <button
              type="button"
              onClick={onConnect}
              disabled={googleConnecting}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-sm font-bold text-white hover:from-blue-500 hover:to-blue-400 transition disabled:opacity-60"
            >
              {googleConnecting ? 'Connecting…' : 'Connect Google Calendar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl border border-slate-800 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── All Events Slide-over ─────────────────────────────────────────────────────

function AllEventsSlideOver({ bookings, onClose, onSelect }: { bookings: Booking[]; onClose: () => void; onSelect: (b: Booking) => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} />
      <div className="relative flex w-full max-w-md flex-col bg-slate-900 border-l border-slate-800/60 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <h2 className="text-sm font-bold text-white">All Events</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {bookings.length === 0 && <p className="text-sm text-slate-500">No bookings found.</p>}
          {bookings.map((b) => {
            const d = new Date(b.scheduledAt)
            return (
              <button
                key={b.bookingId}
                type="button"
                onClick={() => { onSelect(b); onClose() }}
                className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-left hover:border-amber-500/30 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{formatBookingType(b.bookingType)}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[b.status as BookingStatus]}`}>{b.status}</span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({ year, month, bookingMap, googleEventMap, onDayClick, onPrev, onNext }: {
  year: number
  month: number
  bookingMap: Record<string, Booking[]>
  googleEventMap: Record<string, GoogleEvent[]>
  onDayClick: (bookings: Booking[], googleEvts: GoogleEvent[]) => void
  onPrev: () => void
  onNext: () => void
}) {
  const today = new Date()
  const todayKey = toDateKey(today)

  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()

  const cells: { date: Date; overflow: boolean }[] = []
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: new Date(year, month, 1 - (startOffset - i)), overflow: true })
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), overflow: false })
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), overflow: true })
  }

  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="flex-1 min-w-0">
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onPrev} className="rounded-lg p-1.5 text-slate-400 hover:text-white transition">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-white">{monthName}</span>
        <button type="button" onClick={onNext} className="rounded-lg p-1.5 text-slate-400 hover:text-white transition">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="py-1 text-center text-xs font-semibold text-slate-500">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const key = toDateKey(cell.date)
          const cellBookings = bookingMap[key] ?? []
          const cellGoogleEvts = googleEventMap[key] ?? []
          const hasBookings = cellBookings.length > 0
          const hasGoogle = cellGoogleEvts.length > 0
          const isToday = key === todayKey
          const clickable = !cell.overflow && (hasBookings || hasGoogle)

          let cls = 'relative flex flex-col items-center justify-start rounded-lg min-h-[52px] p-1.5 transition '
          if (cell.overflow) {
            cls += 'text-slate-700 cursor-default'
          } else if (isToday) {
            cls += 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold cursor-pointer hover:border-amber-500/60'
          } else if (hasBookings) {
            cls += 'bg-emerald-500/10 border border-emerald-500/30 text-slate-300 cursor-pointer hover:border-emerald-500/50'
          } else if (hasGoogle) {
            cls += 'bg-blue-500/10 border border-blue-500/30 text-slate-300 cursor-pointer hover:border-blue-500/50'
          } else {
            cls += 'border border-slate-800/60 bg-slate-900/40 text-slate-300 cursor-pointer hover:border-amber-500/40'
          }

          return (
            <div
              key={i}
              className={cls}
              onClick={() => clickable && onDayClick(cellBookings, cellGoogleEvts)}
            >
              <span className="text-xs">{cell.date.getDate()}</span>
              {!cell.overflow && (hasBookings || hasGoogle) && (
                <div className="absolute bottom-1.5 flex gap-0.5">
                  {hasBookings && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  {hasGoogle && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Upcoming Events Sidebar ───────────────────────────────────────────────────

function UpcomingSidebar({ bookings, googleConnected, onGoogleCalClick, onViewAll, onSelect }: {
  bookings: Booking[]
  googleConnected: boolean | null
  onGoogleCalClick: () => void
  onViewAll: () => void
  onSelect: (b: Booking) => void
}) {
  return (
    <div className="w-64 shrink-0 sticky top-8 self-start space-y-3">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-white">Upcoming Events</span>
        </div>
        <div className="mb-3 text-xs text-slate-500">
          <div>Last synced: —</div>
          <div>Auto-sync every 6 hours</div>
        </div>

        <BookingList
          bookings={bookings}
          filter="upcoming"
          onFilterChange={() => {}}
          onSelect={onSelect}
          selectedId={null}
          loading={false}
          hideFilters
        />

        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={onGoogleCalClick}
            className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              googleConnected
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:text-blue-200'
                : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white'
            }`}
          >
            {googleConnected ? '● Google Calendar Connected' : 'Connect Google Calendar'}
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            View All Events
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type MainTab = 'calendar' | 'demo' | 'support'

export default function CalendarPage() {
  const cal = useCal()

  // Google Calendar state
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([])
  const [googleConnecting, setGoogleConnecting] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  // Calendar state
  const [mainTab, setMainTab] = useState<MainTab>('calendar')
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedBookings, setSelectedBookings] = useState<Booking[] | null>(null)
  const [selectedGoogleEvents, setSelectedGoogleEvents] = useState<GoogleEvent[] | null>(null)
  const [showGoogleCal, setShowGoogleCal] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)

  const calInitialized = useRef(false)

  async function fetchGoogleEvents() {
    const eventsRes = await fetch(
      'https://api.virtuallaunch.pro/v1/google/events',
      { credentials: 'include' }
    ).catch(() => null)
    if (eventsRes?.ok) {
      const evData = await eventsRes.json()
      setGoogleEvents(evData.events ?? [])
    }
  }

  useEffect(() => {
    document.title = 'Calendar | Virtual Launch Pro'

    // Handle Google OAuth redirect params only (Cal.com params handled by useCal)
    const params = new URLSearchParams(window.location.search)
    if (params.get('google') === 'connected') {
      setGoogleConnected(true)
      window.history.replaceState({}, '', '/calendar')
      fetchGoogleEvents()
    }
    if (params.get('google') === 'error') {
      setGoogleError('Google Calendar connection failed: ' + (params.get('reason') ?? 'unknown error'))
      window.history.replaceState({}, '', '/calendar')
    }

    async function init() {
      try {
        const googleStatusRes = await fetch(
          'https://api.virtuallaunch.pro/v1/google/status',
          { credentials: 'include' }
        ).catch(() => null)
        if (googleStatusRes?.ok) {
          const gs = await googleStatusRes.json()
          const isGoogleConnected = gs.connected ?? false
          setGoogleConnected(isGoogleConnected)
          if (isGoogleConnected) {
            await fetchGoogleEvents()
          }
        }
      } catch {
        // ignore
      }
    }

    init()
  }, [])

  useEffect(() => {
    if ((mainTab === 'demo' || mainTab === 'support') && !calInitialized.current) {
      calInitialized.current = true
      ;(function (C: Window & typeof globalThis, A: string, L: string) {
        const p = function (a: { q: unknown[] }, ar: unknown) { a.q.push(ar) }
        const d = C.document
        C.Cal = C.Cal || function (...args: unknown[]) {
          const cal = C.Cal!
          if (!(cal as unknown as { loaded?: boolean }).loaded) {
            ;(cal as unknown as { ns: Record<string, unknown>; q: unknown[]; loaded: boolean }).ns = {}
            ;(cal as unknown as { q: unknown[] }).q = (cal as unknown as { q: unknown[] }).q || []
            const s = d.createElement('script') as HTMLScriptElement
            s.src = A
            d.head.appendChild(s)
            ;(cal as unknown as { loaded: boolean }).loaded = true
          }
          if (args[0] === L) {
            const api = function (...a: unknown[]) { p(api as unknown as { q: unknown[] }, a) }
            ;(api as unknown as { q: unknown[] }).q = []
            const namespace = args[1] as string
            if (typeof namespace === 'string') {
              ;(cal as unknown as { ns: Record<string, unknown> }).ns[namespace] =
                (cal as unknown as { ns: Record<string, unknown> }).ns[namespace] || api
              p((cal as unknown as { ns: Record<string, unknown> }).ns[namespace] as { q: unknown[] }, args)
              p(cal as unknown as { q: unknown[] }, ['initNamespace', namespace])
            } else {
              p(cal as unknown as { q: unknown[] }, args)
            }
            return
          }
          p(cal as unknown as { q: unknown[] }, args)
        }
      })(window, 'https://app.cal.com/embed/embed.js', 'init')

      window.Cal!('init', 'virtual-launch-pro-demo-intro', { origin: 'https://app.cal.com' })
      ;(window.Cal as unknown as { ns: Record<string, (...args: unknown[]) => void> }).ns['virtual-launch-pro-demo-intro']('ui', {
        cssVarsPerTheme: { light: { 'cal-brand': '#292929' }, dark: { 'cal-brand': '#f97316' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      })

      window.Cal!('init', 'virtual-launch-pro-support', { origin: 'https://app.cal.com' })
      ;(window.Cal as unknown as { ns: Record<string, (...args: unknown[]) => void> }).ns['virtual-launch-pro-support']('ui', {
        cssVarsPerTheme: { light: { 'cal-brand': '#292929' }, dark: { 'cal-brand': '#f97316' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      })
    }
  }, [mainTab])

  async function handleGoogleConnect() {
    setGoogleConnecting(true)
    setGoogleError(null)
    try {
      const res = await fetch(
        'https://api.virtuallaunch.pro/v1/google/oauth/start',
        { credentials: 'include' }
      )
      if (!res.ok) {
        setGoogleError('Failed to start Google authorization.')
        return
      }
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
      else setGoogleError('No authorization URL returned.')
    } catch {
      setGoogleError('Network error. Please try again.')
    } finally {
      setGoogleConnecting(false)
    }
  }

  // Build bookingMap for calendar highlights
  const bookingMap: Record<string, Booking[]> = {}
  for (const b of cal.bookings) {
    const key = toDateKey(new Date(b.scheduledAt))
    if (!bookingMap[key]) bookingMap[key] = []
    bookingMap[key].push(b)
  }

  // Build googleEventMap for calendar highlights
  const googleEventMap: Record<string, GoogleEvent[]> = {}
  for (const e of googleEvents) {
    const key = e.startAt.slice(0, 10)
    if (!googleEventMap[key]) googleEventMap[key] = []
    googleEventMap[key].push(e)
  }

  function handleDayClick(dayBookings: Booking[], dayGoogleEvts: GoogleEvent[]) {
    if (dayBookings.length > 0) setSelectedBookings(dayBookings)
    else setSelectedBookings(null)
    if (dayGoogleEvts.length > 0) setSelectedGoogleEvents(dayGoogleEvts)
    else setSelectedGoogleEvents(null)
  }

  const MAIN_TABS: { key: MainTab; label: string }[] = [
    { key: 'calendar', label: 'My Calendar' },
    { key: 'demo', label: 'Book Demo / Intro' },
    { key: 'support', label: 'Book Support' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-slate-400">View your bookings and schedule sessions.</p>
      </div>

      {/* Main tabs */}
      <div className="flex flex-wrap gap-2">
        {MAIN_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMainTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mainTab === key
                ? 'bg-amber-500/15 border border-amber-500/35 text-white'
                : 'border border-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: My Calendar */}
      {mainTab === 'calendar' && (
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
            <CalendarGrid
              year={calYear}
              month={calMonth}
              bookingMap={bookingMap}
              googleEventMap={googleEventMap}
              onDayClick={handleDayClick}
              onPrev={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
                else setCalMonth((m) => m - 1)
              }}
              onNext={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
                else setCalMonth((m) => m + 1)
              }}
            />
          </div>
          <UpcomingSidebar
            bookings={cal.bookings}
            googleConnected={googleConnected}
            onGoogleCalClick={() => setShowGoogleCal(true)}
            onViewAll={() => setShowAllEvents(true)}
            onSelect={(b) => setSelectedBookings([b])}
          />
        </div>
      )}

      {/* Tab: Book Demo / Intro */}
      {mainTab === 'demo' && (
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 text-center">
            <svg className="mx-auto mb-4 h-12 w-12 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="mb-2 text-lg font-bold text-white">Book a Demo / Intro</h2>
            <p className="mb-6 text-sm text-slate-400">
              Schedule a walkthrough of Virtual Launch Pro features and get your questions answered.
            </p>
            <button
              type="button"
              data-cal-link="tax-monitor-pro/virtual-launch-pro-demo-intro"
              data-cal-namespace="virtual-launch-pro-demo-intro"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition"
            >
              Schedule Demo / Intro →
            </button>
          </div>
        </div>
      )}

      {/* Tab: Book Support */}
      {mainTab === 'support' && (
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 text-center">
            <svg className="mx-auto mb-4 h-12 w-12 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="mb-2 text-lg font-bold text-white">Book a Support Call</h2>
            <p className="mb-6 text-sm text-slate-400">
              Get help with your account setup, platform questions, or onboarding steps.
            </p>
            <button
              type="button"
              data-cal-link="tax-monitor-pro/virtual-launch-pro-support"
              data-cal-namespace="virtual-launch-pro-support"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition"
            >
              Schedule Support Call →
            </button>
          </div>
        </div>
      )}

      {/* Cal.com connection — always visible */}
      <CalConnectionCard
        variant="calendar"
        vlpConnected={cal.vlpConnected ?? false}
        proConnected={cal.proConnected ?? false}
        onConnectVlp={cal.connectVlp}
        onConnectPro={cal.connectPro}
        connecting={cal.connecting}
        error={cal.connectError}
      />

      {/* Modals / slide-overs */}
      {selectedBookings && selectedBookings.length > 0 && (
        <EventModal booking={selectedBookings[0]} onClose={() => setSelectedBookings(null)} />
      )}
      {selectedGoogleEvents && selectedGoogleEvents.length > 0 && !selectedBookings && (
        <GoogleEventsModal events={selectedGoogleEvents} onClose={() => setSelectedGoogleEvents(null)} />
      )}
      {showGoogleCal && (
        <GoogleCalModal
          googleConnected={googleConnected}
          googleConnecting={googleConnecting}
          googleError={googleError}
          onConnect={handleGoogleConnect}
          onClose={() => setShowGoogleCal(false)}
        />
      )}
      {showAllEvents && (
        <AllEventsSlideOver
          bookings={cal.bookings}
          onClose={() => setShowAllEvents(false)}
          onSelect={(b) => { setSelectedBookings([b]); setShowAllEvents(false) }}
        />
      )}
    </div>
  )
}
