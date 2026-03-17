const painPoints = [
  { n: 1, title: 'Website but no clients', tag: 'Common complaint', body: 'Professionals build a site but it does not convert because the offer, positioning, and client path are unclear.', fix: 'Solved with: clearer packages and stronger client-facing positioning' },
  { n: 2, title: 'Services are hard to explain', tag: 'Packaging issue', body: 'Offers live in conversations instead of structured packages, which makes pricing and sales calls harder than they should be.', fix: 'Solved with: structured services with clear end-points' },
  { n: 3, title: 'Where do clients come from?', tag: 'Lead generation issue', body: 'Many skilled professionals rely on referrals alone and struggle to create predictable client flow.', fix: 'Solved with: promotion across the Tax Monitor public network' },
  { n: 4, title: 'Messy onboarding', tag: 'Delivery issue', body: 'Intake forms, files, scheduling, and payments often live in separate tools, creating friction before work even starts.', fix: 'Solved with: a cleaner onboarding and delivery system' },
  { n: 5, title: 'Too many disconnected tools', tag: 'Systems issue', body: 'Professionals often stitch together forms, calendars, CRMs, and payments instead of using one coherent system.', fix: 'Solved with: a unified launch and service workflow' },
  { n: 6, title: 'Growth without chaos', tag: 'Scaling issue', body: 'Without structure, more clients simply means more confusion and more manual coordination.', fix: 'Solved with: structured packages and repeatable delivery systems' },
  { n: 7, title: 'Clients disappear after proposals', tag: 'Trust and clarity issue', body: 'Potential clients hesitate when the service path feels unclear or the presentation lacks credibility.', fix: 'Solved with: clearer positioning and professional launch pages' },
  { n: 8, title: 'Endless client questions', tag: 'Communication overload', body: 'Without clear steps and visible status, clients constantly ask what happens next.', fix: 'Solved with: a structured client journey and visible delivery steps' },
  { n: 9, title: 'Marketing eats all your time', tag: 'Visibility issue', body: 'Professionals spend hours trying to attract clients instead of delivering the work they are good at.', fix: 'Solved with: promotion across the Tax Monitor public network' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-10 pt-16 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2">
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-slate-300">Member visibility, structured packages, and cleaner client flow through the Tax Monitor network.</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            About{' '}
            <span className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Virtual Launch Pro
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-slate-400 md:text-2xl">
            Tax professionals join the network, get positioned where taxpayer intent already exists, and serve through a cleaner system built for steadier client flow.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/pricing"
              className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-400 hover:to-amber-500 hover:scale-105"
            >
              View packages →
            </a>
            <a
              href="/features"
              className="inline-block rounded-lg border border-slate-700 bg-slate-900/60 px-8 py-4 text-lg font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800/80"
            >
              Explore features
            </a>
          </div>
        </div>
      </section>

      {/* Founder + Mission */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Founder card */}
            <div className="rounded-3xl shadow-xl p-8 bg-gradient-to-b from-slate-800/98 to-[#02060f]/98 border border-orange-500/18">
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-orange-100 to-orange-200">
                  <img
                    src="https://20896460.fs1.hubspotusercontent-na1.net/hubfs/20896460/Development%20Materials/Miscellaneous/Pic_JLW_Left-removebg-preview.png"
                    alt="Jamie L. Williams"
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="mt-4 text-lg font-bold text-white">Jamie L. Williams</p>
                <p className="mt-1 text-sm text-slate-300">Founder • Systems builder</p>
              </div>
              <div className="mt-8 text-center">
                <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold border border-orange-400/20">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Built by JLW for real-world service businesses
                </span>
              </div>
            </div>

            {/* Mission */}
            <div>
              <span className="inline-flex items-center gap-2 bg-orange-500/15 text-orange-200 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-orange-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Our mission
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                Make it easier to launch with confidence, not patchwork
              </h2>
              <p className="text-lg text-slate-200 leading-relaxed mb-8">
                Too many skilled professionals end up with patchwork marketing, tax resolution as the default offer, and onboarding that complicates the simple enjoyment of delivering quality work. Virtual Launch Pro fixes that with member promotion across the Tax Monitor public network, structured package services with clear end-points, and a cleaner launch system so expertise turns into steady client flow while members focus on serving clients.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 shadow-md bg-gradient-to-b from-slate-800/98 to-[#02060f]/98 border border-orange-500/18">
                  <p className="text-3xl font-bold text-white">Credible</p>
                  <p className="text-sm text-slate-300">Cleaner client-facing presence</p>
                </div>
                <div className="rounded-2xl p-5 shadow-md bg-gradient-to-b from-slate-800/98 to-[#02060f]/98 border border-orange-500/18">
                  <p className="text-3xl font-bold text-white">Structured</p>
                  <p className="text-sm text-slate-300">Offers, pages, and systems aligned</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why this exists — pain points */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-orange-500/15 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-orange-500/20">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L7.5 17l.9-5L4.8 8.3l5-.7L12 2z" />
              </svg>
              Why this exists
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              We built this around the launch problems people keep running into
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Great work does not sell itself when the presentation is weak, the offer is messy, and the systems feel improvised.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.n}
                className="rounded-2xl p-6 bg-gradient-to-b from-slate-800/98 to-[#02060f]/98 border border-orange-500/18 shadow-[0_24px_60px_rgba(2,6,23,0.34)]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {p.n}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.tag}</p>
                  </div>
                </div>
                <p className="text-slate-200 leading-relaxed mb-4">{p.body}</p>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm font-semibold text-orange-300">{p.fix}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-4 rounded-2xl border border-orange-400/20">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-white font-semibold">We built this to make launching look more professional without making the process heavier.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0f172a] via-[#1c1917] to-[#7c2d12] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready for a calmer delivery system?</h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Use Virtual Launch Pro to enjoy a cleaner client journey, tighter scope control, and a delivery flow that feels organized from the start.
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
