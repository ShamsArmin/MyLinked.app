import { useQuery } from '@tanstack/react-query'
import { useParams } from 'wouter'
import Section from '@/components/Section'
import { usePlatformIcons } from '@/hooks/use-platform-icons'
import { ExternalLink, Globe, Link as LinkIcon, GitBranch, MessageCircle, MapPin, Briefcase, TrendingUp, User } from 'lucide-react'
import React from 'react'

interface PublicProfileData {
  profile: {
    id: number
    username: string
    name: string
    email: string
    bio: string
    profileImage?: string
    profileBackground?: string
    theme?: string
    location?: string
    industry?: string
    socialScore?: number
  }
  links: Array<{
    id: number
    platform: string
    title: string
    url: string
    clicks: number
    views: number
  }>
  spotlightProjects?: Array<{
    id: number
    title: string
    description: string
    projectUrl?: string
  }>
  referralLinks?: Array<{
    id: number
    title: string
    url: string
    description?: string
  }>
}

export default function PublicProfile() {
  const { username } = useParams()
  const { getPlatformConfig } = usePlatformIcons()

  const { data, isLoading, error } = useQuery<PublicProfileData>({
    queryKey: ['/api/profile', username],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${username}`)
      if (!response.ok) throw new Error('Profile not found')
      return response.json()
    },
    enabled: !!username,
  })

  if (isLoading) {
    return (
      <div className="page-surface flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-surface flex items-center justify-center">
        <p>Profile not found.</p>
      </div>
    )
  }

  const { profile, links, referralLinks, spotlightProjects } = data

  return (
    <div className="page-surface">
      <div className="container mx-auto px-4 py-6 grid gap-6">
        {/* Profile hero */}
        <section className="card-surface overflow-hidden">
          <div className="section-header px-4 py-3">
            <h3 className="font-semibold">@{profile.username}</h3>
          </div>
          <div className="p-4 flex items-center gap-4">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-content text-2xl font-bold">
                {profile.name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{profile.name}</h2>
              {profile.bio && <p className="text-sm mb-2">{profile.bio}</p>}
              <div className="flex flex-wrap gap-2 text-sm">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {profile.industry}
                  </span>
                )}
                {profile.socialScore !== undefined && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {profile.socialScore}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title={<div className="flex items-center gap-2"><User className="h-5 w-5" /> Bio & Details</div>}>
            <p>{profile.bio || 'No bio available.'}</p>
          </Section>

          {links && links.length > 0 && (
            <Section title={<div className="flex items-center gap-2"><Globe className="h-5 w-5" /> My Links</div>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {links.map(link => {
                  const platform = getPlatformConfig(link.platform)
                  const Icon = platform.icon
                  return (
                    <button
                      key={link.id}
                      className="btn btn-outline flex items-center gap-2 justify-start"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      {Icon && <Icon className="h-5 w-5" style={{ color: platform.color }} />}
                      <span className="truncate">{link.title}</span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {referralLinks && referralLinks.length > 0 && (
            <Section title={<div className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Referral Links</div>}>
              <div className="space-y-3">
                {referralLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{link.title}</p>
                      {link.description && (
                        <p className="text-sm truncate">{link.description}</p>
                      )}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title={<div className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Connect & Collaborate</div>}>
            <p>Interested in working with {profile.name}? Reach out and start a conversation!</p>
            <button className="btn btn-primary mt-4" onClick={() => window.location.href = `mailto:${profile.email}`}>Contact</button>
          </Section>

          {spotlightProjects && spotlightProjects.length > 0 && (
            <Section title={<div className="flex items-center gap-2"><GitBranch className="h-5 w-5" /> Collaborative Spotlight</div>}>
              <div className="space-y-4">
                {spotlightProjects.map(project => (
                  <div key={project.id} className="p-3 rounded border border-base-300">
                    <h4 className="font-semibold">{project.title}</h4>
                    <p className="text-sm mb-2">{project.description}</p>
                    {project.projectUrl && (
                      <button className="btn btn-sm btn-outline" onClick={() => window.open(project.projectUrl!, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
