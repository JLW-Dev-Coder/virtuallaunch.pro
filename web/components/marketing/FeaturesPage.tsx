const coreFeatures = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 12l2 2 4-5" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    title: 'Clear steps',
    items: [
      'Clients follow a guided path instead of guessing what to do next.',
      'Your team works from the same checklist every time.',
    ],
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-3 8-10V6l-8-3-8 3v6c0 7 8 10 8 10z" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 12l2 2 4-5" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    title: 'Controlled scope',
    items: [
      'Deliverables define what is included, so one more thing does not take over.',
      'Work stays predictable even when client complexity spikes.',
    ],
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    title: 'Fewer follow-ups',
    items: [
      'Automations send updates before clients feel the need to ask.',
      'Your inbox stays clear for real issues, not status checks.',
    ],
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h10M7 12h10M7 17h6" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M5 4h14a2 2 0 0 1 2 2v12a4 4 0 0 1-4 4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    title: 'Faster onboarding',
    items: [
      'Intake, files, messages, and payments live in one calm workflow.',
      'Clients get started quickly without manual back-and-forth.',
    ],
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7l3-7z" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    title: 'White-labeled trust',
    items: [
      'Your client sees your brand and your process, not a patchwork of tools.',
      'Consistency builds confidence and makes the service feel premium.',
    ],
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#FFA500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
    title: 'Network visibility',
    items: [
      'Member profiles are promoted across the Tax Monitor public network.',
      'Contextual visibility next to tax tools and transcript activity.',
    ],
  },
]

const audiences = [
  {
    title: 'Solo service operators',
    body: 'Look established and professional without building or maintaining a complicated tech stack.',
  },
  {
    title: 'Small, growing teams',
    body: 'Stay organized, reduce internal friction, and deliver consistently as more people touch the work.',
  },
  {
    title: 'Firms ready to scale',
    body: 'Increase capacity and revenue without adding manual steps, scope creep, or process breakdowns.',
  },
]

const benefits = [
  { label: 'Save Time', body: 'Spend less time answering status questions and more time delivering real work.' },
  { label: 'Increase Revenue', body: 'Defined deliverables and follow-ups help convert more clients with less friction.' },
  { label: 'Stay Organized', body: 'Keep intake, files, messages, and payments in one calm, structured system.' },
  { label: 'Grow Affordably', body: 'Install once, then add modules only when your business is ready to expand.' },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-10 pt-16 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2">
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-slate-300">Built for calm, repeatable service delivery.</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Platform{' '}
            <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Features
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-slate-400 md:text-2xl">
            Service delivery breaks down when clients cannot see what happens next and your team has to answer the same questions repeatedly. Virtual Launch Pro fixes that with visible steps, defined deliverables, and automations that reduce noise.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="/pricing" className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-400 hover:to-amber-500 hover:scale-105">
              View packages →
            </a>
            <a href="/how-it-works" className="inline-block rounded-lg border border-slate-700 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800/80">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Core features grid */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">WHY VIRTUAL LAUNCH PRO WORKS</p>
            <h2 className="mt-3 text-4xl font-extrabold md:text-5xl">Predictable delivery, built for calm</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 md:text-lg">
              Install once, then stack add-ons only when you are ready. You stay in control of scope, timelines, and client expectations without rebuilding your process every season.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  {f.icon}
                </div>
                <h3 className="text-lg font-extrabold mb-4">{f.title}</h3>
                <ul className="space-y-3 text-sm text-white/70">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-14 md:py-16">
          <div className="rounded-2xl bg-orange-500 px-6 py-10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:px-10 md:py-14">
            <div className="grid gap-10 text-center md:grid-cols-4 md:gap-8">
              {benefits.map((b) => (
                <div key={b.label}>
                  <div className="text-lg font-extrabold text-white">{b.label}</div>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-white/90">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-white/10 bg-[#070a10]">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400">WHO VIRTUAL LAUNCH PRO IS FOR</p>
            <h2 className="mt-4 text-4xl font-extrabold text-white md:text-5xl">Built for calm, scalable service delivery</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
              Virtual Launch Pro supports service businesses at every stage, whether you are solo, managing a small team, or preparing to scale without added chaos.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm">
                <h3 className="text-lg font-extrabold text-white mb-3">{a.title}</h3>
                <p className="text-sm text-white/70">{a.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <a href="/pricing" className="rounded-xl bg-orange-500 px-8 py-4 text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">
              Choose a package
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0f172a] via-[#1c1917] to-[#7c2d12] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start delivering calmly?</h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Pick the membership that fits your stage and start using the tools and network features designed to support cleaner client operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/pricing" className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl">
              See Pricing
            </a>
            <a href="/contact" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-10 py-4 rounded-xl text-lg border border-orange-400/20 transition-all">
              Contact Us
            </a>
          </div>
          <p className="text-white/60 text-sm mt-8">Become a member • Deliver calmly • Repeat</p>
        </div>
      </section>
    </div>
  )
}
