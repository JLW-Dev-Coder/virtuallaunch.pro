'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PlanData {
  price: string
  transcriptTokens: string
  taxGameTokens: string
  planKey: string
  platformFee: string
  billingObject: string
  checkoutHref: string
}

const DEFAULTS: Record<string, PlanData> = {
  free:     { price: '0',   transcriptTokens: '0',   taxGameTokens: '0',   planKey: 'vlp_free',            platformFee: '0',  billingObject: 'price_1TBjsM9ROeyeXOqeAPefMFfM', checkoutHref: '/sign-in' },
  starter:  { price: '79',  transcriptTokens: '30',  taxGameTokens: '30',  planKey: 'vlp_starter_monthly', platformFee: '12', billingObject: 'price_1T9APS9ROeyeXOqeOWjA4sq3', checkoutHref: '/sign-in' },
  pro:      { price: '199', transcriptTokens: '100', taxGameTokens: '120', planKey: 'vlp_pro_monthly',     platformFee: '12', billingObject: 'price_1T9AUi9ROeyeXOqeqyzsSOYV', checkoutHref: '/sign-in' },
  advanced: { price: '399', transcriptTokens: '250', taxGameTokens: '300', planKey: 'vlp_advanced_monthly',platformFee: '12', billingObject: 'price_1T9AXX9ROeyeXOqef7Ja1Iig', checkoutHref: '/sign-in' },
}

const PLAN_ORDER = ['free', 'starter', 'pro', 'advanced'] as const
type PlanKey = typeof PLAN_ORDER[number]

const planMeta: Record<PlanKey, { label: string; badge: string; featured: boolean; body: string }> = {
  free:     { label: 'Free',     badge: 'Start here',        featured: false, body: 'Entry access for getting inside the platform before moving into recurring paid capacity.' },
  starter:  { label: 'Starter',  badge: 'Best for testing',  featured: false, body: 'Entry network membership for firms beginning with recurring monitoring and lighter monthly usage.' },
  pro:      { label: 'Pro',      badge: 'Most popular',      featured: true,  body: 'For active firms serving multiple taxpayers each month and needing stronger network visibility.' },
  advanced: { label: 'Advanced', badge: 'For higher volume', featured: false, body: 'For firms with heavier taxpayer volume, higher transcript demand, and broader staff usage.' },
}

function readFirst(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = source[key]
    if (v != null && v !== '') return String(v)
  }
  return ''
}

function normalizePlanKey(value: unknown): string {
  return String(value || '').trim().toLowerCase()
    .replace(/^vlp_/, '').replace(/[^a-z0-9]+/g, '_').replace(/_(monthly|yearly)$/, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeRemote(payload: any, plans: Record<string, PlanData>): Record<string, PlanData> {
  const next = JSON.parse(JSON.stringify(plans)) as Record<string, PlanData>
  let buckets: Record<string, unknown>[] = []
  if (Array.isArray(payload)) buckets = payload
  else if (Array.isArray(payload?.plans)) buckets = payload.plans
  else if (payload?.plans && typeof payload.plans === 'object')
    Object.keys(payload.plans).forEach((k) => buckets.push({ plan: k, ...(payload.plans[k] as object) }))
  for (const entry of buckets) {
    const plan = normalizePlanKey(readFirst(entry as Record<string, unknown>, ['plan', 'planKey', 'slug', 'name']))
    if (!plan || !next[plan]) continue
    const src = (entry.monthly && typeof entry.monthly === 'object' ? entry.monthly : entry) as Record<string, unknown>
    next[plan] = {
      price:            readFirst(src, ['price', 'cost', 'priceAmount'])                                    || next[plan].price,
      transcriptTokens: readFirst(src, ['transcriptTokens', 'transcript_tokens_monthly'])                   || next[plan].transcriptTokens,
      taxGameTokens:    readFirst(src, ['taxGameTokens', 'tax_tool_tokens_monthly', 'tax_tool_game_tokens']) || next[plan].taxGameTokens,
      planKey:          readFirst(src, ['planKey', 'plan_key', 'slug'])                                      || next[plan].planKey,
      platformFee:      readFirst(src, ['platformFee', 'platform_fee_percent'])                              || next[plan].platformFee,
      billingObject:    readFirst(src, ['billingObject', 'priceId', 'price_id'])                             || next[plan].billingObject,
      checkoutHref:     readFirst(src, ['checkoutHref', 'checkoutUrl', 'href'])                              || next[plan].checkoutHref,
    }
  }
  return next
}

export default function HomePricingSection() {
  const [plans, setPlans] = useState(DEFAULTS)

  useEffect(() => {
    fetch('https://api.virtuallaunch.pro/v1/pricing', { headers: { Accept: 'application/json' } })
      .then((r) => r.ok ? r.json() : null)
      .then((payload) => { if (payload) setPlans((prev) => mergeRemote(payload, prev)) })
      .catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
      <div className="mx-auto max-w-3xl text-center mb-12">
        <p className="text-xs font-semibold tracking-widest text-orange-400">PACKAGES</p>
        <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">Pick the membership that fits your stage</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
          Choose a membership based on transcript capacity, tax tool access, and lead access inside the network.
          When a taxpayer converts through the platform, a 12% professional platform fee applies.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-4">
        {PLAN_ORDER.map((key) => {
          const meta = planMeta[key]
          const data = plans[key]
          return (
            <article key={key} className={`rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${meta.featured ? 'border-2 border-orange-500/70 bg-gradient-to-b from-white/8 to-white/5' : 'border border-white/10 bg-white/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-extrabold">{meta.label}</div>
                <span className={`rounded-full px-3 py-1 text-xs ${meta.featured ? 'border border-orange-500/40 bg-orange-500/10 text-white/90' : 'border border-white/10 bg-white/5 text-white/80'}`}>{meta.badge}</span>
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold">${data.price}</div>
                <div className="mt-2 text-sm text-white/70">/mo</div>
              </div>
              <p className="mt-5 text-sm text-white/70">{meta.body}</p>
              <ul className="mt-6 space-y-3 text-sm text-white/75">
                <li className="flex items-start gap-3"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" /><span>{data.transcriptTokens} transcript tokens</span></li>
                <li className="flex items-start gap-3"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" /><span>{data.taxGameTokens} tax tool game tokens</span></li>
                <li className="flex items-start gap-3"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" /><span>Platform fee: {data.platformFee}%</span></li>
              </ul>
              <div className="mt-8 flex gap-3">
                <a href={data.checkoutHref} data-billing-object={data.billingObject} data-plan-key={data.planKey} className="flex-1 rounded-xl bg-orange-500 px-5 py-3 text-center text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">Get started</a>
                <Link href="/pricing" className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-center text-sm font-extrabold text-white hover:bg-white/10 transition-colors">Details</Link>
              </div>
            </article>
          )
        })}
      </div>
      <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <div className="font-semibold text-white">About our taxpayer service pool</div>
        <div className="mt-2">Clients introduced through the platform must approve direct contact before any upsell. When the engagement ends, the client returns to the shared pool.</div>
      </div>
      <div className="mt-8 flex justify-center">
        <Link href="/pricing" className="text-sm text-amber-400 underline underline-offset-2 hover:text-amber-300">View full pricing with yearly billing →</Link>
      </div>
    </div>
  )
}
