import type { Metadata } from 'next'
import Card from '@/components/ui/Card'
import { getSupportTicketsByAccount } from '@/lib/api/client'
import { getSession } from '@/lib/auth/session'
import type { SupportTicket } from '@/lib/api/types'

export const metadata: Metadata = { title: 'Support' }

const PRIORITY_STYLES: Record<SupportTicket['priority'], string> = {
  urgent: 'bg-red-900/60 text-red-300',
  high: 'bg-orange-900/60 text-orange-300',
  normal: 'bg-slate-800 text-slate-400',
  low: 'bg-slate-800/60 text-slate-500',
}

const STATUS_STYLES: Record<SupportTicket['status'], string> = {
  open: 'bg-amber-900/60 text-amber-300',
  in_progress: 'bg-blue-900/60 text-blue-300',
  reopened: 'bg-orange-900/60 text-orange-300',
  resolved: 'bg-emerald-900/60 text-emerald-300',
  closed: 'bg-slate-800 text-slate-500',
}

const OPEN_STATUSES: SupportTicket['status'][] = ['open', 'in_progress', 'reopened']

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white">{ticket.subject}</div>
          <div className="mt-1 text-xs text-slate-500">
            #{ticket.ticketId} · {new Date(ticket.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PRIORITY_STYLES[ticket.priority]}`}>
            {ticket.priority}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400 line-clamp-2">{ticket.message}</p>
    </div>
  )
}

export default async function SupportPage() {
  const session = await getSession()
  const tickets = await getSupportTicketsByAccount(session.account_id)

  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status))
  const closed = tickets.filter((t) => !OPEN_STATUSES.includes(t.status))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Support</h1>
          <p className="mt-1 text-sm text-slate-400">Track and manage your support requests.</p>
        </div>
        <button
          disabled
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 opacity-60 cursor-not-allowed"
          title="Coming soon"
        >
          New Ticket
        </button>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No open tickets. All clear!</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {open.map((t) => (
              <TicketRow key={t.ticketId} ticket={t} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Closed ({closed.length})
        </h2>
        {closed.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No closed tickets.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {closed.map((t) => (
              <TicketRow key={t.ticketId} ticket={t} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
