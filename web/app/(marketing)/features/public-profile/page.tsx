import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tax Pro Public Profile | Virtual Launch Pro',
  description:
    'Preview the professional profile experience on Tax Monitor Pro — a clean, credible public-facing page that positions your expertise and converts visitor interest into bookings.',
}

const profileFeatures = [
  {
    title: 'Professional credentials',
    body: 'Display your designation, specializations, and years of experience in a format taxpayers can actually understand.',
  },
  {
    title: 'Structured service listing',
    body: 'Show your services as defined packages with clear scope, not a vague list of things you do.',
  },
  {
    title: 'Integrated booking',
    body: 'Cal.com booking renders directly on the profile so prospects can schedule without leaving the page.',
  },
  {
    title: 'Network visibility',
    body: 'Your profile is promoted inside the Tax Monitor discovery network where taxpayer intent already exists.',
  },
  {
    title: 'Credibility signals',
    body: 'Membership tier, active status, and verified professional standing are displayed automatically.',
  },
  {
    title: 'Clean brand presentation',
    body: "The profile presents your expertise under your identity — not under a generic marketplace template that looks like everyone else's.",
  },
]

const profileSections = [
  { label: 'Header', desc: 'Name, designation, location, and active membership indicator.' },
  { label: 'About', desc: 'Short professional bio and focus areas.' },
  { label: 'Services', desc: 'Structured service packages with defined scope and pricing.' },
  { label: 'Booking', desc: 'Cal.com embed for direct consultation scheduling.' },
  { label: 'Credentials', desc: 'Licenses, certifications, and years in practice.' },
  { label: 'Contact', desc: 'Secure contact path that flows into the VLP onboarding system.' },
]

export default function PublicProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-12 pt-16 md:pb-16 md:pt-24">
        <p className="mx-auto mb-5 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/80">
          Membership feature for tax professionals
        </p>
        <h1 className="mx-auto max-w-5xl text-center text-4xl font-extrabold leading-tight md:text-6xl">
          A public profile that actually{' '}
          <span className="text-orange-400">converts</span>
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-center text-base text-white/70 md:text-lg">
          Your Tax Monitor Pro profile is the public-facing page that positions your expertise, displays your services, and moves interested taxpayers toward a booking — without the usual patchwork of tools.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/pricing" className="rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">
            Become a member
          </Link>
          <Link href="/features" className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-extrabold text-white hover:bg-white/10 transition-colors">
            All features
          </Link>
        </div>
      </section>

      {/* Profile anatomy */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">PROFILE ANATOMY</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">What the profile includes</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
              Every section of the profile is designed to move the visitor from discovery to action without requiring the professional to manually manage the presentation.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profileSections.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <div className="text-xs font-semibold tracking-widest text-orange-400 mb-2">{s.label.toUpperCase()}</div>
                <p className="text-sm text-white/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-t border-white/10 bg-[#070a10]">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">WHY IT MATTERS</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">A profile that works while you work</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profileFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <h3 className="text-lg font-extrabold mb-3">{f.title}</h3>
                <p className="text-sm text-white/70">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Network context */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-orange-400 mb-4">NETWORK CONTEXT</p>
              <h2 className="text-3xl font-extrabold mb-5">Positioned where taxpayer intent already exists</h2>
              <p className="text-white/70 text-base leading-relaxed mb-6">
                Your profile does not live in isolation. It appears inside the Tax Monitor Pro discovery network, where taxpayers are already searching for help with IRS notices, transcript questions, compliance issues, and tax resolution.
              </p>
              <p className="text-white/70 text-base leading-relaxed mb-8">
                That context matters. A profile inside an active discovery network converts differently than a standalone website that nobody finds.
              </p>
              <Link href="/how-it-works" className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors">
                See how the ecosystem works →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <div className="text-xs font-semibold tracking-widest text-orange-400 mb-4">DISCOVERY FLOW</div>
              <div className="space-y-4">
                {[
                  { step: '1', label: 'Taxpayer searches for help', sub: 'Tax Tools or transcript activity surfaces the need' },
                  { step: '2', label: 'Tax Monitor shows professionals', sub: 'Your profile appears in the relevant discovery context' },
                  { step: '3', label: 'Visitor reads your profile', sub: 'Services, credentials, and booking are immediately visible' },
                  { step: '4', label: 'Prospect books a consultation', sub: 'Cal.com booking closes the loop without friction' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-slate-950">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-xs text-white/50">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0f172a] via-[#1c1917] to-[#7c2d12] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Get your profile inside the network</h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            A membership gives you access to the profile system, booking integration, and discovery network in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl">
              See Pricing
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-10 py-4 rounded-xl text-lg border border-orange-400/20 transition-all">
              Contact Us
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-8">Become a member • Deliver calmly • Repeat</p>
        </div>
      </section>
    </div>
  )
}
