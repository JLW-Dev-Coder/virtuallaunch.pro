'use client'

import { useState } from 'react'
import Link from 'next/link'

const TOPICS = [
  {
    id: 'account-payment',
    title: 'Account & Payment',
    icon: '💳',
    summary: 'Checkout, receipts, and billing questions',
    body: `When you upgrade your plan, you'll be directed to a secure Stripe checkout. After completing payment, your membership is activated immediately and reflected on your dashboard.\n\nReceipts are available under the Receipts page in your app dashboard. Stripe sends an automatic email receipt to your registered email address after each successful charge.\n\nIf you see an unexpected charge or have a billing question, contact us through Support and include the last 4 digits of the card and the charge date.`,
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    icon: '📬',
    summary: 'What to include when reaching out',
    body: `When contacting support, please include:\n\n• Your registered email address\n• A clear description of the issue\n• Steps you've already tried\n• Screenshots if applicable\n• The date and time the issue occurred\n\nYou can reach us through the Support page in your dashboard (fastest) or through the Contact page on this site. We respond within 1 business day.`,
  },
  {
    id: 'download-access',
    title: 'Download & Access',
    icon: '📥',
    summary: 'How to access what you purchased',
    body: `All plan features are available immediately after checkout. Sign in to your dashboard at virtuallaunch.pro to access your tools.\n\nIf your membership shows "Free" after a successful payment, try signing out and back in — this forces a session refresh. If the issue persists, contact support with your Stripe receipt number.\n\nBooking and calendar features require connecting your Cal.com account from the Calendar page.`,
  },
  {
    id: 'token-packs',
    title: 'Token Packs',
    icon: '🪙',
    summary: 'Small, Medium, Large — tokens never expire',
    body: `Token packs let you add tax game tokens or transcript tokens to your account outside of your monthly plan.\n\n• Small Pack — 5,000 tokens\n• Medium Pack — 15,000 tokens\n• Large Pack — 50,000 tokens\n\nAll tokens are added to your existing balance and never expire. They are available immediately after purchase. You can monitor your token balance and usage on the Token Usage page in your dashboard.`,
  },
  {
    id: 'free-previews',
    title: 'Free Previews',
    icon: '👁️',
    summary: 'Try demos without spending tokens',
    body: `Several tools on Virtual Launch Pro offer free preview modes. These let you explore the interface and sample output without spending any tokens or requiring an active paid membership.\n\nFree previews are clearly labeled within the tool. When you're ready to run a full analysis, a paid plan or token pack is required.\n\nFree accounts have access to free previews across all tool categories.`,
  },
  {
    id: 'refunds-policies',
    title: 'Refunds & Policies',
    icon: '📋',
    summary: 'Policies and legal documentation',
    body: `Our full refund policy, privacy policy, and terms of service are linked below.\n\nSubscription plans are billed monthly or annually. You may cancel at any time — your access continues until the end of the current billing period. We do not offer prorated refunds for partial periods.\n\nToken packs are non-refundable once purchased since tokens are added to your account immediately.\n\nFor disputes or questions about a specific charge, contact support before initiating a chargeback.`,
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Refund Policy', href: '/legal/refund' },
      { label: 'Terms of Service', href: '/legal/terms' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    summary: 'Fix common issues',
    body: `Common issues and fixes:\n\n• Membership shows "Free" after payment — sign out and back in, or hard-refresh the account page.\n• Calendar not connecting — ensure you have an active Cal.com account and are not using an ad blocker.\n• Tokens not appearing — allow up to 60 seconds after checkout; contact support if they don't appear after 5 minutes.\n• Can't sign in — check that you're using the same email you registered with. Magic links expire after 15 minutes.\n• Booking link not working — paste your Cal.com booking URL on the Calendar page and click Save.`,
  },
  {
    id: 'using-tools',
    title: 'Using Your Tools',
    icon: '🛠️',
    summary: 'Quick how-to per tool type',
    body: `Tax Game — Select a scenario type, configure parameters, and run a simulation. Each run costs tokens based on complexity. Results are displayed inline and can be exported.\n\nTranscript Tool — Upload or paste a transcript text, select analysis type, and submit. Tokens are deducted per analysis run.\n\nPublic Profile — Complete the Profile Setup wizard under Onboarding. Your profile appears in the Tax Monitor directory once submitted.\n\nBooking — Connect your Cal.com account on the Calendar page, then paste your booking URL. Clients can book directly from your public profile.\n\nInquiries — Tax professionals receive taxpayer intake inquiries in the Inquiries section of the dashboard.`,
  },
]

interface Topic {
  id: string
  title: string
  icon: string
  summary: string
  body: string
  links?: { label: string; href: string }[]
}

function TopicModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/20 bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">{topic.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {topic.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{para}</p>
          ))}
        </div>
        {topic.links && (
          <div className="mt-5 flex flex-wrap gap-3">
            {topic.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default function HelpCenterPage() {
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="bg-slate-900 px-6 py-20 text-center">
          <h1 className="text-4xl font-black text-white">Help Center</h1>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            Find answers to common questions about Virtual Launch Pro.
          </p>
          <div className="mt-6 mx-auto max-w-md">
            <input
              type="text"
              placeholder="Search help topics…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Topic grid */}
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveTopic(topic)}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{topic.icon}</div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{topic.title}</div>
                <div className="mt-1 text-xs text-slate-500">{topic.summary}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Still need help CTA */}
        <div className="bg-slate-50 px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Still need help?</h2>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            Our team is here for you. Send us a message and we'll get back to you within one business day.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3 text-sm font-bold text-white hover:from-orange-400 hover:to-amber-400 transition"
          >
            Contact Us →
          </Link>
        </div>
      </div>

      {activeTopic && (
        <TopicModal topic={activeTopic} onClose={() => setActiveTopic(null)} />
      )}
    </>
  )
}
