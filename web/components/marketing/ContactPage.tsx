'use client'

import { useState, useEffect, useRef } from 'react'

const API_BASE = 'https://api.virtuallaunch.pro'
const SUPPORT_POST = `${API_BASE}/v1/support/tickets`
const SUPPORT_STATUS_GET = `${API_BASE}/v1/support/tickets/`

const CAL_LINK = 'tax-monitor-pro/virtual-launch-pro-support'
const CAL_NS   = 'virtual-launch-pro-support'

const contactOptions = [
  {
    title: 'General Questions',
    body: 'Ask about memberships, profiles, onboarding, or how Virtual Launch Pro fits your business.',
    icon: (
      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Book a call',
    body: 'Schedule time for a support conversation if you want to talk through setup, billing, or platform questions live.',
    icon: (
      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Onboarding Help',
    body: 'Use this if you are joining, setting up your profile, or getting your first platform steps sorted out.',
    icon: (
      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Client support',
    body: 'For changes, transitions, account updates, or support needs that affect an active plan or member state.',
    icon: (
      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const processSteps = [
  { n: 1, title: 'You Reach Out', body: 'Book support or submit a ticket.' },
  { n: 2, title: 'We Review', body: 'We review your inquiry and route it to the right internal support path.' },
  { n: 3, title: 'We Respond', body: 'Expect a response by email with next steps or confirmation.' },
  { n: 4, title: 'Track Progress', body: 'Use your Support ID to check ticket status when needed.' },
]

function newEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

type StatusKind = 'info' | 'error' | 'success'

interface StatusMsg {
  kind: StatusKind
  text: string
}

export default function ContactPage() {
  const calLoaded = useRef(false)

  // Lookup state
  const [lookupId, setLookupId] = useState('')
  const [lookupStatus, setLookupStatus] = useState<StatusMsg | null>(null)
  const [lookupBusy, setLookupBusy] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', category: '', issueType: '', priority: '', urgency: '',
    subject: '', message: '', memberId: '', relatedOrderId: '',
  })
  const [formStatus, setFormStatus] = useState<StatusMsg | null>(null)
  const [formBusy, setFormBusy] = useState(false)
  const [supportId, setSupportId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [eventId] = useState(() => newEventId())

  // Load Cal.com embed script once
  useEffect(() => {
    if (calLoaded.current) return
    calLoaded.current = true
    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Cal = (window as any).Cal
      if (!Cal) return
      Cal('init', CAL_NS, { origin: 'https://app.cal.com' })
      Cal.ns[CAL_NS]('ui', {
        cssVarsPerTheme: { dark: { 'cal-brand': '#f97316' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      })
    }
    document.head.appendChild(script)
  }, [])

  function openCal() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Cal = (window as any).Cal
    if (Cal?.ns?.[CAL_NS]) {
      Cal.ns[CAL_NS]('ui', { layout: 'month_view' })
    }
  }

  async function handleLookup() {
    const id = lookupId.trim()
    if (!id) { setLookupStatus({ kind: 'error', text: 'Enter a Support ID to check status.' }); return }
    setLookupBusy(true)
    setLookupStatus({ kind: 'info', text: 'Checking status…' })
    try {
      const res = await fetch(`${SUPPORT_STATUS_GET}${encodeURIComponent(id)}`, { credentials: 'omit' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setLookupStatus({ kind: 'error', text: json?.error || json?.message || `Request failed (${res.status})` })
      } else {
        const msg = json?.message || json?.statusLabel || json?.status || 'Ticket is in progress.'
        setLookupStatus({ kind: 'success', text: msg })
      }
    } catch {
      setLookupStatus({ kind: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLookupBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const required = ['name', 'email', 'category', 'issueType', 'priority', 'urgency', 'subject', 'message'] as const
    const missing = required.filter((k) => !form[k])
    if (missing.length) { setFormStatus({ kind: 'error', text: 'Please fill in all required fields.' }); return }

    setFormBusy(true)
    setFormStatus({ kind: 'info', text: 'Submitting your ticket…' })

    const payload: Record<string, string> = { ...form, eventId }
    if (!payload.memberId) delete payload.memberId
    if (!payload.relatedOrderId) delete payload.relatedOrderId

    try {
      const res = await fetch(SUPPORT_POST, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setFormStatus({ kind: 'error', text: json?.error || json?.message || `Request failed (${res.status})` })
      } else {
        const sid = json?.supportId || json?.support_id || json?.ticketId || json?.ticket_id || ''
        if (sid) { setSupportId(sid); setLookupId(sid) }
        setSubmitted(true)
        setFormStatus(null)
      }
    } catch {
      setFormStatus({ kind: 'error', text: 'Network error. Please try again.' })
    } finally {
      setFormBusy(false)
    }
  }

  const statusClass = (kind: StatusKind) =>
    kind === 'error'   ? 'border-red-500/35 bg-red-500/10 text-red-200' :
    kind === 'success' ? 'border-emerald-400/28 bg-emerald-500/10 text-emerald-200' :
                         'border-amber-500/24 bg-amber-500/10 text-amber-100'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-10 pt-16 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-8">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-slate-300">Virtual Launch Pro support for memberships, profiles, and platform questions.</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">Let&apos;s Connect</h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Choose your path for help with memberships, directory profiles, partnerships, onboarding, billing, or platform questions.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-8">
            <a href="#contact-options" className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:from-amber-400 hover:to-amber-500">
              Book a call
            </a>
            <a href="#support-ticket" className="inline-block rounded-lg border border-slate-700 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800/80">
              Create a ticket
            </a>
          </div>

          <p className="text-sm text-slate-500 max-w-2xl mx-auto">No passwords. No taxpayer SSNs. No sensitive client documents in the message box unless we explicitly request them.</p>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Contact options */}
      <section className="w-full px-6 py-20 md:py-28" id="contact-options">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Can Help</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Choose a path below. We will route you to the right event type.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactOptions.map((opt) => (
              <button
                key={opt.title}
                type="button"
                onClick={openCal}
                data-cal-link={CAL_LINK}
                data-cal-namespace={CAL_NS}
                data-cal-config='{"layout":"month_view"}'
                className="text-left flex items-start gap-4 p-6 rounded-2xl bg-slate-900/40 border border-white/5 transition-all duration-200 hover:border-amber-500/35 hover:-translate-y-1"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-[#070a10]/60 flex items-center justify-center border border-white/10">
                  {opt.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold mb-1">{opt.title}</div>
                  <div className="text-slate-400 text-sm">{opt.body}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Support lookup + ticket form */}
      <section className="w-full px-6 py-20 md:py-28" id="support-ticket">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Lookup */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-all duration-200 hover:border-amber-500/35">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-slate-300">Support lookup</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Support lookup</h2>
            <p className="text-slate-400 mb-6">Already have a Support ID? Check your VLP support status here.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Support ID"
                autoComplete="off"
                className="flex-1 rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 placeholder-slate-400/90 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupBusy}
                className="rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-800/80 disabled:opacity-60 whitespace-nowrap"
              >
                Check status
              </button>
            </div>
            {lookupStatus && (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClass(lookupStatus.kind)}`} role="status">
                {lookupStatus.text}
              </div>
            )}
          </div>

          {/* Ticket form */}
          <div>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-200">Create a ticket</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Tell us what you need help with</h2>
              <p className="text-slate-400 text-lg">We&apos;ll reply by email and include a Support ID for tracking.</p>
            </div>

            {submitted ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                {supportId && (
                  <div className="mb-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
                    <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wide mb-2">Your Support ID</p>
                    <div className="text-3xl font-bold text-white font-mono mb-3">{supportId}</div>
                    <p className="text-sm text-slate-300">We&apos;ve emailed confirmation. Keep this ID for VLP support status checks.</p>
                  </div>
                )}
                <p className="text-slate-300">Ticket submitted. Check your email for your Support ID and next steps.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-2xl bg-white/5 border border-white/10 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] space-y-5"
              >
                {/* Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { id: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
                    { id: 'email', label: 'Email', type: 'email', placeholder: 'you@email.com' },
                  ].map((f) => (
                    <div key={f.id}>
                      <label htmlFor={f.id} className="block mb-2 text-sm font-semibold text-slate-200">{f.label} *</label>
                      <input
                        id={f.id}
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.id as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [f.id]: e.target.value }))}
                        required
                        className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 placeholder-slate-400/90 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12"
                      />
                    </div>
                  ))}
                </div>

                {/* Category + Issue Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="category" className="block mb-2 text-sm font-semibold text-slate-200">Category *</label>
                    <select id="category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12 appearance-none">
                      <option value="" disabled hidden />
                      {['Billing / Payments', 'Directory Profile', 'General', 'Membership / Plans', 'Onboarding', 'Partnerships', 'Platform / Access'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="issueType" className="block mb-2 text-sm font-semibold text-slate-200">Issue Type *</label>
                    <select id="issueType" value={form.issueType} onChange={(e) => setForm((p) => ({ ...p, issueType: e.target.value }))} required className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12 appearance-none">
                      <option value="" disabled hidden />
                      {['Access', 'Billing', 'General Question', 'Profile Update', 'Technical', 'Upgrade / Downgrade'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Priority + Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="priority" className="block mb-2 text-sm font-semibold text-slate-200">Priority *</label>
                    <select id="priority" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} required className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12 appearance-none">
                      <option value="" disabled hidden />
                      {['Critical', 'High', 'Normal', 'Low'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="urgency" className="block mb-2 text-sm font-semibold text-slate-200">Urgency *</label>
                    <select id="urgency" value={form.urgency} onChange={(e) => setForm((p) => ({ ...p, urgency: e.target.value }))} required className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12 appearance-none">
                      <option value="" disabled hidden />
                      {['Normal', 'Time-sensitive (deadline)', 'Urgent (service blocked)'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block mb-2 text-sm font-semibold text-slate-200">Subject *</label>
                  <input id="subject" type="text" placeholder="e.g., Need help updating my directory profile" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 placeholder-slate-400/90 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12" />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block mb-2 text-sm font-semibold text-slate-200">Message *</label>
                  <textarea id="message" rows={5} placeholder="Tell us what happened, what you need, and any relevant page, plan, or issue details" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 placeholder-slate-400/90 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12 resize-y" />
                  <p className="mt-2 text-xs text-slate-400">Include the page or plan involved and any exact error text. Do not include sensitive personal or taxpayer data.</p>
                </div>

                {/* Optional IDs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="memberId" className="block mb-2 text-sm font-semibold text-slate-200">Member ID</label>
                    <input id="memberId" type="text" placeholder="Optional" value={form.memberId} onChange={(e) => setForm((p) => ({ ...p, memberId: e.target.value }))} className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 placeholder-slate-400/90 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12" />
                  </div>
                  <div>
                    <label htmlFor="relatedOrderId" className="block mb-2 text-sm font-semibold text-slate-200">Related ID</label>
                    <input id="relatedOrderId" type="text" placeholder="Optional (Stripe ID, invoice ID, etc.)" value={form.relatedOrderId} onChange={(e) => setForm((p) => ({ ...p, relatedOrderId: e.target.value }))} className="w-full rounded-2xl border border-white/8 bg-[#0f172a]/72 text-slate-100 placeholder-slate-400/90 px-4 py-4 outline-none transition focus:border-amber-500/55 focus:ring-2 focus:ring-amber-500/12" />
                  </div>
                </div>

                <div>
                  <button type="submit" disabled={formBusy} className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                    Submit ticket
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-4">
                    By submitting, you agree to our{' '}
                    <a href="/legal/terms" className="text-amber-300 hover:underline">Terms</a>{' '}
                    and{' '}
                    <a href="/legal/privacy" className="text-amber-300 hover:underline">Privacy Policy</a>.
                  </p>
                </div>

                {formStatus && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${statusClass(formStatus.kind)}`} role="status">
                    {formStatus.text}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* What happens next */}
      <section className="w-full px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Happens Next</h2>
            <p className="text-slate-400 text-lg">A clear, simple process from first contact to next steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg font-bold text-slate-950">
                  {s.n}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-6 py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Connect?</h2>
          <p className="text-slate-400 text-lg mb-10">Pick a path above and we will take it from there.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="#contact-options" className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:from-amber-400 hover:to-amber-500">
              Book a call
            </a>
            <a href="#support-ticket" className="inline-block rounded-lg border border-slate-700 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800/80">
              Create a ticket
            </a>
          </div>
          <p className="text-sm text-slate-500">Your inquiry is confidential. We will respond thoughtfully and without obligation.</p>
        </div>
      </section>
    </div>
  )
}
