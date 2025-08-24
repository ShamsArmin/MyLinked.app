import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Sun, 
  Moon, 
  Leaf, 
  Flame, 
  Waves, 
  Crown,
  Check,
  Eye,
  Save,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";

interface Theme {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  gradient?: string;
}

const presetThemes: Theme[] = [
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Professional and trustworthy",
    icon: <Waves className="h-5 w-5" />,
    colors: {
      primary: "#3b82f6",
      secondary: "#1e40af",
      accent: "#06b6d4",
      background: "#ffffff",
      text: "#1f2937",
      border: "#e5e7eb"
    },
    gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Warm and creative energy",
    icon: <Sun className="h-5 w-5" />,
    colors: {
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#fbbf24",
      background: "#fffbeb",
      text: "#92400e",
      border: "#fed7aa"
    },
    gradient: "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural and sustainable",
    icon: <Leaf className="h-5 w-5" />,
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#34d399",
      background: "#f0fdf4",
      text: "#064e3b",
      border: "#bbf7d0"
    },
    gradient: "linear-gradient(135deg, #059669 0%, #34d399 100%)"
  },
  {
    id: "midnight",
    name: "Midnight Dark",
    description: "Sleek and modern",
    icon: <Moon className="h-5 w-5" />,
    colors: {
      primary: "#6366f1",
      secondary: "#4f46e5",
      accent: "#a78bfa",
      background: "#0f172a",
      text: "#f1f5f9",
      border: "#334155"
    },
    gradient: "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)"
  },
  {
    id: "passion",
    name: "Passion Red",
    description: "Bold and energetic",
    icon: <Flame className="h-5 w-5" />,
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#f87171",
      background: "#fef2f2",
      text: "#7f1d1d",
      border: "#fecaca"
    },
    gradient: "linear-gradient(135deg, #dc2626 0%, #f87171 100%)"
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Elegant and sophisticated",
    icon: <Crown className="h-5 w-5" />,
    colors: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#a855f7",
      background: "#faf5ff",
      text: "#581c87",
      border: "#d8b4fe"
    },
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
  }
];

export default function SimpleThemesDemo() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(presetThemes[0]);
  const [activeTheme, setActiveTheme] = useState<string>("ocean");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { setTheme } = useTheme();

  // Get current user profile to check active theme
  const { data: profile } = useQuery<User>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Update active theme when profile loads
  useEffect(() => {
    if (profile?.theme) {
      setActiveTheme(profile.theme);
    }
  }, [profile?.theme]);

  const handleApplyTheme = (theme: Theme) => {
    setActiveTheme(theme.id);
    setTheme(theme.id);
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Apply dark mode to the document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: newDarkMode ? "Dark Mode Enabled" : "Light Mode Enabled",
      description: `Switched to ${newDarkMode ? "dark" : "light"} mode.`
    });
  };

  const PreviewCard = ({ theme }: { theme: Theme }) => (
    <div 
      className="p-4 rounded-lg border-2 transition-all duration-300"
      style={{
        background: theme.colors.background,
        borderColor: theme.colors.border,
        color: theme.colors.text
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div 
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{
            background: theme.colors.primary,
            color: theme.colors.background
          }}
        >
          Your Profile
        </div>
        <div className="flex gap-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ background: theme.colors.primary }}
          />
          <div 
            className="w-3 h-3 rounded-full"
            style={{ background: theme.colors.secondary }}
          />
          <div 
            className="w-3 h-3 rounded-full"
            style={{ background: theme.colors.accent }}
          />
        </div>
      </div>
      
      <h3 className="font-bold text-lg mb-1">Armin Shamseddini</h3>
      <p className="text-sm opacity-80 mb-3">Project Manager & Designer</p>
      
      <div className="space-y-2">
        <div 
          className="h-8 rounded px-3 flex items-center text-sm font-medium"
          style={{ 
            background: theme.gradient || theme.colors.primary,
            color: theme.colors.background 
          }}
        >
          LinkedIn Profile
        </div>
        <div 
          className="h-8 rounded px-3 flex items-center text-sm border"
          style={{ 
            borderColor: theme.colors.border,
            color: theme.colors.text 
          }}
        >
          Portfolio Website
        </div>
        <div 
          className="h-8 rounded px-3 flex items-center text-sm border"
          style={{ 
            borderColor: theme.colors.border,
            color: theme.colors.text 
          }}
        >
          GitHub Profile
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Palette className="mr-3 h-8 w-8 text-primary" />
              Profile Themes
            </h1>
            <p className="text-muted-foreground">
              Choose from beautiful preset themes to customize your profile appearance
            </p>
          </div>
        </div>
      </div>

      {/* Dark Mode Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            {isDarkMode ? <Moon className="mr-2 h-5 w-5" /> : <Sun className="mr-2 h-5 w-5" />}
            Dark Mode
          </CardTitle>
          <CardDescription>
            Toggle between light and dark mode for your profile display
          </CardDescription>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 To switch to a different mode, turn off Dark Mode in the Appearance tab on your Profile page.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-yellow-100 text-yellow-600'}`}>
                {isDarkMode ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium">
                  {isDarkMode ? "Dark Mode Active" : "Light Mode Active"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? "Easier on the eyes in low light" : "Classic bright appearance"}
                </p>
              </div>
            </div>
            <Button
              variant={isDarkMode ? "secondary" : "default"}
              onClick={handleDarkModeToggle}
              className="min-w-[100px]"
            >
              {isDarkMode ? "Switch to Light" : "Switch to Dark"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presetThemes.map((theme) => (
          <Card key={theme.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {theme.icon}
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                </div>
                {activeTheme === theme.id && (
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <CardDescription>{theme.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <PreviewCard theme={theme} />
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTheme(theme)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => handleApplyTheme(theme)}
                  disabled={activeTheme === theme.id}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {activeTheme === theme.id ? "Applied" : "Apply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Large Preview Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Theme Preview: {selectedTheme.name}</CardTitle>
          <CardDescription>
            See how your profile will look with the {selectedTheme.name} theme
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="max-w-md mx-auto">
            <PreviewCard theme={selectedTheme} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}