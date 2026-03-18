import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Virtual Launch Pro',
  description: 'Privacy Policy for Virtual Launch Pro installs, templates, onboarding systems, and related digital services.',
}

const sections = [
  { id: 'a', title: 'A. Information Provider May Receive', body: "Provider may receive or have access to Client-provided information such as account credentials, workspace configuration, business contact information, forms, workflows, portal content, files, templates, onboarding assets, task data, automation settings, and related administrative information. Depending on the service, Provider may also incidentally view information uploaded by Client or Client's end users." },
  { id: 'b', title: 'B. Purpose of Access', body: 'Provider will access and use information only as reasonably necessary to complete the purchased service, perform setup or configuration, troubleshoot issues, verify deliverables, provide support, maintain records, and transfer administrative control back to Client where applicable.' },
  { id: 'c', title: 'C. Data Minimization', body: 'Provider will make reasonable efforts to minimize access to information not required for service delivery, testing, troubleshooting, fraud prevention, documentation, or recordkeeping. Client is encouraged not to expose sensitive information during setup unless required for the requested work.' },
  { id: 'd', title: 'D. Confidentiality & Security', body: 'Provider will maintain commercially reasonable administrative, technical, and organizational safeguards to protect information accessed during service delivery. Client remains responsible for secure passwords, platform-level security settings, user permissions, and device security after access is transferred or services are completed.' },
  { id: 'e', title: 'E. Credential Handling', body: 'Client may provide credentials, temporary invites, API keys, or access links needed to complete the service. Client may revoke Provider access at any time, but doing so may pause or prevent completion. After completion, Client should rotate temporary credentials, revoke temporary invitations, and confirm final administrative ownership and access settings.' },
  { id: 'f', title: 'F. Third-Party Platforms', body: "Virtual Launch Pro services may involve third-party platforms, software, hosting providers, payment providers, automation tools, and workspace systems. Provider does not control and is not responsible for those third parties' privacy practices, security controls, hosting terms, retention practices, or processing policies. Client is responsible for reviewing and accepting the terms and privacy policies of any third-party platforms Client uses." },
  { id: 'g', title: 'G. Data Retention', body: 'Provider does not intend to retain Client information longer than reasonably necessary for service delivery, support, invoicing, bookkeeping, proof of delivery, security, dispute resolution, or legal compliance. Limited records, screenshots, configuration notes, receipts, or support artifacts may be retained for business and legal purposes.' },
  { id: 'h', title: 'H. Client Requests', body: 'Client may request deletion of Provider-held materials containing Client information, to the extent Provider is not required to retain them for legal, tax, accounting, security, dispute, or operational recordkeeping obligations.' },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">Legal</p>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-2 text-base text-white/60">Install, Template, and Service Data Handling</p>
        <p className="mt-1 text-sm text-white/40">Last updated: March 17, 2026</p>
      </div>
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
        <img src="https://taxmonitor.pro/assets/logo.svg" alt="Virtual Launch Pro" className="h-8 w-auto" loading="lazy" />
        <div className="text-sm text-white/60">
          <div className="font-semibold text-white">Virtual Launch Pro</div>
          <div>1175 Avocado Avenue Suite 101 PMB 1010 · El Cajon, CA 92020</div>
        </div>
      </div>
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm leading-relaxed text-slate-300">This Privacy Policy explains how Virtual Launch Pro and its operator ("Provider") may access, use, and handle Client information in connection with installs, setup work, templates, automation configuration, support, and related digital services.</p>
      </div>
      <div className="space-y-4">
        {sections.map((s) => (
          <section key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h2 className="mb-3 text-lg font-semibold text-white">{s.title}</h2>
            <p className="text-sm leading-relaxed text-slate-300">{s.body}</p>
          </section>
        ))}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Contact</h2>
          <p className="text-sm leading-relaxed text-slate-300">For questions regarding this Privacy Policy, contact Virtual Launch Pro through the <Link href="/contact" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">support page</Link> or by mail at 1175 Avocado Avenue Suite 101 PMB 1010, El Cajon, CA 92020.</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-sm text-white/50">
        <Link href="/legal/privacy" className="text-amber-400 hover:text-amber-300 transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/legal/refund" className="hover:text-white transition-colors">Refund Policy</Link>
        <span>·</span>
        <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
      </div>
    </div>
  )
}
