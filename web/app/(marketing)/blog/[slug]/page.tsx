import { notFound } from 'next/navigation'
import Link from 'next/link'
import { POSTS, getPost, formatDate } from '@/lib/blog/posts'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

const categoryColors: Record<string, string> = {
  Market: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  Distribution: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  'Practice Infrastructure': 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  'Recurring Revenue': 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  'Service Design': 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  'Tax Monitoring': 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  'Transcript Analysis': 'bg-rose-500/15 border-rose-500/30 text-rose-400',
  Ecosystem: 'bg-green-500/15 border-green-500/30 text-green-400',
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const badgeCls = categoryColors[post.category] ?? 'bg-white/10 border-white/20 text-white/70'
  const otherPosts = POSTS.filter((p) => p.slug !== slug).slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <nav className="mb-8 text-sm text-white/50" aria-label="Breadcrumb">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span className="mx-2">&rsaquo;</span>
            <span className="text-white/70">{post.category}</span>
          </nav>
          <div className="mb-12 md:mb-16">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${badgeCls}`}>{post.category}</span>
              <span className="text-xs text-white/60">{post.readTime}</span>
              <time className="text-xs text-white/60">{formatDate(post.date)}</time>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-6 md:text-5xl">{post.title}</h1>
            <p className="text-lg text-white/75 max-w-2xl">{post.description}</p>
          </div>
          <div className="flex items-center gap-4 pb-8 border-b border-white/10 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-slate-950 shrink-0">{post.author}</div>
            <div>
              <div className="font-semibold">{post.author}</div>
              <div className="text-sm text-white/60">{post.authorRole}</div>
            </div>
          </div>
          <div className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">Table of contents</div>
            <nav aria-label="Table of contents">
              <ol className="grid gap-3 text-sm text-white/75 md:grid-cols-2">
                {post.sections.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`} className="transition hover:text-white">{s.heading ?? 'Introduction'}</a></li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="space-y-12">
            {post.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-32 md:scroll-mt-36 prose prose-invert prose-sm max-w-none [&_p]:text-white/80 [&_p]:leading-relaxed [&_p+p]:mt-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-white [&_h2]:mb-5 [&_h2]:mt-0 [&_a]:text-orange-400 [&_a:hover]:text-orange-300">
                {s.heading && <h2>{s.heading}</h2>}
                <div dangerouslySetInnerHTML={{ __html: s.content }} />
              </section>
            ))}
          </div>
          <div className="mt-16 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-8 text-center">
            <p className="text-lg font-semibold text-orange-300 mb-4">Virtual Launch Pro helps tax professionals build calmer, more credible service operations.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/blog" className="text-sm text-white/70 underline underline-offset-2 hover:text-white transition-colors">Read more articles</Link>
              <Link href="/how-it-works" className="text-sm text-white/70 underline underline-offset-2 hover:text-white transition-colors">See how membership works</Link>
            </div>
          </div>
        </article>
        {otherPosts.length > 0 && (
          <section className="border-t border-white/10">
            <div className="mx-auto max-w-3xl px-4 py-16">
              <h2 className="mb-8 text-2xl font-extrabold">More articles</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {otherPosts.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-orange-500/30 hover:-translate-y-1">
                    <div className="mb-2 text-xs font-bold text-orange-400">{p.category}</div>
                    <h3 className="text-lg font-extrabold leading-tight group-hover:text-orange-300 transition-colors">{p.title}</h3>
                    <p className="mt-2 text-sm text-white/60 line-clamp-2">{p.description}</p>
                    <div className="mt-4 text-xs text-orange-400 group-hover:text-orange-300 transition-colors">Read</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}