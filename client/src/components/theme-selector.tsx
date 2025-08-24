import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PenLine, Moon, Sun, Palette, X, Check, Type } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { User } from "@shared/schema";

type ThemeSelectorProps = {
  currentTheme: string;
  darkMode: boolean;
  profile?: User;
  onThemeChange: (theme: string) => void;
  onDarkModeChange: (darkMode: boolean) => void;
  onFontChange?: (font: string) => void;
};

const themes = [
  { id: "default", colors: "from-primary-500 to-secondary-500" },
  { id: "purple", colors: "from-purple-500 to-pink-500" },
  { id: "blue", colors: "from-blue-500 to-cyan-400" },
  { id: "orange", colors: "from-amber-500 to-orange-500" },
  { id: "green", colors: "from-emerald-500 to-lime-500" },
];

const colors = [
  { name: "Red", value: "#ef4444" }, 
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Green", value: "#22c55e" },
  { name: "Lime", value: "#84cc16" },
  { name: "Yellow", value: "#eab308" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Brown", value: "#9a3412" }
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme,
  darkMode,
  profile,
  onThemeChange,
  onDarkModeChange,
  onFontChange
}) => {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(darkMode);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedFont, setSelectedFont] = useState(profile?.font || 'inter');
  
  // Debug current theme prop
  useEffect(() => {
    console.log("ThemeSelector received currentTheme:", currentTheme);
    setSelectedTheme(currentTheme);
  }, [currentTheme]);
  
  // Update selected font when profile changes
  useEffect(() => {
    if (profile?.font) {
      console.log("ThemeSelector received font:", profile.font);
      setSelectedFont(profile.font);
    }
  }, [profile?.font]);
  
  // Sync local state with props
  useEffect(() => {
    setIsDarkMode(darkMode);
  }, [darkMode]);
  
  // Handle dark mode toggle with local state for immediate feedback
  const handleDarkModeChange = (checked: boolean) => {
    console.log("Dark mode change in ThemeSelector:", checked);
    setIsDarkMode(checked);
    onDarkModeChange(checked);
    
    // Apply dark mode class to body for immediate feedback
    if (checked) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };
  
  return (
    <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base-content font-medium">Theme</h3>
        <button 
          className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:text-primary-700 transition-colors"
          onClick={() => setCustomizeOpen(true)}
        >
          <PenLine className="h-3.5 w-3.5" />
          <span>Customize</span>
        </button>
      </div>
      
      {/* Color Picker Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Theme Color</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-3 py-4">
            {colors.map((color) => (
              <button
                key={color.name}
                className="aspect-square rounded-lg p-1 border border-base-200 flex items-center justify-center hover:border-primary transition-colors"
                style={{ background: color.value }}
                title={color.name}
                aria-label={`${color.name} color`}
                onClick={() => {
                  // Would normally update theme with custom color
                  onThemeChange('default'); // For demo, just use default
                  setCustomizeOpen(false);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Theme selector with small icons */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {themes.map(theme => {
          // Use our local state instead of props directly for UI rendering
          const isSelected = selectedTheme === theme.id;
          
          return (
            <button 
              key={theme.id}
              className={`w-10 h-10 rounded-lg flex items-center justify-center relative
                ${isSelected
                  ? "bg-base-200 shadow-md border border-base-300"
                  : "bg-transparent hover:bg-base-200"
                }`}
              onClick={() => {
                console.log("Theme selected:", theme.id);
                // Update local state immediately for UI feedback
                setSelectedTheme(theme.id);
                // Notify parent component
                onThemeChange(theme.id);
              }}
              aria-label={`${theme.id} theme`}
              title={`${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)} theme`}
            >
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${theme.colors} 
                ${isSelected ? "scale-125 shadow-lg border-2 border-white" : ""} 
                transition-all duration-200`}></div>
              {isSelected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
        
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center relative bg-transparent hover:bg-base-200"
          onClick={() => setCustomizeOpen(true)}
          aria-label="Add custom theme"
          title="Custom theme"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300">
            <Palette className="h-4 w-4 text-base-content" />
          </div>
        </button>
      </div>

      {/* Font Style Selector */}
      <div className="mt-8 border-t border-base-200 pt-6">
        <h3 className="text-base-content font-medium mb-4">Font Style</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className={`px-3 py-2 rounded-lg text-base text-center font-inter
              ${selectedFont === 'inter' ? 
                'bg-primary-50 text-primary-600 font-semibold border border-primary-200' : 
                'bg-base-200 text-base-content hover:bg-base-300 border border-base-200'
              }`}
            onClick={() => {
              setSelectedFont('inter');
              onFontChange && onFontChange('inter');
            }}
          >
            Inter
          </button>
          <button 
            className={`px-3 py-2 rounded-lg text-base text-center font-poppins
              ${selectedFont === 'poppins' ? 
                'bg-primary-50 text-primary-600 font-semibold border border-primary-200' : 
                'bg-base-200 text-base-content hover:bg-base-300 border border-base-200'
              }`}
            onClick={() => {
              setSelectedFont('poppins');
              onFontChange && onFontChange('poppins');
            }}
          >
            Poppins
          </button>
          <button 
            className={`px-3 py-2 rounded-lg text-base text-center serif
              ${selectedFont === 'serif' ? 
                'bg-primary-50 text-primary-600 font-semibold border border-primary-200' : 
                'bg-base-200 text-base-content hover:bg-base-300 border border-base-200'
              }`}
            style={{ fontFamily: 'Georgia, serif' }}
            onClick={() => {
              setSelectedFont('serif');
              onFontChange && onFontChange('serif');
            }}
          >
            Georgia
          </button>
          <button 
            className={`px-3 py-2 rounded-lg text-base text-center monospace
              ${selectedFont === 'monospace' ? 
                'bg-primary-50 text-primary-600 font-semibold border border-primary-200' : 
                'bg-base-200 text-base-content hover:bg-base-300 border border-base-200'
              }`}
            style={{ fontFamily: 'monospace' }}
            onClick={() => {
              setSelectedFont('monospace');
              onFontChange && onFontChange('monospace');
            }}
          >
            Monospace
          </button>
          <button 
            className={`px-3 py-2 rounded-lg text-base text-center
              ${selectedFont === 'cursive' ? 
                'bg-primary-50 text-primary-600 font-semibold border border-primary-200' : 
                'bg-base-200 text-base-content hover:bg-base-300 border border-base-200'
              }`}
            style={{ fontFamily: 'cursive' }}
            onClick={() => {
              setSelectedFont('cursive');
              onFontChange && onFontChange('cursive');
            }}
          >
            Cursive
          </button>
          <button 
            className={`px-3 py-2 rounded-lg text-base text-center
              ${selectedFont === 'system' ? 
                'bg-primary-50 text-primary-600 font-semibold border border-primary-200' : 
                'bg-base-200 text-base-content hover:bg-base-300 border border-base-200'
              }`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
            onClick={() => {
              setSelectedFont('system');
              onFontChange && onFontChange('system');
            }}
          >
            System
          </button>
        </div>
      </div>
      
      {/* Dark mode toggle with icons */}
      <div className="mt-8 border-t border-base-200 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-amber-500" />
          <Label htmlFor="dark-mode" className="text-base-content text-sm font-medium cursor-pointer">
            Dark Mode
          </Label>
          <Moon className="h-5 w-5 text-base-content" />
        </div>
        <Switch 
          id="dark-mode" 
          checked={isDarkMode}
          onCheckedChange={handleDarkModeChange}
        />
      </div>
    </div>
  );
};

export default ThemeSelector;
