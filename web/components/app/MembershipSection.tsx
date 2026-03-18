'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free:     'Platform access, profile management, booking infrastructure, and usage reporting.',
  starter:  'Taxpayer service pool access, network directory listing, tax tool game tokens, and transcript tokens.',
  scale:    'Featured network listing, priority taxpayer pool access, tax tool game tokens, and transcript tokens.',
  advanced: 'Early taxpayer case access, top-tier network promotion, tax tool game tokens, and transcript tokens.',
}

const UPGRADE_PLANS = [
  { key: 'starter', label: 'Starter', price: '$79/mo', billingObject: 'price_1T9APS9ROeyeXOqeOWjA4sq3', planKey: 'vlp_starter_monthly' },
  { key: 'scale',   label: 'Scale',   price: '$199/mo', billingObject: 'price_1T9AUi9ROeyeXOqeqyzsSOYV', planKey: 'vlp_scale_monthly' },
  { key: 'advanced',label: 'Advanced',price: '$399/mo', billingObject: 'price_1T9AXX9ROeyeXOqef7Ja1Iig', planKey: 'vlp_advanced_monthly' },
]

interface TokenBalance {
  taxGameTokens: number
  transcriptTokens: number
}

interface Props {
  accountId: string
  membership: string
}

export default function MembershipSection({ accountId, membership }: Props) {
  const [tokens, setTokens] = useState<TokenBalance | null>(null)
  const [loadingUpgrade, setLoadingUpgrade] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  const plan = membership?.toLowerCase() ?? 'free'

  useEffect(() => {
    if (!accountId) return
    fetch(`https://api.virtuallaunch.pro/v1/tokens/balance/${accountId}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setTokens({ taxGameTokens: data.taxGameTokens ?? 0, transcriptTokens: data.transcriptTokens ?? 0 })
      })
      .catch(() => {/* silently fail */})
  }, [accountId])

  async function handleUpgrade(billingObject: string, planKey: string) {
    setLoadingUpgrade(planKey)
    setUpgradeError(null)
    try {
      const res = await fetch('https://api.virtuallaunch.pro/v1/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ billingObject, planKey }),
      })
      const data = await res.json()
      if (data.ok && data.url) {
        window.location.href = data.url
      } else {
        setUpgradeError(data.message || 'Checkout failed. Please try again.')
      }
    } catch {
      setUpgradeError('Network error. Please try again.')
    } finally {
      setLoadingUpgrade(null)
    }
  }

  async function handlePortal() {
    setLoadingPortal(true)
    try {
      const res = await fetch('https://api.virtuallaunch.pro/v1/billing/portal/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accountId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {/* ignore */} finally {
      setLoadingPortal(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Membership</h2>

      {/* Current plan */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-white capitalize">{plan} Plan</div>
          <p className="mt-1 text-sm text-slate-400 max-w-md">{PLAN_DESCRIPTIONS[plan] ?? 'Your current membership plan.'}</p>
        </div>
        {plan !== 'free' && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={loadingPortal}
            className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition disabled:opacity-60"
          >
            {loadingPortal ? 'Loading…' : 'Manage Billing'}
          </button>
        )}
      </div>

      {/* Token balances */}
      {tokens !== null && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax Game Tokens</div>
            <div className="mt-1 text-2xl font-bold text-white">{tokens.taxGameTokens.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transcript Tokens</div>
            <div className="mt-1 text-2xl font-bold text-white">{tokens.transcriptTokens.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Upgrade cards for free members */}
      {plan === 'free' && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Upgrade your plan</p>
          {upgradeError && <p className="mb-3 text-xs text-red-400">{upgradeError}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {UPGRADE_PLANS.map((p) => (
              <div key={p.key} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
                <div className="text-sm font-bold text-white">{p.label}</div>
                <div className="mt-0.5 text-xs text-slate-500">{p.price}</div>
                <p className="mt-2 text-xs text-slate-400">{PLAN_DESCRIPTIONS[p.key]}</p>
                <button
                  type="button"
                  onClick={() => handleUpgrade(p.billingObject, p.planKey)}
                  disabled={loadingUpgrade !== null}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2 text-xs font-bold text-slate-950 hover:from-orange-400 hover:to-amber-400 transition disabled:opacity-60"
                >
                  {loadingUpgrade === p.planKey ? 'Redirecting…' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
