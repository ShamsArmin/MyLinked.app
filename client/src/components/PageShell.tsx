import React from 'react'

export default function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="page-surface">{children}</div>
}
