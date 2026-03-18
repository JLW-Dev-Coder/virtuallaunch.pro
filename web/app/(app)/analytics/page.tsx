'use client'

import { useState } from 'react'
import { useCal, type Booking } from '@/components/cal/useCal'
import { CalConnectionCard } from '@/components/cal/CalConnectionCard'
import { BookingList } from '@/components/cal/BookingList'
import { BookingDetailsPanel } from '@/components/cal/BookingDetailsPanel'
import { EventTypesList } from '@/components/cal/EventTypesList'
import { AvailabilitySummary } from '@/components/cal/AvailabilitySummary'

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse ${className}`} />
}

export default function AnalyticsPage() {
  const cal = useCal()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [bookingFilter, setBookingFilter] = useState('all')

  const now = new Date()
  const totalBookings = cal.bookings.length
  const upcomingCount = cal.bookings.filter(
    (b) => new Date(b.scheduledAt) >= now && b.status !== 'cancelled'
  ).length
  const completedCount = cal.bookings.filter((b) => b.status === 'completed').length
  const cancelledCount = cal.bookings.filter((b) => b.status === 'cancelled').length

  const isConnected = cal.proConnected || cal.vlpConnected

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Booking management and scheduling analytics.</p>
      </div>

      {/* Loading state */}
      {cal.loading && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <SkeletonCard className="h-40 flex-1" />
            <SkeletonCard className="h-40 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="h-24" />
            ))}
          </div>
          <SkeletonCard className="h-96" />
        </div>
      )}

      {!cal.loading && (
        <>
          {/* Row 1 — Connection status */}
          <CalConnectionCard
            variant="analytics"
            vlpConnected={cal.vlpConnected ?? false}
            proConnected={cal.proConnected ?? false}
            onConnectVlp={cal.connectVlp}
            onConnectPro={cal.connectPro}
            connecting={cal.connecting}
            error={cal.connectError}
          />

          {isConnected && (
            <>
              {/* Row 2 — Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatBox label="Total Bookings" value={totalBookings} />
                <StatBox label="Upcoming" value={upcomingCount} />
                <StatBox label="Completed" value={completedCount} />
                <StatBox label="Cancelled" value={cancelledCount} />
              </div>

              {/* Row 3 — Booking management + detail panel */}
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex-1 min-w-0">
                  <h2 className="mb-3 text-base font-semibold text-white">Booking Management</h2>
                  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                    <BookingList
                      bookings={cal.bookings}
                      filter={bookingFilter as 'all' | 'upcoming' | 'past' | 'cancelled'}
                      onFilterChange={setBookingFilter}
                      onSelect={setSelectedBooking}
                      selectedId={selectedBooking?.bookingId ?? null}
                      loading={cal.loading}
                    />
                  </div>
                </div>

                <div className="w-full lg:w-80 lg:sticky lg:top-8">
                  <BookingDetailsPanel
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onReschedule={(b) => b.rescheduleUrl && window.open(b.rescheduleUrl, '_blank')}
                    onCancel={(b) => b.cancelUrl && window.open(b.cancelUrl, '_blank')}
                  />
                </div>
              </div>

              {/* Row 4 — Event types + availability (pro only) */}
              {cal.proConnected && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h2 className="mb-3 text-base font-semibold text-white">Your Event Types</h2>
                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                      <EventTypesList eventTypes={cal.eventTypes} loading={cal.loading} />
                    </div>
                  </div>
                  <div>
                    <h2 className="mb-3 text-base font-semibold text-white">Your Availability</h2>
                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                      <AvailabilitySummary availability={cal.availability} loading={cal.loading} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
