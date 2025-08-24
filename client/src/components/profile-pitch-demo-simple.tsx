import React, { useState } from 'react';
import { ProfilePitchView } from './profile-pitch-view';
import { Button } from '@/components/ui/button';
import { Briefcase, ExternalLink } from 'lucide-react';

export function ProfilePitchDemoSimple() {
  const [showDemo, setShowDemo] = useState(false);
  
  // Demo data
  const demoProfile = {
    id: 1,
    username: 'professional',
    password: '',
    name: 'Alex Johnson',
    bio: 'Professional web developer with 5+ years of experience in creating responsive and user-friendly websites.',
    profileImage: null,
    profileBackground: null,
    font: 'inter',
    theme: 'blue',
    viewMode: 'list',
    darkMode: false,
    welcomeMessage: null,
    socialScore: 85,
    isCollaborative: false,
    collaborators: [],
    pitchMode: true,
    pitchDescription: "I am a web developer passionate about creating intuitive digital experiences",
    profession: 'Web Developer',
    interests: [],
    createdAt: null
  };
  
  const demoLinks = [
    {
      id: 1,
      userId: 1,
      platform: 'portfolio',
      title: 'My Portfolio',
      url: 'https://example.com/portfolio',
      clicks: 156,
      views: 432,
      featured: true,
      order: 1,
      aiScore: 95,
      createdAt: null
    },
    {
      id: 2,
      userId: 1,
      platform: 'linkedin',
      title: 'LinkedIn Profile',
      url: 'https://linkedin.com/in/example',
      clicks: 87,
      views: 203,
      featured: true,
      order: 2,
      aiScore: 90,
      createdAt: null
    },
    {
      id: 3,
      userId: 1,
      platform: 'github',
      title: 'GitHub Projects',
      url: 'https://github.com/example',
      clicks: 92,
      views: 178,
      featured: false,
      order: 3,
      aiScore: 85,
      createdAt: null
    },
    {
      id: 4,
      userId: 1,
      platform: 'dribbble',
      title: 'Design Portfolio',
      url: 'https://dribbble.com/example',
      clicks: 64,
      views: 125,
      featured: false,
      order: 4,
      aiScore: 75,
      createdAt: null
    }
  ];
  
  if (showDemo) {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="secondary" 
            onClick={() => setShowDemo(false)}
            className="flex items-center gap-2"
          >
            <span>Exit Demo</span>
            <ExternalLink size={16} />
          </Button>
        </div>
        <ProfilePitchView profile={demoProfile} links={demoLinks} />
      </div>
    );
  }
  
  return (
    <div className="p-8 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold">See Pitch Mode in Action</h3>
        
        <p className="text-base-content/70 max-w-md mx-auto">
          Experience how your profile would look in Pitch Mode - a professional layout 
          optimized for pitching your work to clients, employers, or collaborators.
        </p>
        
        <Button 
          size="lg" 
          onClick={() => setShowDemo(true)}
          className="mt-4"
        >
          View Pitch Mode Demo
        </Button>
      </div>
    </div>
  );
}