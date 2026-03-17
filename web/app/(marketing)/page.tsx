import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Calm launch systems for tax professionals
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-slate-400">
        Virtual Launch Pro gives you a repeatable client acquisition system — so you can
        launch without the chaos of duct tape, calendar links, and prayer.
      </p>
      <div className="mt-10">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:from-orange-400 hover:to-amber-400"
        >
          Start Here →
        </Link>
      </div>
    </section>
  )
}
