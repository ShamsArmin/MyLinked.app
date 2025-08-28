import React, { useState, useEffect } from 'react';

// Feature flag for AI Branding
const BRANDING_ENABLED = import.meta.env.VITE_FEATURE_BRANDING === 'true';

// Define menu item type
type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
};

type SimpleNavigationProps = {
  activeItem?: string;
  username?: string;
  avatarUrl?: string;
  socialScore?: number;
};

export function SimpleNavigation({ 
  activeItem = '', 
  username = 'User', 
  avatarUrl = '',
  socialScore = 78
}: SimpleNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentActive, setCurrentActive] = useState(activeItem);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New follower', message: 'Jane Smith started following you', time: '2 mins ago', read: false },
    { id: 2, title: 'Link milestone', message: 'Your Twitter link reached 50 clicks', time: '4 hours ago', read: false },
    { id: 3, title: 'Weekly summary', message: 'Your profile views increased by 12%', time: '1 day ago', read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Get user's first initial for avatar placeholder
  const userInitial = username.charAt(0).toUpperCase();
  
  // Use window.location.pathname to determine current page and update on navigation
  useEffect(() => {
    const updateActiveItem = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setCurrentActive('dashboard');
      } else if (path.startsWith('/social-score')) {
        setCurrentActive('social-score');
      } else if (path.startsWith('/analytics')) {
        setCurrentActive('analytics');
        } else if (BRANDING_ENABLED && path.startsWith('/branding')) {
          setCurrentActive('branding');
        } else if (path.startsWith('/collaborative')) {
        setCurrentActive('collaborative');
      } else if (path.startsWith('/settings')) {
        setCurrentActive('settings');
      } else {
        setCurrentActive(activeItem || '');
      }
    };

    // Update immediately
    updateActiveItem();
    
    // Add listener for navigation events
    window.addEventListener('popstate', updateActiveItem);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('popstate', updateActiveItem);
    };
  }, [activeItem]);
  
  // Close notifications and search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notifications-panel')) {
        setShowNotifications(false);
      }
      if (showSearch && !target.closest('.search-panel')) {
        setShowSearch(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showSearch]);
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true,
    })));
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Menu items with their labels, corresponding paths and icons
  const menuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'social-score', 
      label: 'Social Score', 
      href: '/social-score',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      badge: 'New',
      badgeColor: 'green'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      href: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: '3',
      badgeColor: 'blue'
    },
      ...(BRANDING_ENABLED
        ? [{
            id: 'branding',
            label: 'AI Branding',
            href: '/branding',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          }]
        : []),
    { 
      id: 'collaborative', 
      label: 'Collaborative', 
      href: '/collaborative',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  // Render a badge for menu items
  const renderBadge = (badge?: string | number, color?: string) => {
    if (!badge) return null;
    
    let bgColor = 'bg-blue-500';
    if (color === 'green') bgColor = 'bg-green-500';
    if (color === 'red') bgColor = 'bg-red-500';
    if (color === 'yellow') bgColor = 'bg-yellow-500';
    if (color === 'purple') bgColor = 'bg-purple-500';
    
    return (
      <span className={`${bgColor} text-white text-xs px-1.5 py-0.5 rounded-full ml-2`}>
        {badge}
      </span>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h1 className="text-xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  MyLinked
                </span>
              </h1>
            </a>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search button */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-blue-700 hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Social Score Badge */}
            <a 
              href="/social-score"
              className="hidden sm:flex items-center space-x-2 bg-blue-700 bg-opacity-40 px-2 py-1 rounded-full hover:bg-opacity-50 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/social-score");
                setCurrentActive('social-score');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              <div className="p-1 bg-blue-400 bg-opacity-30 rounded-full">
                <svg className="w-3 h-3 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs font-medium">Score: {socialScore}</span>
            </a>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-blue-700 hover:bg-opacity-30 transition-colors relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications panel */}
              {showNotifications && (
                <div className="notifications-panel absolute right-0 mt-2 w-80 bg-white rounded-md shadow-xl z-50 overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Notifications</h3>
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      <div>
                        {notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${notification.read ? '' : 'bg-blue-50'}`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                              <span className="text-xs text-gray-500">{notification.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="py-2 text-center border-t border-gray-100">
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-800">View all notifications</a>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Profile Menu */}
            <div className="relative">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-semibold">{userInitial}</span>
                  )}
                </div>
                <span className="text-sm font-medium hidden md:block">{username}</span>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md hover:bg-blue-700 hover:bg-opacity-30 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search panel */}
        {showSearch && (
          <div className="search-panel max-w-7xl mx-auto px-4 pb-3">
            <div className="bg-white bg-opacity-20 rounded-lg overflow-hidden flex items-center focus-within:ring-2 focus-within:ring-white">
              <svg className="h-5 w-5 ml-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search links, analytics, or settings..."
                className="bg-transparent border-none w-full py-2 px-3 text-white placeholder-blue-100 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </header>
      
      {/* Navigation - Desktop */}
      <nav className="bg-white shadow-sm border-b border-blue-100 sticky top-16 z-10 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between overflow-x-auto hide-scrollbar">
            {menuItems.map((item) => {
              const isActive = item.id === currentActive;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    // For better navigation without page reload
                    if (item.href === "/" || item.href.startsWith("/")) {
                      e.preventDefault();
                      window.history.pushState({}, "", item.href);
                      setCurrentActive(item.id);
                      // Force a refresh event on the window
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className={`flex items-center px-4 py-3 space-x-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                      : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 hover:border-b-2 hover:border-blue-200'
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {renderBadge(item.badge, item.badgeColor)}
                  {isActive && (
                    <span className="ml-1 flex h-2 w-2">
                      <span className="animate-ping absolute h-2 w-2 rounded-full bg-blue-300 opacity-75"></span>
                      <span className="relative rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* Navigation - Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  // For better navigation without page reload
                  if (item.href === "/" || item.href.startsWith("/")) {
                    e.preventDefault();
                    window.history.pushState({}, "", item.href);
                    setCurrentActive(item.id);
                    setMobileMenuOpen(false); // Close mobile menu after navigation
                    // Force a refresh event on the window
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                  item.id === currentActive
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </div>
                {renderBadge(item.badge, item.badgeColor)}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}