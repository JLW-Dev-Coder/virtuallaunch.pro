import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy | Virtual Launch Pro',
  description: 'Refund Policy for Virtual Launch Pro installs, templates, setup services, and related digital purchases.',
}

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Refund Policy</h1>
        <p className="mt-2 text-base text-white/60">Digital Installs, Templates, and Service Purchases</p>
        <p className="mt-1 text-sm text-white/40">Last updated: March 17, 2026</p>
      </div>
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
        <img src="https://taxmonitor.pro/assets/logo.svg" alt="Virtual Launch Pro" className="h-8 w-auto" loading="lazy" />
        <div className="text-sm text-white/60">
          <div className="font-semibold text-white">Virtual Launch Pro</div>
          <div>1175 Avocado Avenue Suite 101 PMB 1010 · El Cajon, CA 92020</div>
        </div>
      </div>
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm leading-relaxed text-slate-300">This Refund Policy applies to purchases made through Virtual Launch Pro, including setup packages, digital templates, implementation services, onboarding systems, automation builds, and related digital deliverables. For help with an order, use the <Link href="/contact" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">support page</Link>.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">A. What You&apos;re Buying</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Digital products and service-based setup work, including templates, workflows, configuration, implementation, and related assets.','Digitally delivered access or work product, not a physical shipped good.','Fixed-scope or staged services that may begin promptly after purchase, scheduling, kickoff, or credential handoff.'].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">B. General Rule</h2>
          <p className="text-sm leading-relaxed text-slate-300">Because Virtual Launch Pro offers digital products, implementation work, and time-based service capacity that can be reserved or started quickly, purchases are generally <strong className="text-white">non-refundable once delivery has started, access has been granted, files have been sent, or implementation work has begun</strong>.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">C. When We May Approve a Refund</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">We may approve a refund, partial refund, service credit, or adjustment in situations such as:</p>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Duplicate charge for the same order.','Unauthorized purchase claim, subject to review and payment processor rules.','Technical failure where paid digital access or files were never delivered.','Provider-side inability to start the purchased service within the stated scope for reasons not caused by Client delay, missing information, or third-party platform restrictions.','Verified billing error or materially incorrect charge amount.'].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-white/40">Refund decisions are case-by-case and may require documentation, timestamps, platform details, or payment evidence.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">D. When We Don&apos;t Refund</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-300">Refunds are not typically provided for:</p>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Change of mind after purchase.','Work already performed, including research, setup, implementation, revision rounds, automation configuration, or template customization.','Delivered digital files or assets.','Client delay in providing content, credentials, approvals, access, or required responses.','Third-party platform limitations, outages, account restrictions, or policy changes outside Provider control.','Mismatch between purchased scope and unpurchased custom requests.'].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">E. How to Request a Refund Review</h2>
          <ol className="space-y-2 text-sm text-slate-300">
            {['Submit your request through your official Virtual Launch Pro support channel.','Include your name, purchase email, order date, and a clear description of the issue.','If available, include invoice, receipt, transaction ID, and any relevant project or workspace identifiers.'].map((item, i) => (
              <li key={i} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">{i+1}</span><span>{item}</span></li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">F. Chargebacks</h2>
          <p className="text-sm leading-relaxed text-slate-300">Initiating a chargeback or payment dispute may result in temporary suspension of access, pausing of project work, or withholding of undelivered items while the matter is reviewed.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">G. Policy Changes</h2>
          <p className="text-sm leading-relaxed text-slate-300">We may update this policy from time to time. The last updated date reflects the most recent revision.</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-sm text-white/50">
        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/legal/refund" className="text-amber-400 hover:text-amber-300 transition-colors">Refund Policy</Link>
        <span>·</span>
        <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
      </div>
    </div>
  )
}
