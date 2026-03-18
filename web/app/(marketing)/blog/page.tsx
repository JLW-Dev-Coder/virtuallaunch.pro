import type { Metadata } from 'next'
import Link from 'next/link'
import { POSTS, formatDate } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'Blog | Virtual Launch Pro',
  description:
    'Insights on calm delivery, white-labeled onboarding, service operations, and scalable client systems for Virtual Launch Pro.',
}

const categoryColors: Record<string, string> = {
  Market: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  Distribution: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  'Practice Infrastructure': 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
}

function CategoryBadge({ category }: { category: string }) {
  const cls = categoryColors[category] ?? 'bg-white/10 border-white/20 text-white/70'
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${cls}`}>
      {category}
    </span>
  )
}

export default function BlogIndexPage() {
  const [featured, ...rest] = POSTS

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-10 pt-16 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2">
            <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-slate-300">Field-tested thinking for tax professionals.</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Virtual Launch Pro{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="mx-auto text-xl leading-relaxed text-slate-400">
            Insights on calm delivery, white-labeled onboarding, service operations, and scalable client systems.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <section className="mx-auto max-w-[77.5rem] px-4 pb-14">
        <Link
          href={`/blog/${featured.slug}`}
          className="group block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.24)] transition hover:border-orange-500/30 hover:shadow-[0_12px_48px_rgba(249,115,22,0.15)] md:p-10"
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <CategoryBadge category={featured.category} />
            <span className="text-xs text-white/60">{featured.readTime}</span>
            <span className="text-xs text-white/60">•</span>
            <time className="text-xs text-white/60">{formatDate(featured.date)}</time>
          </div>
          <h2 className="mb-4 text-2xl font-extrabold leading-tight md:text-3xl group-hover:text-orange-300 transition-colors">
            {featured.title}
          </h2>
          <p className="mb-6 max-w-2xl text-base text-white/70">{featured.description}</p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-slate-950">
              {featured.author}
            </div>
            <div>
              <div className="text-sm font-semibold">{featured.author}</div>
              <div className="text-xs text-white/60">{featured.authorRole}</div>
            </div>
            <span className="ml-auto text-sm text-orange-400 group-hover:text-orange-300 transition-colors">
              Read article →
            </span>
          </div>
        </Link>
      </section>

      {/* Remaining posts */}
      {rest.length > 0 && (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-[77.5rem] px-4 py-16 md:py-20">
            <h2 className="mb-10 text-2xl font-extrabold">More articles</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/60 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.24)] transition hover:border-orange-500/30 hover:-translate-y-1"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <CategoryBadge category={post.category} />
                    <span className="text-xs text-white/60">{post.readTime}</span>
                  </div>
                  <h3 className="mb-3 text-lg font-extrabold leading-tight group-hover:text-orange-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-white/70 line-clamp-3">{post.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <time className="text-xs text-white/50">{formatDate(post.date)}</time>
                    <span className="text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
                      Read →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0f172a] via-[#1c1917] to-[#7c2d12] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build a calmer practice?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            See how Virtual Launch Pro helps tax professionals turn expertise into a repeatable, organized service system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg">
              See Pricing
            </Link>
            <Link href="/how-it-works" className="bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-xl border border-orange-400/20 transition-all">
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
