import React, { useState } from "react";
import { Link as WouterLink, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ChevronDown, Menu, X, Home, BarChart2, Settings, User, LogOut, Award, Paintbrush, Link as LinkIcon, Palette, HelpCircle } from "lucide-react";
import { SocialScoreMini } from "./social-score-mini";

const AppHeader: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  console.log("AppHeader rendering - user:", !!user);
  
  if (!user) return null;
  
  const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Analytics", href: "/analytics", icon: BarChart2 },
    { label: "Social Score", href: "/social-score", icon: Award },
    { label: "Branding", href: "/branding", icon: Paintbrush },
    { label: "Spotlight", href: "/spotlight", icon: LinkIcon },
    { label: "Settings", href: "/settings", icon: Settings },
  ];
  
  return (
    <header className="bg-base-100 shadow-sm py-3 px-4 md:px-6 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <WouterLink href="/" className="flex items-center gap-2">
          <img 
            src="/assets/logo-horizontal.png" 
            alt="MyLinked" 
            className="h-8 w-auto"
            style={{ imageRendering: 'crisp-edges' }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.display = 'none';
              const fallback = document.createElement('span');
              fallback.className = 'font-heading font-semibold text-xl text-base-content';
              fallback.textContent = 'MyLinked';
              img.parentNode?.appendChild(fallback);
            }}
          />
        </WouterLink>
        
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <SheetHeader className="border-b pb-4 mb-4">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                    <span className="text-white font-bold text-base">ML</span>
                  </div>
                  <span className="font-heading font-semibold text-lg">MyLinked</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1">
                <div className="space-y-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    
                    return (
                      <SheetClose asChild key={item.href}>
                        <WouterLink
                          href={item.href}
                          className={`flex items-center gap-3 py-2 px-4 rounded-lg ${
                            isActive
                              ? "text-primary font-medium bg-primary/10"
                              : "text-base-content/70 hover:bg-base-200"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </WouterLink>
                      </SheetClose>
                    );
                  })}
                  <div className="h-px bg-gray-200 my-3"></div>
                  <SheetClose asChild>
                    <WouterLink
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <User className="h-5 w-5" />
                      Your Profile
                    </WouterLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <WouterLink
                      href="/themes"
                      className="flex items-center gap-3 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <Palette className="h-5 w-5" />
                      Themes
                    </WouterLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <WouterLink
                      href="/settings"
                      className="flex items-center gap-3 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </WouterLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <WouterLink
                      href="/support"
                      className="flex items-center gap-3 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <HelpCircle className="h-5 w-5" />
                      Support
                    </WouterLink>
                  </SheetClose>
                  <button
                    className="flex items-center gap-3 py-2 px-4 rounded-lg text-red-600 hover:bg-red-50 w-full text-left"
                    onClick={() => {
                      // Set loading state
                      setIsLoggingOut(true);
                      // Direct logout with window.location for reliability
                      fetch("/api/logout", {
                        method: "POST",
                        credentials: "include"
                      }).then(() => {
                        // Force a refresh to the auth page on successful logout
                        window.location.href = "/auth";
                      }).catch(err => {
                        setIsLoggingOut(false);
                        console.error("Logout failed:", err);
                      });
                    }}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-r-transparent" />
                        Signing Out...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </>
                    )}
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location === item.href;
              
              return (
                <WouterLink
                  key={item.href}
                  href={item.href}
                  className={`${
                    isActive ? "text-primary-600 font-medium" : "text-gray-600 hover:text-primary-600"
                  } transition-colors`}
                >
                  {item.label}
                </WouterLink>
              );
            })}
            
            <WouterLink 
              href="/social-score"
              className={`${
                location === "/social-score" ? "text-primary-600 font-medium" : "text-gray-600 hover:text-primary-600"
              } transition-colors flex items-center gap-1`}
            >
              <Award className="h-4 w-4" />
              Social Score
            </WouterLink>
            
            <SocialScoreMini />
            
            <div className="h-5 w-px bg-gray-200"></div>
            

            
            {/* User Menu Dropdown */}
            <div className="relative">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 hover:bg-transparent"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">{user.name || user.username}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div 
                      className="flex items-center w-full p-3 text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        window.location.href = `/profile/${user.username}`;
                      }}
                    >
                      <User className="mr-3 h-4 w-4" />
                      <span>Profile</span>
                    </div>
                    <div 
                      className="flex items-center w-full p-3 text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        window.location.href = '/themes';
                      }}
                    >
                      <Palette className="mr-3 h-4 w-4" />
                      <span>Themes</span>
                    </div>
                    <div 
                      className="flex items-center w-full p-3 text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        window.location.href = '/settings';
                      }}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      <span>Settings</span>
                    </div>
                    <div 
                      className="flex items-center w-full p-3 text-left hover:bg-blue-50 cursor-pointer text-blue-600 font-medium border-b border-blue-200 bg-blue-50"
                      onClick={() => {
                        console.log('Support menu clicked');
                        setDropdownOpen(false);
                        window.location.href = '/support';
                      }}
                    >
                      <HelpCircle className="mr-3 h-4 w-4" />
                      <span>Support</span>
                    </div>
                    <div 
                      className="flex items-center w-full p-3 text-left hover:bg-red-50 cursor-pointer text-red-600 mt-2"
                      onClick={() => {
                        setDropdownOpen(false);
                        setIsLoggingOut(true);
                        fetch("/api/logout", {
                          method: "POST",
                          credentials: "include"
                        }).then(() => {
                          window.location.href = "/auth";
                        }).catch(err => {
                          setIsLoggingOut(false);
                          console.error("Logout failed:", err);
                        });
                      }}
                    >
                      {isLoggingOut ? (
                        <>
                          <span className="animate-spin mr-3 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                          Signing out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-3 h-4 w-4" />
                          Logout
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
