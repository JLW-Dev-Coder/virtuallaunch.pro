import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Virtual Launch Pro',
  description: "Virtual Launch Pro's terms of service.",
}

const sections = [
  {
    id: '1',
    title: '1. Services',
    content: (
      <>
        <p>Virtual Launch Pro provides digital infrastructure services including, but not limited to:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>automation system setup</li>
          <li>workflow and onboarding systems</li>
          <li>templates and digital assets</li>
          <li>software configuration and implementation</li>
          <li>platform integrations (e.g., CRM, scheduling, payment systems)</li>
        </ul>
        <p className="mt-3">Services may be delivered as fixed-scope installs, digital downloads, or hybrid service engagements.</p>
      </>
    ),
  },
  {
    id: '2',
    title: '2. No Guarantees',
    content: (
      <>
        <p>VLP provides tools, systems, and infrastructure. We do not guarantee business results, revenue, lead generation, client acquisition, or operational outcomes.</p>
        <p className="mt-3">You are solely responsible for how you use the systems provided.</p>
      </>
    ),
  },
  {
    id: '3',
    title: '3. Client Responsibilities',
    content: (
      <>
        <p>You agree to:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>provide accurate information</li>
          <li>maintain access to required third-party platforms</li>
          <li>provide credentials or access when required for implementation</li>
          <li>review and approve deliverables in a timely manner</li>
        </ul>
        <p className="mt-3">Delays caused by missing access, incomplete information, or lack of response may impact delivery timelines.</p>
      </>
    ),
  },
  {
    id: '4',
    title: '4. Third-Party Platforms',
    content: (
      <>
        <p>VLP services may rely on third-party platforms including, but not limited to:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>Cloudflare</li>
          <li>Stripe</li>
          <li>ClickUp</li>
          <li>Cal.com</li>
          <li>Google Workspace</li>
        </ul>
        <p className="mt-3">We are not responsible for outages, limitations, policy changes, or failures of third-party systems. Your use of those platforms is governed by their respective terms.</p>
      </>
    ),
  },
  {
    id: '5',
    title: '5. Payment Terms',
    content: (
      <>
        <p>All payments must be made in full unless otherwise specified in writing.</p>
        <p className="mt-3">By submitting payment, you authorize VLP to begin work and allocate resources to your project.</p>
        <p className="mt-3">Pricing, deliverables, and scope are defined at the time of purchase or agreement.</p>
      </>
    ),
  },
  {
    id: '6',
    title: '6. Refund Policy',
    content: (
      <>
        <p>All sales are subject to the VLP Refund Policy.</p>
        <p className="mt-3">Digital products, templates, and delivered systems are non-refundable once access, files, or implementation work has begun.</p>
        <p className="mt-3">For full details, refer to the Refund Policy page.</p>
      </>
    ),
  },
  {
    id: '7',
    title: '7. Intellectual Property',
    content: (
      <>
        <p>All systems, templates, and materials provided by VLP remain the intellectual property of Virtual Launch Pro, unless otherwise explicitly stated.</p>
        <p className="mt-3">You are granted a limited, non-transferable license to use the delivered materials for your own business operations.</p>
        <p className="mt-3">You may not:</p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>resell or redistribute VLP systems</li>
          <li>duplicate for commercial resale</li>
          <li>claim ownership of VLP intellectual property</li>
        </ul>
      </>
    ),
  },
  {
    id: '8',
    title: '8. Scope Changes',
    content: (
      <>
        <p>Any work requested outside the agreed scope may require additional fees and timeline adjustments.</p>
        <p className="mt-3">VLP reserves the right to define scope boundaries and decline out-of-scope requests.</p>
      </>
    ),
  },
  {
    id: '9',
    title: '9. Limitation of Liability',
    content: (
      <>
        <p>To the maximum extent permitted by law, VLP shall not be liable for any indirect, incidental, consequential, or business-related damages arising from use of our services.</p>
        <p className="mt-3">Total liability shall not exceed the amount paid for the specific service in question.</p>
      </>
    ),
  },
  {
    id: '10',
    title: '10. Termination',
    content: (
      <>
        <p>We reserve the right to suspend or terminate services if you violate these Terms or engage in misuse of our systems.</p>
        <p className="mt-3">Upon termination, access to services or materials may be revoked.</p>
      </>
    ),
  },
  {
    id: '11',
    title: '11. Governing Law',
    content: (
      <p>These Terms shall be governed by applicable law. Any disputes shall be resolved in the appropriate jurisdiction.</p>
    ),
  },
  {
    id: '12',
    title: '12. Contact',
    content: (
      <p>
        For questions regarding these Terms,{' '}
        <Link href="/contact" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
          contact us here
        </Link>
        .
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          Legal
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated: 2026</p>
      </div>

      <div className="mb-10 space-y-3 text-sm leading-relaxed text-slate-300">
        <p>
          These Terms of Service ("Terms") govern your access to and use of services provided by{' '}
          <strong className="text-white">Virtual Launch Pro</strong> ("VLP", "we", "our", or "us").
        </p>
        <p>
          By purchasing, accessing, or using any VLP product, service, template, or installation,
          you agree to be bound by these Terms.
        </p>
      </div>

      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.id} className="space-y-4 text-sm leading-relaxed text-slate-300">
            <h2 className="text-xl font-semibold text-white">{s.title}</h2>
            {s.content}
          </section>
        ))}
      </div>
    </div>
  )
}
