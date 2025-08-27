import React from 'react';
import { getPlatformConfig } from '@/hooks/use-platform-icons';

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
}

export function PlatformIcon({ platform, size = 24, className = '' }: PlatformIconProps) {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;

  return <Icon size={size} className={`${config.color} ${className}`} />;
}