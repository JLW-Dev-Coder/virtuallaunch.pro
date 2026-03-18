import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Virtual Launch Pro',
  description: 'This page outlines how Virtual Launch Pro collects, uses, and protects information.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[77.5rem] px-4 py-14 md:py-20">
      <div className="mb-10 max-w-3xl">
        <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          Legal
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-base text-white/75">
          This page outlines how Virtual Launch Pro collects, uses, and protects information.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
        <div className="w-full">
          <iframe
            src="https://doc.clickup.com/8402511/p/h/80djf-13088/b52d2e2a57046df"
            title="Virtual Launch Pro Privacy Policy"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="block w-full border-0"
            style={{ minHeight: '85vh' }}
          />
        </div>
      </section>

      <div className="mt-8 text-sm text-white/50">
        Questions?{' '}
        <Link href="/contact" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
          Contact us
        </Link>
      </div>
    </div>
  )
}
