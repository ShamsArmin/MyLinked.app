import React from 'react';
import { Link, useLocation } from 'wouter';
import { User, LogOut, BarChart3, TrendingUp, Link2, Home, Settings, Sparkles, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type AppNavigationProps = {
  activeItem?: string;
};

export function AppNavigation({ activeItem = 'dashboard' }: AppNavigationProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'social-score', label: 'Social Score', icon: TrendingUp, href: '/social-score' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'branding', label: 'AI Branding', icon: Sparkles, href: '/branding' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/auth');
      }
    });
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/dashboard">
              <a className="text-xl font-bold text-blue-600 flex items-center">MyLinked</a>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                
                return (
                  <Link key={item.id} href={item.href}>
                    <a className={`px-3 py-2 rounded-md text-sm font-medium flex items-center
                      ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <Icon className="w-4 h-4 mr-1.5" />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <>
                <button className="notifications-icon text-gray-700 hover:text-gray-900">
                  <Bell className="h-5 w-5" />
                </button>

                <div className="hidden md:flex items-center gap-2 profile-menu">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-700" />
                  </div>
                  <span className="font-medium">{user.name || user.username}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile menu - shown on smaller screens */}
        <div className="md:hidden mt-2 pt-2 border-t border-gray-100">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <Link key={item.id} href={item.href}>
                  <a className={`p-2 rounded-md flex flex-col items-center min-w-[60px] text-center
                    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}