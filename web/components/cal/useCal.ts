'use client'

import { useEffect, useState } from 'react'

export interface Booking {
  bookingId: string
  bookingType: string
  scheduledAt: string
  durationMinutes?: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled'
  timezone: string
  clientName?: string
  clientEmail?: string
  description?: string
  meetingUrl?: string
  rescheduleUrl?: string
  cancelUrl?: string
}

export interface EventType {
  id: string
  title: string
  slug: string
  length: number
  hidden: boolean
  bookingUrl?: string
}

export interface AvailabilityData {
  timezone: string
  schedules: {
    name: string
    days: string[]
    startTime: string
    endTime: string
  }[]
}

export function useCal() {
  const [vlpConnected, setVlpConnected] = useState<boolean | null>(null)
  const [proConnected, setProConnected] = useState<boolean | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const sessionRes = await fetch(
        'https://api.virtuallaunch.pro/v1/auth/session',
        { credentials: 'include' }
      ).catch(() => null)
      if (!sessionRes?.ok) { setLoading(false); return }
      const session = await sessionRes.json()
      const aid = session.session?.account_id ?? session.account_id
      if (!aid) { setLoading(false); return }
      setAccountId(aid)

      const statusRes = await fetch(
        'https://api.virtuallaunch.pro/v1/cal/status',
        { credentials: 'include' }
      ).catch(() => null)
      if (statusRes?.ok) {
        const status = await statusRes.json()
        setVlpConnected(status.vlpConnected ?? false)
        setProConnected(status.proConnected ?? false)

        if (status.vlpConnected) {
          const bookingsRes = await fetch(
            `https://api.virtuallaunch.pro/v1/bookings/by-account/${aid}`,
            { credentials: 'include' }
          ).catch(() => null)
          if (bookingsRes?.ok) {
            const data = await bookingsRes.json()
            setBookings(Array.isArray(data) ? data : (data.bookings ?? []))
          }
        }

        if (status.proConnected) {
          const [etRes, avRes] = await Promise.allSettled([
            fetch('https://api.virtuallaunch.pro/v1/cal/event-types', { credentials: 'include' }),
            fetch('https://api.virtuallaunch.pro/v1/cal/availability', { credentials: 'include' }),
          ])
          if (etRes.status === 'fulfilled' && etRes.value.ok) {
            const etData = await etRes.value.json()
            setEventTypes(etData.eventTypes ?? [])
          }
          if (avRes.status === 'fulfilled' && avRes.value.ok) {
            const avData = await avRes.value.json()
            setAvailability(avData.availability ?? null)
          }
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('cal') === 'connected') {
      setVlpConnected(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('pro_cal') === 'connected') {
      setProConnected(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('cal') === 'error') {
      setConnectError('Cal.com connection failed: ' + (params.get('reason') ?? 'unknown'))
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function connectVlp() {
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch(
        'https://api.virtuallaunch.pro/v1/cal/oauth/start',
        { credentials: 'include' }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setConnectError((d as { message?: string }).message ?? 'Failed to start connection.')
        return
      }
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
      else setConnectError('No authorization URL returned.')
    } catch {
      setConnectError('Network error. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  async function connectPro() {
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch(
        'https://api.virtuallaunch.pro/v1/cal/pro/oauth/start',
        { credentials: 'include' }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setConnectError((d as { message?: string }).message ?? 'Failed to start connection.')
        return
      }
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
      else setConnectError('No authorization URL returned.')
    } catch {
      setConnectError('Network error. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  return {
    vlpConnected, proConnected, bookings, eventTypes, availability,
    accountId, loading, connecting, connectError,
    connectVlp, connectPro,
  }
}
