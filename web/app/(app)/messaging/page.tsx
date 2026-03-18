'use client'

import { useState } from 'react'

// TODO: wire to Worker endpoint when /v1/inquiries/by-professional/{professionalId} is available

type InquiryStatus = 'new' | 'responded' | 'archived'

interface Inquiry {
  id: string
  firstName: string
  lastInitial: string
  services: string[]
  city: string
  state: string
  budget: string
  receivedAt: string
  status: InquiryStatus
  businessType: string
  irsNotice: string
  taxYears: string
  notes: string
}

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: 'inq_001',
    firstName: 'Marcus',
    lastInitial: 'T',
    services: ['Audit Defense', 'IRS Collections Defense', 'Penalty Abatement'],
    city: 'Houston',
    state: 'TX',
    budget: '$1,000 – $3,000',
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'new',
    businessType: 'Sole Proprietor (Schedule C)',
    irsNotice: 'CP2000 — Income discrepancy notice',
    taxYears: '2021, 2022',
    notes: 'Received a CP2000 for two years. Has all W-2s and 1099s. Wants representation before responding.',
  },
  {
    id: 'inq_002',
    firstName: 'Sandra',
    lastInitial: 'W',
    services: ['Offer in Compromise', 'Tax Resolution'],
    city: 'Atlanta',
    state: 'GA',
    budget: '$500 – $1,000',
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'responded',
    businessType: 'Individual',
    irsNotice: 'Final Notice of Intent to Levy',
    taxYears: '2019, 2020, 2021',
    notes: 'Has significant tax debt across three years. Looking for OIC qualification assessment.',
  },
  {
    id: 'inq_003',
    firstName: 'James',
    lastInitial: 'P',
    services: ['Tax Planning', 'Business Tax Advisory'],
    city: 'Chicago',
    state: 'IL',
    budget: '$3,000+',
    receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'archived',
    businessType: 'S-Corp',
    irsNotice: 'None — proactive planning',
    taxYears: '2023 (current)',
    notes: 'Growing S-Corp looking for ongoing tax advisory relationship. Revenue ~$800K.',
  },
  {
    id: 'inq_004',
    firstName: 'Priya',
    lastInitial: 'K',
    services: ['Foreign Reporting', 'Compliance'],
    city: 'San Jose',
    state: 'CA',
    budget: '$1,000 – $3,000',
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'new',
    businessType: 'Individual',
    irsNotice: 'FBAR / FATCA compliance question',
    taxYears: '2022, 2023',
    notes: 'Has foreign accounts and needs FBAR/FATCA filing assistance for two years.',
  },
]

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

const FILTERS: { key: 'all' | InquiryStatus; label: string }[] = [
  { key: 'all', label: 'All Inquiries' },
  { key: 'new', label: 'New' },
  { key: 'responded', label: 'Responded' },
  { key: 'archived', label: 'Archived' },
]

export default function MessagingPage() {
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all')
  const [inquiries, setInquiries] = useState<Inquiry[]>(MOCK_INQUIRIES)
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    responded: inquiries.filter((i) => i.status === 'responded').length,
    archived: inquiries.filter((i) => i.status === 'archived').length,
  }

  const filtered = filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter)

  function updateStatus(id: string, status: InquiryStatus) {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null)
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return
    setSending(true)
    // TODO: POST to /v1/inquiries/{id}/reply when endpoint is available
    await new Promise((r) => setTimeout(r, 600))
    updateStatus(selected.id, 'responded')
    setReplyText('')
    setSending(false)
  }

  return (
    <div className="flex h-full min-h-0 gap-0">
      {/* Left column — filters */}
      <div className="w-56 shrink-0 border-r border-slate-800/60 flex flex-col py-4 px-3 gap-1">
        <div className="mb-3 px-1">
          <h1 className="text-base font-bold text-white">Inquiries</h1>
          <p className="text-xs text-slate-500 mt-0.5">Taxpayer intake requests</p>
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
      <div className="flex flex-1 flex-col min-w-0 border-r border-slate-800/60 overflow-y-auto divide-y divide-slate-800/60">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No inquiries in this folder.</div>
        ) : (
          filtered.map((inq) => (
            <button
              key={inq.id}
              type="button"
              onClick={() => setSelected(inq)}
              className={`w-full text-left px-4 py-4 transition hover:bg-slate-900/60 ${
                selected?.id === inq.id ? 'bg-slate-800/60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm text-white">
                  {inq.firstName} {inq.lastInitial}.
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[inq.status]}`} />
                  <span className="text-xs text-slate-500">{STATUS_LABEL[inq.status]}</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-400 truncate">
                {inq.services.slice(0, 2).join(', ')}{inq.services.length > 2 ? ` +${inq.services.length - 2} more` : ''}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>{inq.city}, {inq.state}</span>
                <span>·</span>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{inq.budget}</span>
                <span>·</span>
                <span>{new Date(inq.receivedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Right column — detail */}
      <div className="w-96 shrink-0 flex flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <p className="text-sm text-slate-500">Select an inquiry to view details.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-800/60 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white">{selected.firstName} {selected.lastInitial}.</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[selected.status]}`} />
                  <span className="text-xs text-slate-400">{STATUS_LABEL[selected.status]}</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-500">{selected.city}, {selected.state}</div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Intake fields */}
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business Type</dt>
                  <dd className="mt-0.5 text-slate-300">{selected.businessType}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">IRS Notice / Issue</dt>
                  <dd className="mt-0.5 text-slate-300">{selected.irsNotice}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services Needed</dt>
                  <dd className="mt-0.5 text-slate-300">{selected.services.join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax Years Affected</dt>
                  <dd className="mt-0.5 text-slate-300">{selected.taxYears}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</dt>
                  <dd className="mt-0.5 text-slate-300">{selected.budget}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</dt>
                  <dd className="mt-0.5 text-slate-300 leading-relaxed">{selected.notes}</dd>
                </div>
              </dl>
            </div>

            {/* Reply + archive */}
            <div className="border-t border-slate-800/60 px-4 py-3 space-y-2">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a response to this taxpayer…"
                className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/60 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2 text-sm font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Respond'}
                </button>
                {selected.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(selected.id, 'archived')}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
