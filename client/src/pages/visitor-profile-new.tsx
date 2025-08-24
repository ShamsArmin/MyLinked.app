import React, { useEffect } from 'react'
import { useParams } from 'wouter'
import { useQuery } from '@tanstack/react-query'

import Section from '@/components/Section'
import { applyTheme } from '@/lib/theme'

// Public visitor profile page displaying user info using theme-aware sections

type PublicProfileData = {
  profile: {
    username: string
    name?: string
    bio?: string
    theme?: string
  }
  links: Array<{ id: number; title: string; url: string }>
  referralLinks?: Array<{ id: number; title: string; url: string }>
}

export default function VisitorProfileNew() {
  const { username } = useParams()

  const { data, isLoading, error } = useQuery<PublicProfileData>({
    queryKey: ['/api/profile', username],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${username}`)
      if (!res.ok) throw new Error('Profile not found')
      return res.json()
    },
    enabled: !!username,
  })

  useEffect(() => {
    if (data?.profile?.theme) {
      applyTheme(data.profile.theme)
    }
  }, [data?.profile?.theme])

  if (isLoading) {
    return <div className="page-surface flex items-center justify-center">Loading profile…</div>
  }

  if (error || !data) {
    return <div className="page-surface flex items-center justify-center">Profile not found</div>
  }

  const { profile, links = [], referralLinks = [] } = data

  return (
    <div className="page-surface">
      <div className="container mx-auto px-4 py-6 grid gap-6">
        {/* Profile hero card */}
        <section className="card-surface overflow-hidden">
          <div className="section-header px-4 py-3">
            <h3 className="font-semibold">@{profile.username}</h3>
          </div>
          <div className="p-4 space-y-2">
            {profile.name ? <p className="font-medium">{profile.name}</p> : null}
            {profile.bio ? <p className="text-sm text-base-content">{profile.bio}</p> : null}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Bio & Details">
            {profile.bio ? <p className="text-sm">{profile.bio}</p> : <p className="text-sm">No bio yet.</p>}
          </Section>

          <Section title="My Links">
            {links.length ? (
              <ul className="list-disc pl-4 space-y-1">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      className="link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No links yet.</p>
            )}
          </Section>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Section title="Referral Links">
            {referralLinks && referralLinks.length ? (
              <ul className="list-disc pl-4 space-y-1">
                {referralLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      className="link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No referral links.</p>
            )}
          </Section>

          <Section title="Connect & Collaborate">
            <p className="text-sm">Coming soon</p>
          </Section>

          <Section title="Collaborative Spotlight">
            <p className="text-sm">No spotlight projects.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

