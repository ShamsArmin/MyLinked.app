import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, insertLinkSchema, ProfileStats } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
// import { OptimizeLinksSection } from "@/components/optimize-links-section"; // Temporarily disabled
import { TourGuide } from "@/components/tour-guide";
import { useTour } from "@/hooks/use-tour";

import QRCode from "qrcode";

// Feature flags
const FEATURE_CONTENT_PREVIEW = false; // Set to true to re-enable Content Preview feature
const FEATURE_BRANDING = import.meta.env.VITE_FEATURE_BRANDING === "true"; // AI Branding temporarily disabled for MVP
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  MessageSquare,
  Bell,
  Eye,
  MousePointer,
  Settings,
  User,
  BarChart4,
  FileText,
  Share2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  GitBranch,
  Activity,
  Linkedin,
  Twitter,
  Facebook,
  Github,
  Instagram,
  ArrowRight,
  Youtube,
  Figma,
  Mail,
  Globe,
  Grid,
  List,
  LayoutGrid,
  Award,
  Shuffle,
  Brain,
  Sparkles,
  LogOut,
  Palette,
  Star,
  Presentation,
  Zap,
  LineChart,
  Paintbrush,
  Rss,
  PanelTop,
  LayoutList,
  BookOpen,
  Briefcase,
  ImageIcon,
  RefreshCw,
  Users,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SpotlightCard } from "@/components/spotlight-card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extended Zod schema for link forms
const linkFormSchema = insertLinkSchema.extend({
  platform: z.string().min(1, "Please select a platform"),
  title: z.string().min(1, "Title is required"),
  url: z.string().min(1, "URL is required")
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

// Platform options with icons
const platformOptions = [
  { value: "twitter", label: "X", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>, color: "#000000" },
  { value: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, color: "#E1306C" },
  { value: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, color: "#0077B5" },
  { value: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" />, color: "#1877F2" },
  { value: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" />, color: "#FF0000" },
  { value: "tiktok", label: "TikTok", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>, color: "#000000" },
  { value: "github", label: "GitHub", icon: <Github className="h-4 w-4" />, color: "#333" },
  { value: "figma", label: "Figma", icon: <Figma className="h-4 w-4" />, color: "#F24E1E" },
  { value: "behance", label: "Behance", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7.443 5.35c.639 0 1.23.05 1.77.198.546.149.956.347 1.318.693.334.298.639.744.785 1.235.146.495.197 1.089.197 1.726 0 .794-.197 1.438-.541 1.938-.346.5-.887.897-1.625 1.244.986.297 1.672.793 2.168 1.487.494.694.69 1.532.69 2.572 0 .839-.148 1.54-.399 2.184a3.76 3.76 0 0 1-1.094 1.486c-.494.347-1.084.642-1.723.799a8.675 8.675 0 0 1-2.119.248H0V5.35h7.443Zm-.394 5.54c.591 0 1.084-.149 1.426-.448.346-.298.492-.744.492-1.388 0-.347-.049-.644-.098-.893-.1-.199-.249-.397-.45-.497a1.587 1.587 0 0 0-.69-.247c-.296-.05-.59-.05-.934-.05H3.258v3.523h3.79Zm.197 5.839c.395 0 .739-.049 1.084-.099a2.4 2.4 0 0 0 .739-.297c.197-.149.394-.347.492-.645.099-.298.197-.644.197-1.09 0-.89-.246-1.533-.69-1.93-.442-.396-1.083-.594-1.919-.594H3.258v4.654h3.988Zm9.978-1.681c.345.347.837.545 1.478.545.441 0 .837-.099 1.133-.346.345-.198.541-.495.639-.792h2.119c-.347 1.09-.887 1.88-1.626 2.375-.738.495-1.625.693-2.659.693-.738 0-1.379-.099-1.971-.347a4.218 4.218 0 0 1-1.479-1.038 4.706 4.706 0 0 1-.934-1.584c-.197-.644-.345-1.337-.345-2.13 0-.742.099-1.436.345-2.081.246-.644.591-1.188 1.035-1.632a4.62 4.62 0 0 1 1.577-1.04c.59-.247 1.28-.296 2.02-.296.837 0 1.528.149 2.168.546.59.346 1.084.84 1.43 1.436.344.594.59 1.287.69 2.031.099.744.099 1.485.049 2.233h-6.358c0 .694.197 1.336.542 1.729Zm2.56-4.704c-.294-.346-.788-.594-1.379-.594-.394 0-.738.099-1.034.247-.246.148-.443.346-.59.594-.148.198-.246.446-.295.693-.049.198-.049.396-.049.595h3.937c-.148-.643-.345-1.188-.59-1.535Zm-3.602-4.11h4.924v1.486h-4.924V6.233Z"/></svg>, color: "#053EFF" },
  { value: "dribbble", label: "Dribbble", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm7.978 5.541a10.17 10.17 0 0 1 2.321 6.31c-.339-.064-3.727-.693-7.139-.301-.077-.19-.154-.376-.23-.563-2.218.707-4.612 1.13-7.126 1.189.005-.08.01-.158.015-.238 0-.045.002-.091.007-.136a81.86 81.86 0 0 0 1.735-3.843c4.439-1.831 6.444-4.399 6.444-4.399a10.196 10.196 0 0 1 3.973 1.981zm-12.094-.364c.08.08.158.16.238.241-.08-.081-.158-.161-.238-.24v-.001zm2.29-2.32a10.221 10.221 0 0 1 5.662-.337c-.125.162-2.974 2.617-6.958 4.145-.69-1.333-1.403-2.663-2.118-4.014a10.217 10.217 0 0 1 3.414-3.794zm-3.874 1.56c.697 1.322 1.406 2.639 2.115 3.965-2.963.845-6.206.955-8.4.832A10.24 10.24 0 0 1 6.3 4.417zM1.644 12c0-.1.002-.2.006-.303 1.904.033 5.958-.118 9.412-1.104.263.507.513 1.014.753 1.52-3.395.926-5.28 3.498-6.535 5.872A10.183 10.183 0 0 1 1.644 12zm7.541 7.826a10.175 10.175 0 0 1-4.625-3.141c.957-1.814 2.86-4.18 6.328-5.264 1.566 4.078 2.213 7.5 2.383 8.465a10.216 10.216 0 0 1-4.086-.06zm6.188-1.104c-.168-.921-.767-4.184-2.228-8.177a.625.625 0 0 1-.025-.063h.026c3.136-.39 5.894.343 6.285.43a10.198 10.198 0 0 1-4.058 7.81z"/></svg>, color: "#EA4C89" },
  { value: "discord", label: "Discord", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>, color: "#5865F2" },
  { value: "pinterest", label: "Pinterest", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12Z"/></svg>, color: "#E60023" },
  { value: "medium", label: "Medium", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>, color: "#000000" },
  { value: "snapchat", label: "Snapchat", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.327-.177.476-.264a.25.25 0 0 1 .12-.038c.129 0 .267.13.267.331 0 .762-1.554 1.538-1.866 1.538-.072 0-.147-.007-.22-.02a.3.3 0 0 0-.105-.007c-.146.015-.278.15-.333.307-.145.361-.297.73-.452 1.095-.855 1.944-1.614 3.363-2.768 3.363-.289 0-.592-.057-.917-.197-1.032-.449-1.358-.814-1.736-1.304l-.009-.012c-.254-.332-.571-.747-1.207-.747h-.05c-.371 0-.827.117-1.227.337-.359.197-.61.415-.841.623l-.065.06a6.334 6.334 0 0 1-.25.239.29.29 0 0 1-.195.075c-.227 0-.45-.24-.45-.472 0-.209.133-.428.224-.628a3.93 3.93 0 0 0 .126-.232l.05-.097c.02-.038.034-.067.044-.094a.973.973 0 0 0 .102-.527c-.16-1.118-.241-2.286-.241-3.578 0-.09-.015-.182-.046-.266-.73-1.801-3.394-2.283-3.858-2.323a.21.21 0 0 1-.043-.031.183.183 0 0 1-.051-.132c0-.088.073-.172.191-.198 1.04-.169 1.976-.35 2.742-.6C8.87 1.854 10.11.793 12.207.793z"/></svg>, color: "#FFFC00" },
  { value: "twitch", label: "Twitch", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43Z"/></svg>, color: "#9146FF" },
  { value: "spotify", label: "Spotify", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>, color: "#1DB954" },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" />, color: "#4CAF50" },
  { value: "whatsapp", label: "WhatsApp", icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>, color: "#25D366" },
  { value: "website", label: "Website", icon: <Globe className="h-4 w-4" />, color: "#6200EA" },
  { value: "custom", label: "Custom Link", icon: <FileText className="h-4 w-4" />, color: "#9C27B0" },
];

// Get platform icon
function getPlatformIcon(platform: string) {
  const platformOption = platformOptions.find(p => p.value === platform);
  return platformOption ? platformOption.icon : <Globe className="h-4 w-4" />;
}

// Get platform color
function getPlatformColor(platform: string) {
  const platformOption = platformOptions.find(p => p.value === platform);
  return platformOption ? platformOption.color : "#6200EA";
}

// Link Card Component
function LinkCard({ 
  link, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onFeature, 
  onOptimize
}: { 
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onFeature: (id: number) => void;
  onOptimize: (link: Link) => void;
}) {
  return (
    <Card className="relative overflow-visible border">
      {link.featured && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-bl-md">
            Featured
          </div>
        </div>
      )}
      
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-4 min-w-0">
          <div className="flex items-center min-w-0 flex-1">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3" 
              style={{ backgroundColor: `${getPlatformColor(link.platform)}20` }} 
            >
              {getPlatformIcon(link.platform)}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-card-foreground truncate">{link.title}</h3>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-muted-foreground hover:underline truncate max-w-full inline-block"
              >
                {link.url}
              </a>
            </div>
          </div>
          
          <div className="flex items-center flex-shrink-0 z-10">
            {/* AI Score indicator */}
            {link.aiScore !== null && (
              <div className="mr-2 flex items-center" title="Content Quality Score">
                <div className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center relative">
                  <span className="text-xs font-medium">{link.aiScore}</span>
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-transparent"
                    style={{ 
                      borderTopColor: link.aiScore > 70 ? "#10b981" : link.aiScore > 40 ? "#f59e0b" : "#ef4444",
                      transform: "rotate(-45deg)"
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Clearly visible 3-dots menu with background */}
            <div className="relative z-30">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background hover:bg-muted rounded-md border-muted">
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(link)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOptimize(link)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Optimize Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFeature(link.id)}>
                    {link.featured ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Unfeature
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Feature
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMoveUp(link.id)}>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Move Up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveDown(link.id)}>
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Move Down
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(link.id)} 
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {link.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {link.description}
          </p>
        )}
        
        <div className="mt-3 flex flex-col">
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{link.views || 0} views</span>
            <span className="mx-2 flex-shrink-0">•</span>
            <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{link.clicks || 0} clicks</span>
          </div>
        </div>
        
        <div className="mt-0">
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block w-full text-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
          >
            Visit Link <ArrowRight className="h-3 w-3 ml-1 inline" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// View Mode Selector Component
function ViewModeSelector({ 
  currentMode, 
  onModeChange 
}: { 
  currentMode: string; 
  onModeChange: (mode: string) => void 
}) {
  return (
    <Tabs defaultValue="list" value={currentMode} onValueChange={onModeChange}>
      <TabsList className="grid grid-cols-4 w-[320px]">
        <TabsTrigger value="list" className="flex items-center">
          <LayoutList className="h-4 w-4 mr-2" />
          <span>List</span>
        </TabsTrigger>
        <TabsTrigger value="grid" className="flex items-center">
          <LayoutGrid className="h-4 w-4 mr-2" />
          <span>Grid</span>
        </TabsTrigger>
        <TabsTrigger value="story" className="flex items-center">
          <BookOpen className="h-4 w-4 mr-2" />
          <span>Story</span>
        </TabsTrigger>

      </TabsList>
    </Tabs>
  );
}

// Profile feed item that displays content from the user's social media
function ProfileFeedItem({
  platform,
  url,
  content,
  image,
  likes,
  comments,
  date,
}: {
  platform: string;
  url: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  date: string;
}) {
  // Handle feed item click - open the user's actual profile URL
  const handleFeedClick = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      className="border rounded-md p-3 mb-2 cursor-pointer hover:bg-secondary/10 transition-colors"
      onClick={handleFeedClick}
    >
      <div className="flex items-center mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
          style={{ backgroundColor: `${getPlatformColor(platform)}20` }}
        >
          {getPlatformIcon(platform)}
        </div>
        <div>
          <div className="font-medium text-sm">
            {platform === 'twitter' ? 'Your X' : platform === 'instagram' ? 'Your Instagram' : 'Your Post'}
          </div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
      </div>
      
      <p className="text-sm mb-2">{content}</p>
      
      {image && (
        <div className="rounded-md overflow-hidden mb-2 bg-muted h-32 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Heart className="h-3 w-3 mr-1" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="h-3 w-3 mr-1" />
            <span>{comments}</span>
          </div>
        </div>
        <div className="text-primary text-xs">
          Open in {platform === 'twitter' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1)}
        </div>
      </div>
    </div>
  );
}

// Smart Link AI component
function SmartLinkAI({ links, onApplySuggestions }: { links: Link[], onApplySuggestions: (linkScores: {id: number, score: number}[]) => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{ linkScores: { id: number; score: number }[]; insights: string[] } | null>(null);
  
  // Mock function to simulate AI analysis
  const analyzeLinks = async () => {
    setAnalyzing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock insights
    const mockInsights = [
      "Your X (formerly Twitter) link has the highest engagement rate at 4.2%.",
      "Instagram followers engage more with your content on weekends.",
      "LinkedIn connections click your profile 32% more often than other platforms.",
      "Consider featuring your GitHub repository more prominently for tech audiences.",
    ];
    
    // Generate mock scores biased toward higher CTRs
    const mockScores = links.map(link => ({
      id: link.id,
      score: Math.max(40, 
        Math.min(95, 
          (link.clicks || 0) * 5 + 
          (link.featured ? 10 : 0) + 
          (link.platform === 'linkedin' ? 15 : 0) +
          ((link.platform === 'twitter' || link.platform === 'x') ? 12 : 0) +
          Math.floor(Math.random() * 20)
        )
      )
    }));
    
    setSuggestions({
      linkScores: mockScores,
      insights: mockInsights
    });
    
    setAnalyzing(false);
  };
  
  return (
    <Card className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
        <CardTitle className="flex items-center text-lg font-semibold text-foreground">
          <Brain className="h-5 w-5 mr-2 text-indigo-500" />
          Smart Link AI
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Let AI analyze your engagement data and suggest the optimal order for your links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <div>
            <p className="text-sm mb-4">
              Our AI will analyze clicks, views, and user behavior to suggest the best order for your links to maximize engagement.
            </p>
            <Button 
              onClick={analyzeLinks}
              className="w-full" 
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Smart Analysis
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-primary/5 p-3 border">
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                AI Insights
              </h4>
              <ul className="space-y-2">
                {suggestions.insights.map((insight, index) => (
                  <li key={index} className="text-xs flex items-start">
                    <div className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] mr-2 mt-0.5">
                      {index + 1}
                    </div>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Suggested Link Order</h4>
              <div className="space-y-2 mb-3">
                {suggestions.linkScores
                  .sort((a, b) => b.score - a.score)
                  .map((item, index) => {
                    const link = links.find(l => l.id === item.id);
                    if (!link) return null;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-md p-2">
                        <div className="flex items-center">
                          <div className="bg-muted w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </div>
                          <div 
                            className="w-6 h-6 rounded-full mr-2 flex items-center justify-center"
                            style={{ backgroundColor: `${getPlatformColor(link.platform)}20` }}
                          >
                            {getPlatformIcon(link.platform)}
                          </div>
                          <span className="text-sm font-medium">{link.title}</span>
                        </div>
                        <div className="text-xs flex items-center">
                          <div className="w-8 h-4 bg-muted rounded-full overflow-hidden mr-2">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${item.score}%`,
                                backgroundColor: item.score > 70 ? "#10b981" : item.score > 40 ? "#f59e0b" : "#ef4444"
                              }}
                            ></div>
                          </div>
                          <span>{item.score}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              <Button 
                onClick={() => onApplySuggestions(suggestions.linkScores)}
                variant="default"
                size="sm"
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Suggested Order
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



// Pitch Mode Settings Card component
function PitchModeCard() {
  const [, navigate] = useLocation();
  
  return (
    <Card id="pitch-mode" className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
        <div className="flex items-center">
          <Presentation className="h-5 w-5 mr-2 text-blue-600" />
          <CardTitle className="text-foreground">Pitch Mode</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Transform your profile for different audiences
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="text-center">
            <Presentation className="h-12 w-12 mx-auto mb-3 text-blue-500" />
            <p className="text-sm text-muted-foreground mb-4">
              Configure your pitch mode settings to optimize your profile for professional presentations, networking, and client meetings.
            </p>
          </div>
          
          <Button
            onClick={() => navigate("/settings?tab=pitch-mode")}
            className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Pitch Mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MoreVerticalIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

export default function AIEnhancedDashboard() {
  const { toast } = useToast();
  
  // Tour Guide
  const { showTour, completeTour, skipTour } = useTour();
  
  // State
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [showEditLinkDialog, setShowEditLinkDialog] = useState(false);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [currentOptimizeLink, setCurrentOptimizeLink] = useState<Link | null>(null);
  
  // This state tracks whether we've checked for the optimize dialog flag
  const [checkedOptimize, setCheckedOptimize] = useState(false);

  // Check if we should show optimize section based on navigation from social score page
  useEffect(() => {
    // Only run once
    if (!checkedOptimize) {
      const shouldShowOptimize = sessionStorage.getItem('showOptimizeDialog');
      if (shouldShowOptimize === 'true') {
        // Clear the flag first
        sessionStorage.removeItem('showOptimizeDialog');
        // Show the optimize section instead of a dialog
        setShowOptimizeSection(true);
        setCheckedOptimize(true);
      }
    }
  }, [checkedOptimize]);
  
  // Add these missing variables that were causing the blank screen
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  
  // For the view mode toggle
  const [viewMode, setViewMode] = useState<string>("list");
  
  // Flag to show the optimization section
  const [showOptimizeSection, setShowOptimizeSection] = useState(false);
  
  // Handle view mode change with explicit rerender
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
    // Simple state change is enough, no need to requery
    console.log("Switched to view mode:", mode);
  };
  
  // Handle optimize link selection - opens the optimize dialog for a specific link
  const handleOptimizeLink = (link: Link) => {
    setCurrentOptimizeLink(link);
    setShowOptimizeDialog(true);
  };
  
  // For profile management
  const [selectedMessageType, setSelectedMessageType] = useState<string>("text");
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("minimal");
  const [showWelcomeMessageDialog, setShowWelcomeMessageDialog] = useState(false);
  
  // For QR code
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isGeneratingQRCode, setIsGeneratingQRCode] = useState(false);
  const qrCodeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get authenticated user
  const { user: userData } = useAuth();
  
  const [, navigate] = useLocation();
  
  // Get all links
  const {
    data: fetchedLinks = [],
    isLoading: isLoadingLinks,
  } = useQuery<Link[]>({
    queryKey: ["/api/links"],
    enabled: !!userData,
  });
  
  // Sort links by order for display - this ensures the "Apply Suggested Order" works visibly in all view modes
  const links = useMemo(() => {
    return [...fetchedLinks].sort((a, b) => {
      // First prioritize featured links
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Then sort by order or aiScore - lower order comes first
      const aOrder = a.order !== null && a.order !== undefined ? a.order : Infinity;
      const bOrder = b.order !== null && b.order !== undefined ? b.order : Infinity;
      return aOrder - bOrder;
    });
  }, [fetchedLinks]);
  
  // Get social connections
  const { data: socialConnections = [], refetch: refetchConnections } = useQuery<any[]>({
    queryKey: ["/api/social/connections"],
    enabled: !!userData,
  });

  // Content Preview queries for all platforms
  const { data: instagramPreview, isLoading: isLoadingInstagram } = useQuery<any>({
    queryKey: ["/api/content-preview/instagram"],
    enabled: !!userData,
    retry: false,
  });

  const { data: facebookPreview, isLoading: isLoadingFacebook } = useQuery<any>({
    queryKey: ["/api/content-preview/facebook"],
    enabled: !!userData,
    retry: false,
  });

  const { data: twitterPreview, isLoading: isLoadingTwitter } = useQuery<any>({
    queryKey: ["/api/content-preview/twitter"],
    enabled: !!userData,
    retry: false,
  });

  const { data: tiktokPreview, isLoading: isLoadingTikTok } = useQuery<any>({
    queryKey: ["/api/content-preview/tiktok"],
    enabled: !!userData,
    retry: false,
  });

  // Helper function to check if a platform is connected
  const isConnected = (platform: string) => {
    return Array.isArray(socialConnections) && socialConnections.some((conn: any) => conn.platform === platform);
  };

  // Helper function to get connection info
  const getConnection = (platform: string) => {
    return Array.isArray(socialConnections) ? socialConnections.find((conn: any) => conn.platform === platform) : null;
  };

  // Get user stats
  const {
    data: stats,
    isLoading: isLoadingStats
  } = useQuery<ProfileStats>({
    queryKey: ["/api/stats"],
    enabled: !!userData,
  });

  // Note: Referral requests are now handled through the comprehensive notification system

  // Get notifications for dashboard
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!userData,
  });

  // Mark notification as read mutation
  const markNotificationAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      console.error("Failed to mark notification as read:", error);
    },
  });

  // Accept referral request mutation
  const acceptReferralMutation = useMutation({
    mutationFn: async ({ requestId, notificationId }: { requestId: number; notificationId: string }) => {
      // Update request status to approved (matches referral links page expectation)
      await apiRequest("PATCH", `/api/referral-requests/${requestId}/status`, {
        status: "approved"
      });
      
      // Delete the notification
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referral-requests'] });
      toast({
        title: "Request accepted",
        description: "The referral request has been accepted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Decline referral request mutation
  const declineReferralMutation = useMutation({
    mutationFn: async ({ requestId, notificationId }: { requestId: number; notificationId: string }) => {
      // Update request status to rejected (matches referral links page expectation)
      await apiRequest("PATCH", `/api/referral-requests/${requestId}/status`, {
        status: "rejected"
      });
      
      // Delete the notification
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referral-requests'] });
      toast({
        title: "Request declined",
        description: "The referral request has been declined.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decline request",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // We no longer need this effect as we'll show all links in the optimization section
  // The user can choose which specific link to optimize
  
  // Effect for generating QR code when share options are shown
  useEffect(() => {
    if (showShareOptions && qrCodeCanvasRef.current) {
      const generateQRCode = () => {
        setIsGeneratingQRCode(true);
        const profileUrl = `https://www.mylinked.app/${userData?.username || 'me'}`; // Keep full URL for QR code functionality
        
        try {
          QRCode.toCanvas(
            qrCodeCanvasRef.current, 
            profileUrl,
            { 
              width: 180,
              margin: 1,
              color: {
                dark: '#000',
                light: '#fff'
              }
            },
            (error) => {
              if (error) {
                console.error("QR code generation error:", error);
              } else {
                setQrCodeUrl(profileUrl);
              }
              setIsGeneratingQRCode(false);
            }
          );
        } catch (err) {
          console.error("QR code generation failed:", err);
          setIsGeneratingQRCode(false);
        }
      };
      
      // Add a small delay to ensure the canvas is fully mounted
      const timer = setTimeout(generateQRCode, 300);
      return () => clearTimeout(timer);
    }
  }, [showShareOptions, userData?.username]);
  
  // We already have links and isLoadingLinks from above
  // Just add error state variable
  const isErrorLinks = false;
  
  // We already have stats and isLoadingStats from above - just add error state
  const isErrorStats = false;
  
  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (data: LinkFormValues) => {
      return await apiRequest("POST", "/api/links", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setShowAddLinkDialog(false);
      toast({
        title: "Link added",
        description: "Your link has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Link> }) => {
      const response = await apiRequest("PATCH", `/api/links/${id}`, data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setShowEditLinkDialog(false);
      toast({
        title: "Link updated",
        description: "Your link has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/links/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete link");
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link deleted",
        description: "Your link has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle applying AI suggestions for optimal link order
  const handleApplySuggestions = async (linkScores: {id: number, score: number}[]) => {
    try {
      // Sort linkScores by score in descending order and update each link's order
      const sortedScores = linkScores.sort((a, b) => b.score - a.score);
      
      // Update each link with its new order
      const updatePromises = sortedScores.map((item, index) => 
        updateLinkMutation.mutateAsync({ 
          id: item.id, 
          data: { order: index } 
        })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Link order optimized",
        description: "Your links have been reordered based on AI suggestions to maximize engagement.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to apply suggestions",
        description: error.message || "An error occurred while optimizing link order.",
        variant: "destructive",
      });
    }
  };
  
  // Feature link mutation
  const featureLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const link = links.find((l) => l.id === id);
      if (!link) throw new Error("Link not found");
      
      const response = await apiRequest("PATCH", `/api/links/${id}`, {
        featured: !link.featured,
      });
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link updated",
        description: "Featured status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reorder links mutation
  const reorderLinksMutation = useMutation({
    mutationFn: async (linkScores: { id: number; score: number }[]) => {
      const response = await apiRequest("POST", "/api/links/reorder", { linkScores });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Links reordered",
        description: "Your links have been reordered successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reorder links",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle moving links up/down
  const handleMoveLink = (id: number, direction: 'up' | 'down') => {
    // Find the link and its current index
    const linkIndex = links.findIndex(l => l.id === id);
    if (linkIndex === -1) return;
    
    // Determine the new index based on direction
    let newIndex = linkIndex;
    if (direction === 'up' && linkIndex > 0) {
      newIndex = linkIndex - 1;
    } else if (direction === 'down' && linkIndex < links.length - 1) {
      newIndex = linkIndex + 1;
    } else {
      // No change needed
      return;
    }
    
    // Calculate scores for the reordering
    const linkScores = links.map((link, index) => {
      if (index === linkIndex) return { id: link.id, score: links[newIndex].order || 0 };
      if (index === newIndex) return { id: link.id, score: links[linkIndex].order || 0 };
      return { id: link.id, score: link.order || 0 };
    });
    
    reorderLinksMutation.mutate(linkScores);
  };
  
  // Optimize link mutation
  const optimizeLinkMutation = useMutation({
    mutationFn: ({ id, improvements }: { id: number; improvements: Partial<Link> }) =>
      apiRequest("PATCH", `/api/links/${id}/optimize`, improvements),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setShowOptimizeDialog(false);
      toast({
        title: "Link optimized",
        description: "Your link has been updated with optimized content.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to optimize link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update referral request mutation
  const updateReferralRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/referral-requests/${id}`, { status });
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referral-requests/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Request updated",
        description: "The referral request has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add Link form
  const addLinkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform: "",
      title: "",
      url: "",
      description: "",
    },
  });
  
  // Extract form methods for the add link form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = addLinkForm;
  
  // Edit Link form
  const editLinkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform: "",
      title: "",
      url: "",
      description: "",
    },
  });
  
  // Handle form submissions
  const onAddLinkSubmit = (data: LinkFormValues) => {
    // Special handling for email platform
    if (data.platform === 'email' && data.url && !data.url.startsWith('mailto:') && data.url.includes('@')) {
      data.url = `mailto:${data.url}`;
    }
    
    // Make sure URLs for non-email/custom platforms have http/https prefix
    if (data.platform !== 'email' && data.platform !== 'custom' && data.url) {
      if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
        data.url = `https://${data.url}`;
      }
    }
    
    createLinkMutation.mutate(data);
    
    // Reset form after submission
    reset({
      platform: "",
      title: "",
      url: "",
      description: "",
    });
  };
  
  // Alias for backward compatibility
  const onSubmit = onAddLinkSubmit;
  
  const onEditLinkSubmit = (data: LinkFormValues) => {
    if (currentLink) {
      // Special handling for email platform
      if (data.platform === 'email' && data.url && !data.url.startsWith('mailto:') && data.url.includes('@')) {
        data.url = `mailto:${data.url}`;
      }
      
      // Make sure URLs for non-email/custom platforms have http/https prefix
      if (data.platform !== 'email' && data.platform !== 'custom' && data.url) {
        if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
          data.url = `https://${data.url}`;
        }
      }
      
      updateLinkMutation.mutate({
        id: currentLink.id,
        data: data,
      });
    }
  };
  
  // Profile update handlers
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('profileImage', file);
    
    // Set loading state
    setIsUploadingImage(true);
    
    // For development purposes, we'll create an object URL instead of a real upload
    const imageUrl = URL.createObjectURL(file);
    
    // Update the profile with the image URL
    updateProfileMutation.mutate(
      { profileImage: imageUrl },
      {
        onSuccess: () => {
          setIsUploadingImage(false);
          
          // Force refresh user data to show the updated image
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          toast({
            title: "Image uploaded",
            description: "Your profile image has been updated",
          });
        },
        onError: () => {
          setIsUploadingImage(false);
          toast({
            title: "Failed to upload image",
            description: "There was an error uploading your image",
            variant: "destructive",
          });
        }
      }
    );
  };
  
  const handleRemoveProfileImage = () => {
    // Update profile to remove image
    updateProfileMutation.mutate(
      { profileImage: null },
      {
        onSuccess: () => {
          // Force refresh user data to update UI
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          toast({
            title: "Image removed",
            description: "Your profile image has been removed",
          });
        }
      }
    );
  };
  
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAudio(true);
    
    setTimeout(() => {
      updateProfileMutation.mutate({
        welcomeMessage: "Audio welcome message",
      });
      
      setIsUploadingAudio(false);
      setSelectedMessageType("audio");
      
      toast({
        title: "Audio uploaded",
        description: "Your welcome audio has been updated",
      });
    }, 1000);
  };
  
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingVideo(true);
    
    setTimeout(() => {
      updateProfileMutation.mutate({
        welcomeMessage: "Video welcome message",
      });
      
      setIsUploadingVideo(false);
      setSelectedMessageType("video");
      
      toast({
        title: "Video uploaded",
        description: "Your welcome video has been updated",
      });
    }, 1000);
  };
  
  const handleMessageTypeChange = (value: string) => {
    setSelectedMessageType(value);
    
    // Update the profile when changing message type
    updateProfileMutation.mutate({
    });
  };
  
  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    
    updateProfileMutation.mutate({
      theme: value
    });
    
    toast({
      title: "Theme updated",
      description: `Your profile theme has been changed to ${value}`,
    });
  };
  
  const handleWelcomeMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWelcomeMessage(e.target.value);
  };
  
  const saveWelcomeMessage = () => {
    if (!welcomeMessage.trim()) return;
    
    updateProfileMutation.mutate({
      welcomeMessage: welcomeMessage
    });
  };
  
  // Handle link actions
  const handleEditLink = (link: Link) => {
    setCurrentLink(link);
    editLinkForm.reset({
      platform: link.platform,
      title: link.title,
      url: link.url,
      description: link.description || "",
    });
    setShowEditLinkDialog(true);
  };
  
  const handleDeleteLink = (id: number) => {
    if (confirm("Are you sure you want to delete this link?")) {
      deleteLinkMutation.mutate(id);
    }
  };
  
  const handleMoveUp = (id: number) => {
    handleMoveLink(id, 'up');
  };
  
  const handleMoveDown = (id: number) => {
    handleMoveLink(id, 'down');
  };
  
  const handleFeatureLink = (id: number) => {
    featureLinkMutation.mutate(id);
  };
  
  // Handle optimizing content for a link
  const handleOptimizeContent = (link: Link) => {
    setCurrentOptimizeLink(link);
    setShowOptimizeDialog(true);
  };
  
  const handleOptimizeSubmit = (improvements: Partial<Link>) => {
    if (currentOptimizeLink) {
      // Use updateLinkMutation instead of optimizeLinkMutation to fix the error
      updateLinkMutation.mutate({
        id: currentOptimizeLink.id,
        data: improvements,
      });
    }
  };
  
  const applyAiSuggestions = (linkScores: {id: number, score: number}[]) => {
    reorderLinksMutation.mutate(linkScores);
  };
  
  // Mock data for the charts
  const chartData = [
    { date: 'May 1', views: 12, clicks: 5 },
    { date: 'May 2', views: 19, clicks: 8 },
    { date: 'May 3', views: 15, clicks: 7 },
    { date: 'May 4', views: 27, clicks: 12 },
    { date: 'May 5', views: 25, clicks: 10 },
    { date: 'May 6', views: 32, clicks: 14 },
    { date: 'May 7', views: 29, clicks: 13 },
  ];
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Tour Guide */}
      <TourGuide 
        isOpen={showTour}
        onComplete={completeTour}
        onSkip={skipTour}
      />
      
      {/* Dashboard Header */}
      <header className="dashboard-header bg-background/90 backdrop-blur-md border-b-2 border-border/50 shadow-lg">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <img 
              src="/assets/logo-horizontal.png" 
              alt="MyLinked" 
              className="h-8 w-auto"
              style={{ imageRendering: 'crisp-edges' }}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600';
                fallback.textContent = 'MyLinked';
                img.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => n.status === 'pending').length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel>All Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification: any) => (
                      <div 
                        key={notification.id} 
                        className="p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted"
                        onClick={() => {
                          // Mark notification as read when clicked
                          markNotificationAsReadMutation.mutate(notification.id);
                          
                          // Handle navigation based on notification type
                          if (notification.type === 'referral_request') {
                            navigate('/referral-links');
                          } else if (notification.type === 'collaboration_request') {
                            navigate('/collaboration?tab=requests');
                          } else if (notification.actionUrl) {
                            navigate(notification.actionUrl);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {notification.type === 'referral_request' && <ExternalLink className="h-4 w-4 text-blue-500" />}
                              {notification.type === 'collaboration_request' && <Users className="h-4 w-4 text-purple-500" />}
                              {notification.type === 'system_message' && <MessageSquare className="h-4 w-4 text-green-500" />}
                              {notification.type === 'feature_update' && <Sparkles className="h-4 w-4 text-yellow-500" />}
                              <p className="font-medium text-sm">{notification.title}</p>
                              <Badge 
                                variant={notification.type === 'referral_request' ? 'default' : 
                                        notification.type === 'collaboration_request' ? 'secondary' : 'outline'} 
                                className="text-xs"
                              >
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {notification.type === 'referral_request' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent notification click
                                    acceptReferralMutation.mutate({ 
                                      requestId: notification.data.requestId, 
                                      notificationId: notification.id
                                    });
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent notification click
                                    declineReferralMutation.mutate({ 
                                      requestId: notification.data.requestId, 
                                      notificationId: notification.id
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}

                            {(notification.type === 'system_message' || notification.type === 'feature_update') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent notification click
                                  if (notification.actionUrl) {
                                    navigate(notification.actionUrl);
                                  }
                                  // Mark notification as read
                                  markNotificationAsReadMutation.mutate(notification.id);
                                }}
                              >
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="user-menu-trigger rounded-full">
                  <img
                    src={userData?.profileImage || "https://github.com/shadcn.png"}
                    alt="User"
                    className="rounded-full"
                    width="32"
                    height="32"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userData?.name || userData?.username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/themes-demo")}>
                  <Palette className="h-4 w-4 mr-2" />
                  Themes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/support")} className="text-blue-600 font-medium">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => {
                    // Call the logout API
                    apiRequest("POST", "/api/logout")
                      .then(() => {
                        // Clear the user data from the cache
                        queryClient.setQueryData(["/api/user"], null);
                        
                        // Redirect to login/landing page
                        navigate("/auth");
                        
                        toast({
                          title: "Logged out",
                          description: "You have been successfully logged out",
                        });
                      })
                      .catch(error => {
                        toast({
                          title: "Logout failed",
                          description: error.message,
                          variant: "destructive",
                        });
                      });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Dashboard Main Content */}
      <main className="container px-4 md:px-6 py-8 max-w-[1280px] mx-auto overflow-hidden">
        <div className="grid gap-8 overflow-x-hidden">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              Welcome to Your Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your profile, links, and view performance metrics
            </p>
          </div>
          {/* Enhanced Profile Preview - Matches Public Profile */}
          <Card className="profile-preview-card overflow-hidden shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-foreground">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Profile Preview
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/${userData?.username}`, '_blank')}
                  className="text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Live
                </Button>
              </div>
              <CardDescription className="text-muted-foreground">How your public profile appears to visitors</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Hero Section - Exactly like public profile */}
              <div className="relative h-40 md:h-48">
                {userData?.profileBackground ? (
                  <img 
                    src={userData.profileBackground} 
                    alt="Profile background" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                
                {/* Profile Info Overlay - Matches public profile */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end gap-4">
                    {/* Profile Avatar - Same size as public */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-background overflow-hidden bg-background">
                      {userData?.profileImage ? (
                        <img 
                          src={userData.profileImage} 
                          alt={userData?.name || "Profile"} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {userData?.name ? userData.name.charAt(0) : userData?.username?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1 text-white mb-2">
                      <h3 className="font-bold text-lg md:text-xl mb-1">{userData?.name || userData?.username || 'Your Name'}</h3>
                      {userData?.profession && (
                        <p className="text-white/90 text-sm mb-1">{userData.profession}</p>
                      )}
                      {userData?.bio && (
                        <p className="text-white/80 text-sm max-w-md">{userData.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome Message Section */}
              {userData?.welcomeMessage && (
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm"
                      onClick={() => setShowWelcomeMessageDialog(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Welcome Message
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Stats Preview */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{links?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Links</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{stats?.views || 0}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">{stats?.score || userData?.socialScore || 50}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
              </div>

              {/* Share and QR Code section */}
              <div className="w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-3 w-full"
                  onClick={() => {
                    // Toggle share options
                    setShowShareOptions(!showShareOptions);
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {showShareOptions ? 'Hide Share Options' : 'Share Your Profile'}
                </Button>
                
                {/* Expanded share options */}
                {showShareOptions && (
                  <div className="space-y-3 px-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Profile Link */}
                    <div className="border rounded-md p-2 bg-muted/10">
                      <p className="text-xs font-medium mb-1">Share Profile Link</p>
                      <div className="flex items-center">
                        <Input 
                          readOnly 
                          value={`mylinked.app/${userData?.username || 'me'}`}
                          className="text-xs h-8 mr-2"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(`mylinked.app/${userData?.username || 'me'}`);
                            toast({
                              title: "Link copied",
                              description: "Profile link copied to clipboard",
                            });
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    
                    {/* QR Code */}
                    <div className="border rounded-md p-3 bg-muted/10">
                      <p className="text-xs font-medium mb-2">Profile QR Code</p>
                      <div className="flex justify-center mb-2">
                        <div className="bg-card p-2 rounded shadow-sm" style={{ minHeight: '188px', minWidth: '188px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isGeneratingQRCode ? (
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                              <p className="text-xs text-muted-foreground">Generating QR code...</p>
                            </div>
                          ) : (
                            <canvas ref={qrCodeCanvasRef} width="180" height="180"></canvas>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={isGeneratingQRCode}
                          onClick={() => {
                            if (qrCodeCanvasRef.current) {
                              try {
                                const canvas = qrCodeCanvasRef.current;
                                
                                // Convert canvas to blob for better browser compatibility
                                canvas.toBlob((blob) => {
                                  if (blob) {
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.download = `${userData?.username || 'profile'}-qrcode.png`;
                                    link.href = url;
                                    
                                    // Trigger download
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    
                                    // Clean up the blob URL
                                    window.URL.revokeObjectURL(url);
                                    
                                    toast({
                                      title: "QR Code Downloaded",
                                      description: "Your profile QR code has been saved to your device.",
                                    });
                                  } else {
                                    throw new Error("Failed to create blob from canvas");
                                  }
                                }, 'image/png', 1.0);
                              } catch (error) {
                                console.error("Failed to download QR code:", error);
                                toast({
                                  title: "Download Failed",
                                  description: "Could not download the QR code. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            } else {
                              toast({
                                title: "QR Code Not Ready",
                                description: "Please wait for the QR code to generate first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              

            </CardContent>
          </Card>
          
          {/* Quick Actions Card - Moved right after Profile Preview */}
          <Card className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Frequently used tools</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/*
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/optimize-links")}
                >
                  <Shuffle className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">Optimize Links</span>
                </Button>
                */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/spotlight")}
                >
                  <Presentation className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">Spotlight</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/collaboration")}
                >
                  <Users className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">Collaboration</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/industry-examples")}
                >
                  <Briefcase className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">Industry</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/referral-links")}
                >
                  <Share2 className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">Referrals</span>
                </Button>
                {FEATURE_BRANDING && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                    onClick={() => navigate("/branding")}
                  >
                    <Paintbrush className="h-4 w-4 mb-1 text-indigo-500" />
                    <span className="text-xs">Branding</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/themes-demo")}
                >
                  <Palette className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">Theme</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex flex-col h-auto py-3 text-center justify-center bg-card/80"
                  onClick={() => navigate("/my-links")}
                >
                  <LinkIcon className="h-4 w-4 mb-1 text-indigo-500" />
                  <span className="text-xs">My Links</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Three Analysis Cards in a Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Social Score Card */}
            <Card className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
                <CardTitle className="text-foreground text-lg">Social Score</CardTitle>
                <CardDescription className="text-muted-foreground">Your profile engagement rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {isLoadingStats ? "..." : `${stats?.score || 0}%`}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {isLoadingStats ? "Loading..." : "Social engagement score"}
                  </div>
                  {!isLoadingStats && (
                    <div className="w-full bg-blue-100 h-3 rounded-full mb-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${stats?.score || 0}%`, maxWidth: '100%' }}
                      ></div>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 text-primary-foreground"
                    onClick={() => navigate("/social-score")}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Views Card */}
            <Card className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
                <CardTitle className="text-foreground text-lg">Profile Views</CardTitle>
                <CardDescription className="text-muted-foreground">Total profile visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {isLoadingStats ? "..." : stats?.profileViews || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {isLoadingStats ? "Loading..." : "Total visits"}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-green-600">
                    <Eye className="h-4 w-4" />
                    <span>+{stats?.profileViews || 0} views</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Link Clicks Card */}
            <Card className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
                <CardTitle className="text-foreground text-lg">Link Clicks</CardTitle>
                <CardDescription className="text-muted-foreground">Total link interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {isLoadingStats ? "..." : stats?.linkClicks || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {isLoadingStats ? "Loading..." : "Total clicks"}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-purple-600">
                    <MousePointer className="h-4 w-4" />
                    <span>+{stats?.linkClicks || 0} clicks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Multi-Platform Content Preview - NEW FEATURE SECTION */}
          {FEATURE_CONTENT_PREVIEW && (
            <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-primary">
                    <Eye className="h-7 w-7" />
                    Content Preview
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-300">NEW</Badge>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Showcase your latest posts from Instagram, Facebook, TikTok, and X on your profile.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Instagram Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    Instagram
                  </h3>
                  {isLoadingInstagram ? (
                    <div className="p-4 border-2 border-dashed border-pink-300 rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                  ) : instagramPreview?.connected && instagramPreview?.latestPost ? (
                    <div className="border-2 border-pink-300 rounded-lg overflow-hidden min-h-[180px]">
                      <div className="relative">
                        <img 
                          src={instagramPreview.latestPost.thumbnailUrl || instagramPreview.latestPost.mediaUrl} 
                          alt="Latest Instagram post"
                          className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(instagramPreview.latestPost.permalink, '_blank')}
                        />
                        <div className="absolute top-2 right-2">
                          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {instagramPreview.latestPost.mediaType}
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Instagram className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs font-medium">@{instagramPreview.profile?.username}</span>
                        </div>
                        {instagramPreview.latestPost.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {instagramPreview.latestPost.caption.length > 80 
                              ? `${instagramPreview.latestPost.caption.substring(0, 80)}...` 
                              : instagramPreview.latestPost.caption}
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => window.open(instagramPreview.latestPost.permalink, '_blank')}
                        >
                          View on Instagram
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-pink-300 rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <Instagram className="h-8 w-8 mx-auto text-pink-400 mb-2" />
                      <h4 className="font-medium text-sm mb-1">Instagram Connected</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Showcasing your latest post
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs"
                        onClick={() => window.open('https://instagram.com', '_blank')}
                      >
                        Visit Instagram
                      </Button>
                    </div>
                  )}
                </div>

                {/* Facebook Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    Facebook
                  </h3>
                  {isLoadingFacebook ? (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                  ) : facebookPreview?.connected && facebookPreview?.latestPost ? (
                    <div className="border-2 border-border rounded-lg overflow-hidden min-h-[180px]">
                      <div className="relative">
                        {facebookPreview.latestPost.mediaUrl ? (
                          <img 
                            src={facebookPreview.latestPost.mediaUrl} 
                            alt="Latest Facebook post"
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(facebookPreview.latestPost.permalink, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-32 bg-blue-50 flex items-center justify-center">
                            <Facebook className="h-12 w-12 text-blue-300" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {facebookPreview.latestPost.mediaType}
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Facebook className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs font-medium">@{facebookPreview.profile?.username}</span>
                        </div>
                        {facebookPreview.latestPost.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {facebookPreview.latestPost.caption.length > 80 
                              ? `${facebookPreview.latestPost.caption.substring(0, 80)}...` 
                              : facebookPreview.latestPost.caption}
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => window.open(facebookPreview.latestPost.permalink, '_blank')}
                        >
                          View on Facebook
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <Facebook className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <h4 className="font-medium text-sm mb-1">
                        {facebookPreview?.tokenExpired ? 'Token Expired' : 'Not Connected'}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {facebookPreview?.message || 'Show your latest post'}
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        onClick={() => {
                          window.location.href = '/api/social/connect/facebook';
                        }}
                      >
                        {facebookPreview?.tokenExpired ? 'Reconnect' : 'Connect'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* TikTok Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <div className="h-5 w-5 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">T</div>
                    TikTok
                  </h3>
                  {isLoadingTikTok ? (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-transparent mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                  ) : tiktokPreview?.connected && tiktokPreview?.latestPost ? (
                    <div className="border-2 border-border rounded-lg overflow-hidden min-h-[180px]">
                      <div className="relative">
                        {tiktokPreview.latestPost.thumbnailUrl ? (
                          <img 
                            src={tiktokPreview.latestPost.thumbnailUrl} 
                            alt="Latest TikTok video"
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(tiktokPreview.latestPost.permalink, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted flex items-center justify-center">
                            <div className="h-12 w-12 bg-black rounded-sm flex items-center justify-center text-white text-lg font-bold">T</div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            VIDEO
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">T</div>
                          <span className="text-xs font-medium">@{tiktokPreview.profile?.username}</span>
                        </div>
                        {tiktokPreview.latestPost.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {tiktokPreview.latestPost.caption.length > 80 
                              ? `${tiktokPreview.latestPost.caption.substring(0, 80)}...` 
                              : tiktokPreview.latestPost.caption}
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => window.open(tiktokPreview.latestPost.permalink, '_blank')}
                        >
                          View on TikTok
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <div className="h-8 w-8 mx-auto bg-black rounded-sm flex items-center justify-center text-white text-sm font-bold mb-2">T</div>
                      <h4 className="font-medium text-sm mb-1">
                        {tiktokPreview?.tokenExpired ? 'Token Expired' : 'Not Connected'}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {tiktokPreview?.message || 'Show your latest video'}
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-black hover:bg-muted text-white text-xs"
                        onClick={() => {
                          window.location.href = '/api/social/connect/tiktok';
                        }}
                      >
                        {tiktokPreview?.tokenExpired ? 'Reconnect' : 'Connect'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* X (Twitter) Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    X (Twitter)
                  </h3>
                  {isLoadingTwitter ? (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                  ) : twitterPreview?.connected ? (
                    <div className="border-2 border-border rounded-lg overflow-hidden min-h-[180px]">
                      {twitterPreview.latestPost ? (
                        <>
                          <div className="relative">
                            {twitterPreview.latestPost.mediaUrl ? (
                              <img 
                                src={twitterPreview.latestPost.mediaUrl} 
                                alt="Latest tweet media"
                                className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(twitterPreview.latestPost.permalink, '_blank')}
                              />
                            ) : (
                              <div className="w-full h-32 bg-blue-50 flex items-center justify-center">
                                <Twitter className="h-12 w-12 text-blue-300" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                {twitterPreview.latestPost.mediaType || 'TWEET'}
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Twitter className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-xs font-medium">@{twitterPreview.profile?.username}</span>
                            </div>
                            {twitterPreview.latestPost.caption && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {twitterPreview.latestPost.caption.length > 80 
                                  ? `${twitterPreview.latestPost.caption.substring(0, 80)}...` 
                                  : twitterPreview.latestPost.caption}
                              </p>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full text-xs"
                              onClick={() => window.open(twitterPreview.latestPost.permalink, '_blank')}
                            >
                              View on X
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 flex flex-col items-center justify-center h-full">
                          <div className="w-full h-24 bg-green-50 flex items-center justify-center rounded-lg mb-3">
                            <Twitter className="h-12 w-12 text-green-500" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700">Connected</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-center mb-3">
                            X account connected successfully. Posts will appear here when API access is enhanced.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                            onClick={() => window.open('https://twitter.com', '_blank')}
                          >
                            Visit X
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center min-h-[180px] flex flex-col justify-center">
                      <Twitter className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                      <h4 className="font-medium text-sm mb-1">
                        {twitterPreview?.tokenExpired ? 'Token Expired' : 'Not Connected'}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {twitterPreview?.message || 'Show your latest tweet'}
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                        onClick={() => {
                          window.location.href = '/api/twitter/connect';
                        }}
                      >
                        {twitterPreview?.tokenExpired ? 'Reconnect' : 'Connect'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">How Content Preview Works</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Connect your social accounts to show latest posts on your profile</li>
                  <li>• Visitors can see your recent content without leaving your page</li>
                  <li>• Posts are clickable and link directly to the original content</li>
                  <li>• Updates automatically when you post new content</li>
                </ul>
              </div>
            </CardContent>
            </Card>
          )}
          
          {/* Main Content Grid with Engagement Trends and Features */}
          <div className="grid gap-6 md:grid-cols-3 overflow-x-hidden">
            {/* Left Column - Engagement Trends (2 columns) */}
            <div className="md:col-span-2 space-y-6 overflow-x-hidden">
              {/* Engagement Trends Card */}
              <Card className="shadow-xl border-2 border-border/50 bg-card/90 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/30">
                  <CardTitle className="flex items-center text-foreground">
                    <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                    Engagement Trends
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">View your profile performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#6366f1"
                          fillOpacity={1}
                          fill="url(#viewsGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="#f43f5e"
                          fillOpacity={1}
                          fill="url(#clicksGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-4 space-x-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                      <span className="text-sm">Views</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
                      <span className="text-sm">Clicks</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/analytics")}
                  >
                    <BarChart4 className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </CardFooter>
              </Card>

            </div>

            {/* Right Column - Smart Link AI and One-Click Pitch Mode (1 column) */}
            <div className="md:col-span-1 space-y-6">
              {/* Smart Link AI Component temporarily disabled */}
              {false && (
                <SmartLinkAI
                  links={links || []}
                  onApplySuggestions={handleApplySuggestions}
                />
              )}

              {/* One-Click Pitch Mode Card */}
              <PitchModeCard />
            </div>
          </div>
        </div>
      </main>
      
      {/* Dialogs */}
      <Dialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  {...register("title")}
                  placeholder="Enter link title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input 
                  id="url"
                  {...register("url")}
                  placeholder="https://example.com"
                />
                {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>}
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  value={watch("platform")} 
                  onValueChange={(value) => setValue("platform", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.platform && <p className="text-red-500 text-sm mt-1">{errors.platform.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <textarea 
                  id="description"
                  {...register("description")}
                  placeholder="Brief description of this link"
                  className="w-full px-3 py-2 border rounded-md resize-none"
                  rows={3}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddLinkDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLinkMutation.isPending}>
                {createLinkMutation.isPending ? "Adding..." : "Add Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Welcome Message Dialog */}
      <Dialog open={showWelcomeMessageDialog} onOpenChange={setShowWelcomeMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
              Welcome Message
            </DialogTitle>
            <DialogDescription>
              Here's the welcome message from this profile
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userData?.welcomeMessage && (userData.welcomeMessage.endsWith('.mp4') || userData.welcomeMessage.endsWith('.webm') || userData.welcomeMessage.endsWith('.ogg')) ? (
              <div className="w-full">
                <video 
                  controls 
                  className="w-full rounded-lg max-h-64"
                  src={userData.welcomeMessage}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : userData?.welcomeMessage && (userData.welcomeMessage.endsWith('.mp3') || userData.welcomeMessage.endsWith('.wav') || userData.welcomeMessage.endsWith('.m4a')) ? (
              <div className="w-full">
                <audio 
                  controls 
                  className="w-full"
                  src={userData.welcomeMessage}
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            ) : userData?.welcomeMessage ? (
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-foreground leading-relaxed">
                  {userData.welcomeMessage}
                </p>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No welcome message available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWelcomeMessageDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
