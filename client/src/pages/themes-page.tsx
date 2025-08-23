import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Sparkles, 
  Sun, 
  Moon, 
  Leaf, 
  Flame, 
  Waves, 
  Mountain,
  Star,
  Heart,
  Zap,
  Crown,
  Check,
  Eye,
  Save
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

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
    id: "default",
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

export default function ThemesPage() {
  const { setTheme, theme: activeTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(presetThemes[0]);
  const [isApplying, setIsApplying] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: "#3b82f6",
    secondary: "#1e40af",
    accent: "#06b6d4",
    background: "#ffffff",
    text: "#1f2937",
    border: "#e5e7eb"
  });

  const handleSaveTheme = async (theme: Theme) => {
    setIsApplying(true);
    await setTheme(theme.id);
    setIsApplying(false);
  };

  const handleCustomColorChange = (colorType: string, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const createCustomTheme = (): Theme => ({
    id: "custom",
    name: "Custom Theme",
    description: "Your personalized colors",
    icon: <Sparkles className="h-5 w-5" />,
    colors: customColors,
    gradient: `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.accent} 100%)`
  });

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
          Profile
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
      
      <h3 className="font-bold text-lg mb-1">John Doe</h3>
      <p className="text-sm opacity-80 mb-3">Digital Marketing Specialist</p>
      
      <div className="space-y-2">
        <div 
          className="h-8 rounded px-3 flex items-center text-sm"
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
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Palette className="mr-3 h-8 w-8 text-primary" />
          Profile Themes
        </h1>
        <p className="text-muted-foreground">
          Customize your profile appearance with beautiful themes and colors
        </p>
      </div>

      <Tabs defaultValue="presets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Preset Themes</TabsTrigger>
          <TabsTrigger value="custom">Custom Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-6">
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
                      onClick={() => handleSaveTheme(theme)}
                      disabled={isApplying}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Custom Color Picker
                </CardTitle>
                <CardDescription>
                  Create your own unique theme by selecting custom colors
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primary"
                        type="color"
                        value={customColors.primary}
                        onChange={(e) => handleCustomColorChange("primary", e.target.value)}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={customColors.primary}
                        onChange={(e) => handleCustomColorChange("primary", e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondary"
                        type="color"
                        value={customColors.secondary}
                        onChange={(e) => handleCustomColorChange("secondary", e.target.value)}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={customColors.secondary}
                        onChange={(e) => handleCustomColorChange("secondary", e.target.value)}
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accent">Accent Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="accent"
                        type="color"
                        value={customColors.accent}
                        onChange={(e) => handleCustomColorChange("accent", e.target.value)}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={customColors.accent}
                        onChange={(e) => handleCustomColorChange("accent", e.target.value)}
                        placeholder="#06b6d4"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="background">Background Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="background"
                        type="color"
                        value={customColors.background}
                        onChange={(e) => handleCustomColorChange("background", e.target.value)}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={customColors.background}
                        onChange={(e) => handleCustomColorChange("background", e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="text">Text Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="text"
                        type="color"
                        value={customColors.text}
                        onChange={(e) => handleCustomColorChange("text", e.target.value)}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={customColors.text}
                        onChange={(e) => handleCustomColorChange("text", e.target.value)}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="border">Border Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="border"
                        type="color"
                        value={customColors.border}
                        onChange={(e) => handleCustomColorChange("border", e.target.value)}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        value={customColors.border}
                        onChange={(e) => handleCustomColorChange("border", e.target.value)}
                        placeholder="#e5e7eb"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => handleSaveTheme(createCustomTheme())}
                  disabled={isApplying}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Custom Theme
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your custom theme will look
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <PreviewCard theme={createCustomTheme()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}