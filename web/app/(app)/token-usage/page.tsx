import type { Metadata } from 'next'
import Card from '@/components/ui/Card'
import { getTokenBalance, getTokenUsage } from '@/lib/api/client'
import { getSession } from '@/lib/auth/session'
import type { TokenUsageEntry } from '@/lib/api/types'

export const metadata: Metadata = { title: 'Token Usage' }

const TOKEN_TYPE_LABELS: Record<TokenUsageEntry['tokenType'], string> = {
  transcript: 'Transcript',
  tax_game: 'Tax Game',
}

export default async function TokenUsagePage() {
  const session = await getSession()
  const [balance, usage] = await Promise.all([
    getTokenBalance(session.account_id),
    getTokenUsage(session.account_id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Token Usage</h1>
        <p className="mt-1 text-sm text-slate-400">Monitor your AI token balances and consumption history.</p>
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Transcript Tokens
          </div>
          <div className="mt-2 text-3xl font-bold text-white">
            {balance.transcriptTokens.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">available</div>
        </Card>

        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tax Game Tokens
          </div>
          <div className="mt-2 text-3xl font-bold text-white">
            {balance.taxGameTokens.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">available</div>
        </Card>
      </div>

      {/* Usage history */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Usage History
        </h2>
        {usage.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No usage recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {usage.map((entry) => (
              <div key={entry.eventId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm text-white">{entry.action.replace(/_/g, ' ')}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {TOKEN_TYPE_LABELS[entry.tokenType]} ·{' '}
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-amber-400">
                  -{entry.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-right text-xs text-slate-600">
          Last updated: {new Date(balance.updatedAt).toLocaleDateString()}
        </div>
      </Card>
    </div>
  )
}
