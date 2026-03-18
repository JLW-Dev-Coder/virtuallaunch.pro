import type { Metadata } from 'next'
import HomePricingSection from '@/components/marketing/HomePricingSection'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Virtual Launch Pro — Calm, Repeatable Client Acquisition for Tax Professionals',
  description: 'Virtual Launch Pro gives tax professionals a repeatable client acquisition system — structured packages, network visibility, and cleaner delivery without the operational chaos.',
}

const whyItems = [
  { title: 'Clear steps', body: 'Clients follow a guided path instead of guessing what to do next. Your team works from the same checklist every time.' },
  { title: 'Controlled scope', body: 'Deliverables define what is included so one more thing does not take over. Work stays predictable even when client complexity spikes.' },
  { title: 'Fewer follow-ups', body: 'Automations send updates before clients feel the need to ask. Your inbox stays clear for real issues, not status checks.' },
  { title: 'Faster onboarding', body: 'Intake, files, messages, and payments live in one calm workflow. Clients get started quickly without manual back-and-forth.' },
  { title: 'White-labeled trust', body: 'Your client sees your brand and your process, not a patchwork of tools. Consistency builds confidence and makes the service feel premium.' },
  { title: 'Network visibility', body: 'Member profiles are promoted across the Tax Monitor public network. Contextual visibility next to tax tools and transcript activity.' },
]

const offers = [
  { tier: 'STARTER', title: 'Clean links, calm handoff', featured: false, body: 'Built for solo operators or new service offers that need a credible intake-to-delivery path fast.', items: ['Form intake creates the work automatically.', 'Profile listed in the network directory.', 'Read-only status view reduces check-in messages.'] },
  { tier: 'PRO', title: 'Lifecycle protected delivery', featured: true, body: 'Best for teams or active client work where tasks, assets, and checkpoints need to land in the right place every time.', items: ['Task templates and checklists match your real phases.', 'Upload links mark assets received and move work forward.', 'Workflow rules lock the lifecycle so work does not drift.'] },
  { tier: 'ADVANCED', title: 'Multi-offer system control', featured: false, body: 'For growing teams that need routing, role logic, and client-facing status at scale.', items: ['Intake answers route work into the correct pipeline.', 'Coordinator and assignee logic keeps ownership clear.', 'Client-ready progress pages make delivery feel premium.'] },
]

const audiences = [
  { title: 'Solo service operators', body: 'Look established and professional without building or maintaining a complicated tech stack.' },
  { title: 'Small, growing teams', body: 'Stay organized, reduce internal friction, and deliver consistently as more people touch the work.' },
  { title: 'Firms ready to scale', body: 'Increase capacity and revenue without adding manual steps, scope creep, or process breakdowns.' },
]

const faqs = [
  { q: 'Is it hard to set up?', a: 'No. Each install is scoped and configured cleanly. You get a structured handoff so you can operate immediately.' },
  { q: 'Do clients need to log in?', a: 'No. Clients use simple links for intake, payment, uploads, and status. Your delivery system stays internal and stable.' },
  { q: 'What makes Virtual Launch Pro different?', a: 'It is built around deliverables, workflow visibility, and scope protection instead of making you collect more disconnected tools.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="mx-auto max-w-[77.5rem] px-4 pb-10 pt-16 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2">
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span className="text-sm text-slate-300">Choose your plan level. Upgrade anytime.</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Become a member for{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">calm delivery.</span>
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-slate-400 md:text-2xl">
            Start with the package that fits your stage, then build a cleaner client journey with onboarding, routing, and delivery systems that stay organized as you grow.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#pricing" className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:from-amber-400 hover:to-amber-500">View packages →</a>
            <a href="#offers" className="inline-block rounded-lg border border-slate-700 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800/80">Explore offers</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[77.5rem] px-4 pb-14 md:pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { tier: 'FREE', title: 'Get inside the network', body: 'Best for getting started and joining the ecosystem before stepping into recurring paid usage.' },
              { tier: 'STARTER', title: 'Fast, clean setup', body: 'Great for solo operators who need intake, status, and payment links working without a maze of tools.' },
              { tier: 'PRO', title: 'Protected delivery flow', body: 'Best for active service businesses that need templates, uploads, routing, and lifecycle enforcement.', highlight: true },
              { tier: 'ADVANCED', title: 'Built for team volume', body: 'Adds deeper automation, multi-offer routing, and client-ready status surfaces for growing teams.' },
            ].map((p) => (
              <div key={p.tier} className={`rounded-2xl p-6 ${'highlight' in p && p.highlight ? 'border border-orange-500/40 bg-orange-500/10' : 'border border-white/10 bg-[#070a10]/60'}`}>
                <div className="text-xs font-semibold tracking-widest text-orange-400">{p.tier}</div>
                <div className="mt-3 text-xl font-extrabold">{p.title}</div>
                <p className="mt-3 text-sm text-white/70">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">WHY VIRTUAL LAUNCH PRO WORKS</p>
            <h2 className="mt-3 text-4xl font-extrabold md:text-5xl">Predictable delivery, built for calm</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 md:text-lg">Service delivery breaks down when clients cannot see what happens next and your team has to answer the same questions repeatedly. Virtual Launch Pro fixes that with visible steps, defined deliverables, and automations that reduce noise.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <h3 className="text-lg font-extrabold mb-3">{item.title}</h3>
                <p className="text-sm text-white/70">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/features" className="rounded-xl bg-orange-500 px-8 py-4 text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">See all features</Link>
          </div>
        </div>
      </section>

      <section id="offers" className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">OFFERS</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">Three installs built for different stages</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">Start with the install that matches your delivery maturity, then add deeper automation when the workload justifies it.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {offers.map((o) => (
              <article key={o.tier} className={`rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${o.featured ? 'border-2 border-orange-500/70 bg-gradient-to-b from-white/8 to-white/5' : 'border border-white/10 bg-white/5'}`}>
                <div className="text-sm font-semibold tracking-widest text-orange-400">{o.tier}</div>
                <h3 className="mt-3 text-2xl font-extrabold">{o.title}</h3>
                <p className="mt-4 text-sm text-white/70">{o.body}</p>
                <ul className="mt-6 space-y-3 text-sm text-white/75">
                  {o.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10">
        <HomePricingSection />
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-14 md:py-16">
          <div className="rounded-2xl bg-orange-500 px-6 py-10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:px-10 md:py-14">
            <div className="grid gap-10 text-center md:grid-cols-4 md:gap-8">
              {[
                { label: 'Save Time', body: 'Spend less time answering status questions and more time delivering real work.' },
                { label: 'Increase Revenue', body: 'Defined deliverables and follow-ups help convert more clients with less friction.' },
                { label: 'Stay Organized', body: 'Keep intake, files, messages, and payments in one calm, structured system.' },
                { label: 'Grow Affordably', body: 'Install once, then add modules only when your business is ready to expand.' },
              ].map((b) => (
                <div key={b.label}>
                  <div className="text-lg font-extrabold text-white">{b.label}</div>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-white/90">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#070a10]">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400">WHO VIRTUAL LAUNCH PRO IS FOR</p>
            <h2 className="mt-4 text-4xl font-extrabold text-white md:text-5xl">Built for calm, scalable service delivery</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">Virtual Launch Pro supports service businesses at every stage, whether you are solo, managing a small team, or preparing to scale without added chaos.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-8 backdrop-blur-sm">
                <h3 className="text-lg font-extrabold text-white mb-3">{a.title}</h3>
                <p className="text-sm text-white/70">{a.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex justify-center">
            <a href="#pricing" className="rounded-xl bg-orange-500 px-8 py-4 text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">Choose a package</a>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-14 md:py-16">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-3xl font-extrabold md:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/5 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-left font-semibold">
                  {f.q}<span className="ml-4 text-white/60 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-white/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0f172a] via-[#1c1917] to-[#7c2d12] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to launch calmly?</h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">Pick the membership that fits your practice and start building a cleaner client journey today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing" className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl">Become a member</a>
            <Link href="/contact" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-10 py-4 rounded-xl text-lg border border-orange-400/20 transition-all">Contact Us</Link>
          </div>
          <p className="text-white/60 text-sm mt-8">Become a member • Deliver calmly • Repeat</p>
        </div>
      </section>
    </div>
  )
}
