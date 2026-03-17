import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 ${className}`}
    >
      {children}
    </div>
  )
}
