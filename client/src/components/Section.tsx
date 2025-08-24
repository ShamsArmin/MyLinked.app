import React from 'react'

type SectionProps = {
  title: React.ReactNode
  className?: string
  headerClassName?: string
  right?: React.ReactNode
  children?: React.ReactNode
}

export default function Section({
  title,
  className = '',
  headerClassName = 'section-header',
  right,
  children,
}: SectionProps) {
  return (
    <section className={`card-surface overflow-hidden ${className}`}>
      <div className={`${headerClassName} px-4 py-3 flex items-center justify-between`}>
        <h3 className="font-semibold">{title}</h3>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

