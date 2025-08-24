import React from 'react'

type SectionProps = {
  title: React.ReactNode
  headerClassName?: string
  className?: string
  children?: React.ReactNode
  right?: React.ReactNode // optional right-side actions (e.g., "View Live")
}

export default function Section({
  title,
  headerClassName = 'section-header', /* or 'section-header-soft' if you prefer */
  className = '',
  right,
  children
}: SectionProps) {
  return (
    <section className={`card-surface overflow-hidden ${className}`}>
      <div className={`${headerClassName} px-4 py-3 flex items-center justify-between`}>
        <h3 className="font-semibold">{title}</h3>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-4">
        {children}
      </div>
    </section>
  )
}
