import Link from 'next/link'

const LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/sign-in', label: 'Log In' },
]

const RESOURCES = [
  { href: '/blog', label: 'Blog', external: false },
  { href: 'https://taxmonitor.pro/resources/transcript-central', label: 'Transcript Central', external: true },
  { href: 'https://transcript.taxmonitor.pro/resources/how-to-read-irs-transcripts', label: 'How to Read IRS Transcripts', external: true },
  { href: 'https://taxmonitor.pro', label: 'Tax Monitor Pro', external: true },
  { href: 'https://transcript.taxmonitor.pro', label: 'Transcript Automation', external: true },
  { href: 'https://taxtools.taxmonitor.pro', label: 'TaxTools Arcade', external: true },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.35fr_1fr_1fr_1fr] md:items-start md:gap-x-16">

          {/* Brand */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 font-bold text-slate-950">
                VLP
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold tracking-tight text-white">Virtual Launch Pro</span>
                <span className="text-xs text-slate-400">Calm launch systems</span>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-slate-400">
              Membership platform for tax professionals who want calmer launches, cleaner operations,
              and a repeatable client acquisition system.
            </p>

            <p className="text-xs text-slate-500">
              Features, tools, and support vary by membership tier. Access to resources, automation,
              and implementation guidance depends on the plan selected.
            </p>

            <div className="mt-2 flex flex-col gap-2">
              <Link
                href="/contact#contact-options"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-orange-400 hover:to-amber-400"
              >
                Start Here →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">Links</h3>
            <nav className="grid gap-2 text-sm">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-slate-300 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4 md:-ml-8">
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <nav className="grid gap-2 text-sm">
              {RESOURCES.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  {...(r.external ? { target: '_blank', rel: 'noopener' } : {})}
                  className="text-slate-300 transition hover:text-white"
                >
                  {r.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <div className="grid gap-2 text-sm">
              <Link href="/legal/privacy" className="text-slate-300 transition hover:text-white">Privacy</Link>
              <Link href="/legal/terms" className="text-slate-300 transition hover:text-white">Terms</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">© {year} Virtual Launch Pro</p>
          </div>

        </div>
      </div>
    </footer>
  )
}
