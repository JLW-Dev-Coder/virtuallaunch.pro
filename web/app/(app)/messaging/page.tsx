'use client'

import { useState, useEffect, useCallback } from 'react'

const API = 'https://api.virtuallaunch.pro'

type InquiryStatus = 'new' | 'responded' | 'archived'

interface Inquiry {
  inquiry_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  business_types: string[]
  irs_notice_received: string
  irs_notice_type: string
  irs_notice_date: string
  budget_preference: string
  tax_years_affected: string
  services_needed: string[]
  preferred_state: string
  preferred_city: string
  prior_audit_experience: number
  membership_interest: string
  status: InquiryStatus
  assigned_professional_id: string
  response_message: string
  created_at: string
  updated_at: string
}

interface Session {
  account_id: string
  email: string
}

const STATUS_DOT: Record<InquiryStatus, string> = {
  new: 'bg-amber-400 animate-pulse',
  responded: 'bg-emerald-400',
  archived: 'bg-slate-500',
}

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'New',
  responded: 'Responded',
  archived: 'Archived',
}

const BUDGET_BADGE: Record<string, string> = {
  'Budget-friendly': 'border-slate-600 text-slate-400',
  'Moderate': 'border-amber-600/60 text-amber-400',
  'Premium': 'border-emerald-600/60 text-emerald-400',
}

type FilterKey = 'all' | InquiryStatus

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'responded', label: 'Responded' },
  { key: 'archived', label: 'Archived' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} mo ago`
}

export default function MessagingPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [replySent, setReplySent] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sesRes, inqRes] = await Promise.all([
        fetch(`${API}/v1/auth/session`, { credentials: 'include' }),
        fetch(`${API}/v1/inquiries`, { credentials: 'include' }),
      ])
      if (!sesRes.ok) throw new Error('Session error')
      if (!inqRes.ok) throw new Error('Failed to load inquiries')
      const sesData = await sesRes.json()
      const inqData = await inqRes.json()
      setSession(sesData.session)
      setInquiries(inqData.inquiries ?? [])
    } catch {
      setError('Unable to load inquiries. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    responded: inquiries.filter((i) => i.status === 'responded').length,
    archived: inquiries.filter((i) => i.status === 'archived').length,
  }

  const filtered = inquiries
    .filter((i) => filter === 'all' || i.status === filter)
    .filter((i) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const name = `${i.first_name} ${i.last_name}`.toLowerCase()
      const services = i.services_needed.join(' ').toLowerCase()
      return name.includes(q) || services.includes(q)
    })

  function updateLocalInquiry(id: string, patch: Partial<Inquiry>) {
    setInquiries((prev) => prev.map((i) => (i.inquiry_id === id ? { ...i, ...patch } : i)))
    setSelected((s) => (s?.inquiry_id === id ? { ...s, ...patch } : s))
  }

  async function handleStatusChange(inquiry: Inquiry, newStatus: InquiryStatus) {
    try {
      const res = await fetch(`${API}/v1/inquiries/${inquiry.inquiry_id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) return
      updateLocalInquiry(inquiry.inquiry_id, { status: newStatus })
    } catch {
      // silent
    }
  }

  async function handleReply() {
    if (!selected || !replyText.trim() || !session) return
    setSending(true)
    try {
      const res = await fetch(`${API}/v1/inquiries/${selected.inquiry_id}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, professionalName: session.email }),
      })
      if (!res.ok) return
      updateLocalInquiry(selected.inquiry_id, { status: 'responded', response_message: replyText })
      setReplyText('')
      setReplySent(true)
      setTimeout(() => setReplySent(false), 3000)
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 gap-0">
        <div className="w-56 shrink-0 border-r border-slate-800/60 flex flex-col py-4 px-3 gap-1">
          <div className="mb-3 px-1 space-y-1.5">
            <div className="h-5 w-24 rounded-md bg-slate-800 animate-pulse" />
            <div className="h-3 w-36 rounded bg-slate-800/60 animate-pulse" />
          </div>
          {FILTERS.map((f) => (
            <div key={f.key} className="h-9 rounded-lg bg-slate-800/40 animate-pulse" />
          ))}
        </div>
        <div className="flex flex-1 flex-col min-w-0 border-r border-slate-800/60 gap-2 p-3">
          <div className="h-9 w-full rounded-xl bg-slate-800/40 animate-pulse" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-48 rounded bg-slate-800/60 animate-pulse" />
              <div className="h-3 w-40 rounded bg-slate-800/60 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="w-96 shrink-0" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 gap-0">
      {/* Left column — filters */}
      <div className="w-56 shrink-0 border-r border-slate-800/60 flex flex-col py-4 px-3 gap-1">
        <div className="mb-3 flex items-start justify-between px-1">
          <div>
            <h1 className="text-base font-bold text-white">Inquiries</h1>
            <p className="text-xs text-slate-500 mt-0.5">Taxpayer intake requests</p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            title="Refresh"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
              filter === f.key
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span>{f.label}</span>
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
              filter === f.key ? 'bg-slate-700 text-white' : 'bg-slate-800/80 text-slate-500'
            }`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Middle column — inquiry list */}
      <div className="flex flex-1 flex-col min-w-0 border-r border-slate-800/60 overflow-y-auto">
        <div className="px-3 pt-3 pb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or service…"
            className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center gap-3">
            <svg className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-slate-500 max-w-xs">
              {search || filter !== 'all'
                ? 'No inquiries match your filter.'
                : 'No inquiries yet. Share your profile link to start receiving match requests from taxpayers.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3 pb-3">
            {filtered.map((inq) => (
              <button
                key={inq.inquiry_id}
                type="button"
                onClick={() => {
                  setSelected(inq)
                  setReplySent(false)
                  setReplyText('')
                }}
                className={`w-full text-left rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 transition hover:bg-slate-800/60 ${
                  selected?.inquiry_id === inq.inquiry_id
                    ? 'ring-1 ring-orange-500/40 border-orange-500/20'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm text-white">
                    {inq.first_name} {inq.last_name.charAt(0)}.
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[inq.status] ?? 'bg-slate-500'}`} />
                    <span className="text-xs text-slate-500">{STATUS_LABEL[inq.status] ?? inq.status}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400 truncate">
                  {inq.services_needed.length > 0
                    ? `${inq.services_needed.slice(0, 2).join(', ')}${inq.services_needed.length > 2 ? ` +${inq.services_needed.length - 2} more` : ''}`
                    : 'No services specified'}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>
                    {inq.preferred_city && inq.preferred_state
                      ? `${inq.preferred_city}, ${inq.preferred_state}`
                      : inq.preferred_state || inq.preferred_city || 'Location not specified'}
                  </span>
                  {inq.budget_preference && (
                    <>
                      <span>·</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${BUDGET_BADGE[inq.budget_preference] ?? 'border-slate-700 text-slate-400'}`}>
                        {inq.budget_preference}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>{timeAgo(inq.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right column — detail */}
      <div className="w-96 shrink-0 flex flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center gap-3">
            <svg className="h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-slate-500">Select an inquiry to view details and respond.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-slate-800/60 px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {selected.first_name} {selected.last_name.charAt(0)}.
                  </h2>
                  <div className="mt-0.5 text-xs text-slate-500">Received {timeAgo(selected.created_at)}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[selected.status] ?? 'bg-slate-500'}`} />
                    <span className="text-xs text-slate-400">{STATUS_LABEL[selected.status] ?? selected.status}</span>
                  </div>
                  {selected.budget_preference && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${BUDGET_BADGE[selected.budget_preference] ?? 'border-slate-700 text-slate-400'}`}>
                      {selected.budget_preference}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detail sections */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Contact Info */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Info</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-baseline gap-2">
                    <dt className="w-12 shrink-0 text-xs text-slate-500">Email</dt>
                    <dd className="text-slate-300 break-all">{selected.email}</dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="w-12 shrink-0 text-xs text-slate-500">Phone</dt>
                    <dd className="text-slate-300">{selected.phone}</dd>
                  </div>
                </dl>
              </section>

              {/* Tax Situation */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tax Situation</h3>
                <dl className="space-y-2 text-sm">
                  {selected.business_types.length > 0 && (
                    <div>
                      <dt className="text-xs text-slate-500">Business Types</dt>
                      <dd className="mt-0.5 text-slate-300">{selected.business_types.join(', ')}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-slate-500">IRS Notice Received</dt>
                    <dd className="mt-0.5 text-slate-300">{selected.irs_notice_received || '—'}</dd>
                  </div>
                  {selected.irs_notice_received === 'Yes' && (
                    <>
                      {selected.irs_notice_type && (
                        <div>
                          <dt className="text-xs text-slate-500">Notice Type</dt>
                          <dd className="mt-0.5 text-slate-300">{selected.irs_notice_type}</dd>
                        </div>
                      )}
                      {selected.irs_notice_date && (
                        <div>
                          <dt className="text-xs text-slate-500">Notice Date</dt>
                          <dd className="mt-0.5 text-slate-300">{selected.irs_notice_date}</dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </section>

              {/* Services Requested */}
              {selected.services_needed.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Services Requested</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.services_needed.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Preferences */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preferences</h3>
                <dl className="space-y-2 text-sm">
                  {selected.budget_preference && (
                    <div>
                      <dt className="text-xs text-slate-500">Budget</dt>
                      <dd className="mt-0.5 text-slate-300">{selected.budget_preference}</dd>
                    </div>
                  )}
                  {selected.tax_years_affected && (
                    <div>
                      <dt className="text-xs text-slate-500">Tax Years Affected</dt>
                      <dd className="mt-0.5 text-slate-300">{selected.tax_years_affected}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-slate-500">Location</dt>
                    <dd className="mt-0.5 text-slate-300">
                      {selected.preferred_city && selected.preferred_state
                        ? `${selected.preferred_city}, ${selected.preferred_state}`
                        : selected.preferred_state || selected.preferred_city || 'Not specified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Prior Audit Experience</dt>
                    <dd className="mt-0.5 text-slate-300">{selected.prior_audit_experience ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </section>

              {/* Membership Interest */}
              {selected.membership_interest && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Membership Interest</h3>
                  <p className="text-sm text-slate-300">{selected.membership_interest}</p>
                </section>
              )}
            </div>

            {/* Actions + Reply */}
            <div className="border-t border-slate-800/60 px-4 py-3 space-y-3">
              <div className="flex gap-2">
                {selected.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selected, 'archived')}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    Archive
                  </button>
                )}
                {selected.status !== 'new' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selected, 'new')}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    Mark as New
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500">Your response</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a response to this taxpayer…"
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none resize-none"
                />
                {replySent && (
                  <p className="text-xs font-medium text-emerald-400">Response sent</p>
                )}
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send Response'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
