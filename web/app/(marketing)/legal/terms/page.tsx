import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Virtual Launch Pro',
  description: 'Terms for Virtual Launch Pro digital products, installs, templates, implementation services, and platform use.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Terms of Service</h1>
        <p className="mt-2 text-base text-white/60">Digital Products, Installs, and Service Use Agreement</p>
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
          <p className="text-sm leading-relaxed text-slate-300">This Agreement is entered into by and between Virtual Launch Pro&apos;s operating entity (&ldquo;Provider&rdquo;) and the individual or entity purchasing, accessing, or using Virtual Launch Pro products or services (&ldquo;Client&rdquo;).</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 1. Covered Services &amp; Scope of Use</h2>
          <ul className="mb-4 space-y-2 text-sm text-slate-300">
            {['Digital templates, documents, and workflow assets','Setup, implementation, and onboarding services','Automation configuration and platform customization','Related account access, training, support, and digital deliverables'].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-slate-300">Unless expressly stated in writing, purchases do not include unlimited revisions, custom development beyond the purchased scope, legal review, compliance review, tax advice, accounting advice, employment advice, or regulated professional services.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 2. No Professional or Regulated Advice</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">Client acknowledges that Provider does not provide legal, tax, accounting, financial, compliance, HR, employment, or other regulated professional advice under this Agreement unless separately and expressly stated in writing.</p>
          <p className="text-sm leading-relaxed text-slate-300">Any templates, examples, workflows, automations, labels, prompts, structure, content, or implementation suggestions are provided for operational and informational purposes only.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 3. Client Responsibilities</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {['Provide accurate business, billing, and access information.','Provide required content, approvals, credentials, and feedback in a timely manner.','Review all deliverables before relying on them in operations, sales, hiring, service delivery, or compliance activity.',"Ensure that Client's use of any deliverable complies with Client's own obligations, licenses, contracts, policies, and applicable law."].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 4. Account Access &amp; Credentials</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">Client is responsible for maintaining secure control of the accounts, workspaces, tools, and credentials used in connection with Virtual Launch Pro services.</p>
          <p className="text-sm leading-relaxed text-slate-300">Provider may rely on the credentials, invitations, workspace permissions, billing details, and account-linked identifiers supplied by Client to determine authorized access and service delivery.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 5. Third-Party Platforms, Tools, and Dependencies</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">Virtual Launch Pro services may depend on third-party platforms, hosting providers, payment processors, communication tools, productivity systems, automation platforms, or related software selected by Client or Provider.</p>
          <p className="text-sm leading-relaxed text-slate-300">Provider is not responsible for outages, policy changes, pricing changes, API changes, account restrictions, lost access, feature removals, or technical limitations caused by third-party providers.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 6. Acceptance of Deliverables</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {["Delivery of files, templates, links, system access, or configuration work,","Implementation beginning in Client's environment, or","Client using, approving, publishing, or relying on any deliverable."].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 7. Fees and Payment</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">Client agrees to pay the fees presented at checkout, invoice, proposal, or service order for the purchased Virtual Launch Pro product or service.</p>
          <p className="text-sm leading-relaxed text-slate-300">Unless otherwise stated in writing, fees are due in advance and are non-refundable except as described in the <Link href="/legal/refund" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">Refund Policy</Link>.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 8. Privacy and Data Handling</h2>
          <p className="text-sm leading-relaxed text-slate-300">Provider may access and handle Client information only as reasonably necessary to deliver services, troubleshoot issues, verify work, provide support, maintain records, and protect service integrity. Additional details are described in the <Link href="/legal/privacy" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">Privacy Policy</Link>.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 9. Intellectual Property &amp; License</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">Provider retains all rights in Provider-owned templates, design systems, frameworks, code, workflows, branding, documentation, processes, and related proprietary materials except where a separate written transfer or license expressly says otherwise.</p>
          <p className="text-sm leading-relaxed text-slate-300">Client receives a limited, non-exclusive, non-transferable license to use purchased deliverables for Client&apos;s internal business use. Client may not resell, redistribute, sublicense, or falsely claim authorship of Provider-owned materials unless expressly authorized in writing.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 10. Revisions, Scope, and Change Requests</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">Any revisions, edits, additions, integrations, migrations, or customizations outside the purchased scope are outside this Agreement unless separately approved in writing.</p>
          <p className="text-sm leading-relaxed text-slate-300">Provider may treat new requirements, delayed feedback, missing assets, changed direction, or expanded technical requests as a scope change requiring a new fee, timeline, or order.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 11. No Guarantees</h2>
          <p className="text-sm leading-relaxed text-slate-300">Provider does not guarantee revenue, lead volume, conversion rate, client retention, hiring success, time savings, business outcomes, regulatory outcomes, or uninterrupted availability of any third-party platform.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 12. Limitation of Liability</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">To the maximum extent permitted by law, Provider will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including lost revenue, lost profits, lost data, business interruption, or reliance-based harm arising out of or related to this Agreement, the deliverables, or Client&apos;s use of any product or service.</p>
          <p className="text-sm leading-relaxed text-slate-300">Provider&apos;s total aggregate liability under this Agreement will not exceed the amount actually paid by Client for the specific product or service giving rise to the claim.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 13. Indemnification</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {["Client's misuse of deliverables or systems,","Client's breach of this Agreement,","Client's violation of applicable law, or","Client's violation of a third party's rights, terms, or content restrictions."].map((item) => (
              <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" /><span>{item}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 14. Suspension or Termination</h2>
          <p className="text-sm leading-relaxed text-slate-300">Provider may suspend or terminate access or project work if Client materially breaches this Agreement, fails to pay, engages in abusive conduct, misuses systems, creates security risk, or initiates fraudulent payment activity.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 15. Governing Law &amp; Venue</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-300">This Agreement is governed by the laws of the State of California, without regard to conflict-of-law principles.</p>
          <p className="text-sm leading-relaxed text-slate-300">Any dispute arising from this Agreement will be resolved in the state or federal courts located in San Diego County, California, unless the Parties agree in writing to another dispute process.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Section 16. Entire Agreement</h2>
          <p className="text-sm leading-relaxed text-slate-300">This Agreement, together with the Privacy Policy, Refund Policy, and any written invoice, proposal, order, or scope document expressly incorporated by reference, constitutes the entire agreement between the Parties regarding the subject matter described here.</p>
        </section>
        <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Electronic Acceptance</h2>
          <p className="text-sm leading-relaxed text-slate-300">By purchasing, scheduling, accessing, downloading, or using a Virtual Launch Pro product or service, Client acknowledges that they have read, understood, and agreed to be bound by these terms.</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-sm text-white/50">
        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/legal/refund" className="hover:text-white transition-colors">Refund Policy</Link>
        <span>·</span>
        <Link href="/legal/terms" className="text-amber-400 hover:text-amber-300 transition-colors">Terms of Service</Link>
      </div>
    </div>
  )
}
