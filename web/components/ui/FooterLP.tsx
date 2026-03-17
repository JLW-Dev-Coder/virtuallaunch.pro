import Image from 'next/image'
import Link from 'next/link'
import CookieConsent from './CookieConsent'

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

export default function FooterLP() {
  const year = new Date().getFullYear()

  return (
    <>
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-center gap-6">
            <Link href="/" aria-label="Virtual Launch Pro home">
              <Image
                src="/assets/apple-touch-icon.png"
                alt="Virtual Launch Pro"
                width={60}
                height={60}
                className="h-12 w-auto rounded-xl"
              />
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <div>© {year} Virtual Launch Pro. Owned and operated by Lenore, Inc.</div>

          <div className="flex gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <CookieConsent />
    </>
  )
}
