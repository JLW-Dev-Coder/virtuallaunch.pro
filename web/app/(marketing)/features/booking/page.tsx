import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tax Pro Booking Feature | Virtual Launch Pro',
  description:
    'A membership feature for tax professionals: connect Cal.com, publish a clean booking block on your profile, and let clients schedule without the usual back-and-forth.',
}

const steps = [
  { n: 1, title: 'Connect Cal.com', body: 'The professional connects once using the approved OAuth flow through Virtual Launch Pro.' },
  { n: 2, title: 'Sync calendar', body: 'They connect their calendar and manage availability, block time, and scheduling rules inside Cal.com.' },
  { n: 3, title: 'Choose event type', body: 'They pick the consultation type that should appear on the public profile page.' },
  { n: 4, title: 'Publish automatically', body: 'Virtual Launch Pro renders the booking section automatically with managed display settings and optional fallback link support.' },
]

const featureCards = [
  { tier: 'CONNECT', title: 'TM-managed OAuth', body: 'Professionals connect Cal.com through your flow, so the booking system stays standardized across the network.' },
  { tier: 'CONFIGURE', title: 'Hours stay in Cal.com', body: 'Availability, calendar sync, and buffer time stay where they belong instead of bloating your app with a half-built scheduler.' },
  { tier: 'PUBLISH', title: 'Profile booking block', body: 'Your selected consultation type renders on the Tax Pro profile automatically, with fallback booking support if needed.' },
]

const audiences = [
  { title: 'Solo professionals', body: 'Give individual members a clean booking surface without making them learn technical embed setup.' },
  { title: 'Growing networks', body: 'Keep the booking experience consistent even as more professionals join your program or directory.' },
  { title: 'Premium service offers', body: 'Useful when the member profile needs to convert attention into a consultation quickly and cleanly.' },
]

const displaySettings = [
  'Booking section title',
  'Booking section description',
  'Fallback booking URL',
  'Managed booking mode or disabled state',
]

const calSettings = [
  'Connected calendars',
  'Working hours and availability windows',
  'Buffer and block time rules',
  'Event-type scheduling behavior',
]

export default function BookingFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-12 pt-16 md:pb-16 md:pt-24">
        <p className="mx-auto mb-5 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/80">
          Membership feature for tax professionals
        </p>
        <h1 className="mx-auto max-w-5xl text-center text-4xl font-extrabold leading-tight md:text-6xl">
          Effortless Cal.com booking for{' '}
          <span className="text-orange-400">Tax Pro</span> profile pages
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-center text-base text-white/70 md:text-lg">
          Connect once, let clients book from your profile, and keep availability controlled inside Cal.com. No pasted embed code. No scheduler patchwork.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#how-it-works" className="rounded-xl bg-orange-500 px-7 py-3.5 text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">
            See how it works
          </a>
          <a href="#feature-breakdown" className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-extrabold text-white hover:bg-white/10 transition-colors">
            Explore feature details
          </a>
        </div>
      </section>

      {/* 3 summary cards */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-14 md:pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((c) => (
            <article key={c.tier} className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <div className="text-xs font-semibold tracking-widest text-orange-400">{c.tier}</div>
              <h2 className="mt-3 text-2xl font-extrabold">{c.title}</h2>
              <p className="mt-4 text-sm text-white/70">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">HOW IT WORKS</p>
            <h2 className="mt-3 text-4xl font-extrabold md:text-5xl">A calm booking flow for membership clients</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 md:text-lg">
              Built for membership businesses that want a cleaner client-facing booking experience without forcing each person to improvise their own scheduling setup.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-lg font-extrabold text-orange-400">
                  {s.n}
                </div>
                <h3 className="text-lg font-extrabold">{s.title}</h3>
                <p className="mt-4 text-sm text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature breakdown */}
      <section id="feature-breakdown" className="border-t border-white/10 bg-[#070a10]">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-orange-400">FEATURE BREAKDOWN</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">What the feature includes</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
              Not another scheduler glued onto the page — a controlled booking experience you can add to a member-facing profile system.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:p-8">
              <div className="text-xs font-semibold tracking-widest text-orange-400">DISPLAY SETTINGS</div>
              <h3 className="mt-3 text-2xl font-extrabold">Stored in the profile record</h3>
              <ul className="mt-6 space-y-3 text-sm text-white/75">
                {displaySettings.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:p-8">
              <div className="text-xs font-semibold tracking-widest text-orange-400">MANAGED BY CAL.COM</div>
              <h3 className="mt-3 text-2xl font-extrabold">Scheduling logic stays out of your way</h3>
              <ul className="mt-6 space-y-3 text-sm text-white/75">
                {calSettings.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who it fits */}
      <section className="border-t border-white/10 bg-[#070a10]">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-orange-400">WHY THIS FITS MEMBERSHIP</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">A strong feature for service-based member profiles</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
              Works especially well when your members need public-facing profiles, consultation booking, and a cleaner way to move prospects into a defined next step.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-8 backdrop-blur-sm">
                <h3 className="text-lg font-extrabold text-white mb-3">{a.title}</h3>
                <p className="text-sm text-white/70">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-widest text-orange-400">MEMBERSHIP FEATURE</p>
            <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">Add cleaner booking to your member profile</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70">
              This feature complements white-labeled profile systems, service directories, and premium membership offers that need a more controlled path from profile view to booked consultation.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/pricing" className="rounded-xl bg-orange-500 px-8 py-4 text-sm font-extrabold text-[#070a10] hover:bg-orange-400 transition-colors">
                View membership plans
              </Link>
              <Link href="/features" className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-extrabold text-white hover:bg-white/10 transition-colors">
                All features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
