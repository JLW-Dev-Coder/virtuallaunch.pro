const offers = [
  {
    title: 'Member activation',
    body: 'Professionals join through a membership tier that gives them access to the platform, tools, and structure needed to operate inside the network.',
    icon: (
      <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    title: 'TM pool client flow',
    body: 'Qualified client opportunities can be routed through the platform so professionals are not starting from a cold setup.',
    icon: (
      <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0H7" />
      </svg>
    ),
  },
  {
    title: 'Cloudflare-backed delivery',
    body: 'Pages, forms, and platform tools are delivered through a fast infrastructure layer so the experience stays usable.',
    icon: (
      <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Serve and repeat',
    body: 'Once inside the platform, professionals can continue using the same system instead of rebuilding their process each time.',
    icon: (
      <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const steps = [
  {
    n: 1,
    title: 'Become a member',
    body: 'You join through a membership tier and get access to the tools, access level, and setup that come with the platform.',
  },
  {
    n: 2,
    title: 'Get clients from the TM pool',
    body: 'Client opportunities can move through the platform so you are connected to work inside a more organized system.',
  },
  {
    n: 3,
    title: 'Serve through Cloudflare speed',
    body: 'The platform is built to keep pages, intake, and delivery moving so the experience stays smoother for both professionals and clients.',
  },
  {
    n: 4,
    title: 'Repeat with a better operating rhythm',
    body: 'As you continue using the platform, the structure stays in place so growth does not immediately turn into chaos.',
  },
]

const tiers = [
  {
    name: 'Starter',
    badge: 'Best for testing',
    featured: false,
    body: 'A starting level for professionals who want access to the platform with lighter monthly usage.',
    items: [
      '30 transcript tokens / mo',
      '30 tax tool game tokens / mo',
      'Payment link updates status',
      'Access to taxpayer service pool',
    ],
  },
  {
    name: 'Pro',
    badge: 'Most popular',
    featured: true,
    body: 'A stronger fit for professionals using the platform more actively and needing more room to work each month.',
    items: [
      '100 transcript tokens / mo',
      '120 tax tool game tokens / mo',
      'Featured network listing',
      'Priority taxpayer pool access',
    ],
  },
  {
    name: 'Advanced',
    badge: 'For higher volume',
    featured: false,
    body: 'Built for heavier usage, larger workloads, and professionals who need more capacity inside the platform.',
    items: [
      '250 transcript tokens / mo',
      '300 tax tool game tokens / mo',
      'Early access to taxpayer cases',
      'Top-tier network promotion',
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-10 pt-16 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2">
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-slate-300">Membership access, client flow, and platform delivery in one place.</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            How It{' '}
            <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Works
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-slate-400 md:text-2xl">
            Learn what becoming a Virtual Launch Pro member offers, how you can add clients through the platform, and how the system supports your work once you are inside it.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#how-it-works" className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:from-amber-400 hover:to-amber-500">
              See how it works →
            </a>
            <a href="/pricing" className="inline-block rounded-lg border border-slate-700 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800/80">
              View pricing
            </a>
          </div>
        </div>
      </section>

      {/* What VLP offers */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              What Virtual Launch Pro{' '}
              <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">Offers</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-slate-400">
              Virtual Launch Pro brings together membership access, client opportunity flow, and the platform tools that support the work.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {offers.map((o) => (
              <div key={o.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  {o.icon}
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">{o.title}</h3>
                  <p className="text-slate-400">{o.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step-by-step */}
      <section className="border-t border-white/10 bg-white/5 scroll-mt-16" id="how-it-works">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              How It{' '}
              <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-slate-400">
              Join the platform, get access to opportunities, serve through the system, and keep building from there.
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={s.n}>
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-xl font-bold text-slate-950">
                    {s.n}
                  </div>
                  <div className="pt-2">
                    <h3 className="mb-2 text-xl font-semibold">{s.title}</h3>
                    <p className="text-slate-400">{s.body}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-7 mt-2 h-8 w-px bg-slate-700" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership levels */}
      <section className="border-t border-white/10" id="membership-levels">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">MEMBERSHIP LEVELS</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">Membership levels</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
              Each level is built around a different amount of platform usage, transcript access, tax tool access, and client opportunity flow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => (
              <article
                key={t.name}
                className={`rounded-2xl p-8 shadow-[0_20px_45px_rgba(2,6,23,0.28)] ${
                  t.featured
                    ? 'border-2 border-orange-500/70 bg-gradient-to-b from-white/8 to-white/5'
                    : 'border border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-extrabold">{t.name}</div>
                  <span className={`rounded-full px-3 py-1 text-xs ${t.featured ? 'border border-orange-500/40 bg-orange-500/10 text-white/90' : 'border border-white/10 bg-white/5 text-white/80'}`}>
                    {t.badge}
                  </span>
                </div>
                <p className="mt-5 text-sm text-white/70 mb-6">{t.body}</p>
                <ul className="space-y-3 text-sm text-white/75">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 shadow-[0_20px_45px_rgba(2,6,23,0.28)]">
            <div className="font-semibold text-white">Platform fee</div>
            <div className="mt-2">When a client opportunity converts through the platform intake flow, a 12% professional platform fee is applied before the case is assigned.</div>
          </div>

          <div className="mt-10 flex justify-center">
            <a href="/pricing" className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-105 hover:from-amber-400 hover:to-amber-500">
              View full pricing →
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0f172a] via-[#1c1917] to-[#7c2d12] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join the network, connect to client flow, and start delivering through a system that stays organized as you grow.
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
