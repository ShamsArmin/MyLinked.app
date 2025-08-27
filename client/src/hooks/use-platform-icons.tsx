import { FC } from "react";
import {
  SiInstagram,
  SiX,
  SiLinkedin,
  SiYoutube,
  SiTiktok,
  SiFacebook,
  SiWhatsapp,
  SiTelegram,
  SiGithub,
  SiPinterest,
  SiSpotify,
  SiSoundcloud,
  SiTwitch,
  SiMedium,
  SiEtsy,
} from "react-icons/si";
import { 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  Calendar, 
  Link as LinkIcon,
  ShoppingCart 
} from "lucide-react";

export type PlatformIconProps = {
  className?: string;
};

export type PlatformConfig = {
  name: string;
  icon: FC<PlatformIconProps>;
  color: string;
  bgColor: string;
};

export const platformConfigs: Record<string, PlatformConfig> = {
  instagram: {
    name: "Instagram",
    icon: SiInstagram,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  x: {
    name: "X",
    icon: SiX,
    color: "text-black",
    bgColor: "bg-gray-100",
  },
  twitter: {
    name: "X",
    icon: SiX,
    color: "text-black", 
    bgColor: "bg-gray-100",
  },
  linkedin: {
    name: "LinkedIn",
    icon: SiLinkedin,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  youtube: {
    name: "YouTube",
    icon: SiYoutube,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  tiktok: {
    name: "TikTok",
    icon: SiTiktok,
    color: "text-black",
    bgColor: "bg-gray-100",
  },
  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  telegram: {
    name: "Telegram",
    icon: SiTelegram,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  github: {
    name: "GitHub",
    icon: SiGithub,
    color: "text-gray-800",
    bgColor: "bg-gray-100",
  },
  pinterest: {
    name: "Pinterest",
    icon: SiPinterest,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  spotify: {
    name: "Spotify",
    icon: SiSpotify,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  soundcloud: {
    name: "SoundCloud",
    icon: SiSoundcloud,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  twitch: {
    name: "Twitch",
    icon: SiTwitch,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  medium: {
    name: "Medium",
    icon: SiMedium,
    color: "text-gray-800",
    bgColor: "bg-gray-100",
  },
  etsy: {
    name: "Etsy",
    icon: SiEtsy,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  email: {
    name: "Email",
    icon: Mail,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  phone: {
    name: "Phone",
    icon: Phone,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  website: {
    name: "Website",
    icon: Globe,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  portfolio: {
    name: "Portfolio",
    icon: Briefcase,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  calendar: {
    name: "Calendar",
    icon: Calendar,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  store: {
    name: "Store",
    icon: ShoppingCart,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  custom: {
    name: "Custom Link",
    icon: LinkIcon,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};

export const getPlatformConfig = (platform: string): PlatformConfig => {
  const key = platform?.toLowerCase() || '';
  return platformConfigs[key] || platformConfigs.custom;
};

export const platformOptions = Object.entries(platformConfigs).map(([key, config]) => ({
  value: key,
  label: config.name,
}));

export const getPlatformIcon = (platform: string, className?: string) => {
  const config = getPlatformConfig(platform);
  const IconComponent = config.icon;
  return <IconComponent className={className} />;
};

export const usePlatformIcons = () => {
  return {
    getPlatformConfig,
    getPlatformIcon,
    platformOptions,
  };
};
