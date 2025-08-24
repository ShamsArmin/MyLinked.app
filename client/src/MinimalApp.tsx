import React, { useState, useEffect } from 'react';
import AnimatedButton from './components/AnimatedButton';
import AnimatedCard from './components/AnimatedCard';
import useNotification from './hooks/useNotification';
import NotificationContainer from './components/NotificationContainer';
import PasswordInput from './components/PasswordInput';
import { BrandingSuggester } from './components/branding-suggester';
import { ViewModeSelector } from './components/view-mode-selector';
import { ListView, GridView, StoryView, PortfolioView } from './components/link-views';
import { SmartLinkAIMinimal } from './components/smart-link-ai-minimal';
import { SocialFeedPreview } from './components/social-feed-preview';
import { CollaborativeProfileMinimal } from './components/collaborative-profile-minimal';
import { Link } from './types';

// Welcome Page Component
function WelcomePage({ onGetStarted }: { onGetStarted: () => void }) {
  // Set up notifications
  const { notifications, success, removeNotification } = useNotification();
  
  // Welcome animation effect on mount
  useEffect(() => {
    // Show a welcome notification after a short delay
    const timer = setTimeout(() => {
      success('Welcome to MyLinked! Get started by creating your profile.', 5000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [success]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <AnimatedCard 
        animation="float" 
        elevation="lg" 
        className="w-full max-w-md bg-white p-6"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 success-animation">Welcome to MyLinked</h1>
          <p className="text-gray-600 slide-in-animation">Your central hub for all your social media links</p>
        </div>
        
        <div className="space-y-4">
          <AnimatedCard 
            animation="pop" 
            elevation="sm" 
            padding="sm" 
            className="bg-blue-50 border border-blue-100"
          >
            <p className="text-blue-800">Share your social media platforms in one place</p>
          </AnimatedCard>
          
          <AnimatedCard 
            animation="pop" 
            elevation="sm" 
            padding="sm" 
            className="bg-green-50 border border-green-100"
          >
            <p className="text-green-800">Track clicks and engagement statistics</p>
          </AnimatedCard>
          
          <AnimatedCard 
            animation="pop" 
            elevation="sm" 
            padding="sm" 
            className="bg-purple-50 border border-purple-100"
          >
            <p className="text-purple-800">Customize your profile with themes and fonts</p>
          </AnimatedCard>
        </div>

        <div className="mt-6">
          <AnimatedButton 
            onClick={onGetStarted}
            variant="primary"
            size="lg"
            animation="pulse"
            className="w-full"
          >
            Get Started
          </AnimatedButton>
        </div>
      </AnimatedCard>
      
      {/* Notification container */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
        position="top-right"
      />
    </div>
  );
}

// Auth Page Component
function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Set up notifications
  const { notifications, error: showError, success: showSuccess, removeNotification } = useNotification();
  
  // Form state for login
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  // Form state for registration
  const [registerForm, setRegisterForm] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  
  // Welcome notification on tab change
  useEffect(() => {
    if (activeTab === 'login') {
      showSuccess('Welcome back! Sign in to continue.', 3000);
    } else {
      showSuccess('Join MyLinked by creating an account.', 3000);
    }
  }, [activeTab, showSuccess]);
  
  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.id]: e.target.value
    });
  };
  
  // Handle register form changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.id.replace('register-', '').replace('confirm-', 'confirm');
    setRegisterForm({
      ...registerForm,
      [fieldName]: e.target.value
    });
  };
  
  // Handle login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Basic validation
    if (!loginForm.username.trim() || !loginForm.password) {
      setErrorMsg('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // For now just simulate a successful login
        console.log('Login form submitted:', loginForm);
        onLogin();
      }, 1000);
      
      // When you're ready to connect to the real API:
      /*
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }
      
      const userData = await response.json();
      console.log('Login successful:', userData);
      onLogin();
      */
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };
  
  // Handle registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Basic validation
    if (!registerForm.username.trim()) {
      setErrorMsg('Please enter a username');
      return;
    }
    
    if (!registerForm.name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    
    if (!registerForm.password) {
      setErrorMsg('Please enter a password');
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // For now just simulate a successful registration
        console.log('Registration form submitted:', registerForm);
        onLogin();
      }, 1000);
      
      // When you're ready to connect to the real API:
      /*
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: registerForm.username,
          name: registerForm.name,
          password: registerForm.password,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Registration failed');
      }
      
      const userData = await response.json();
      console.log('Registration successful:', userData);
      onLogin();
      */
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <AnimatedCard 
        animation="float"
        elevation="lg"
        padding="md"
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 success-animation">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600 slide-in-animation">
            {activeTab === 'login' 
              ? 'Sign in to manage your MyLinked profile' 
              : 'Join MyLinked to create your personal profile'}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <AnimatedButton
            variant={activeTab === 'login' ? 'primary' : 'secondary'}
            className={`py-2 px-4 w-1/2 text-center rounded-none ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium bg-transparent hover:bg-transparent'
                : 'text-gray-500 bg-transparent hover:bg-transparent'
            }`}
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            animation={activeTab === 'login' ? 'pulse' : 'none'}
          >
            Login
          </AnimatedButton>
          <AnimatedButton
            variant={activeTab === 'register' ? 'primary' : 'secondary'}
            className={`py-2 px-4 w-1/2 text-center rounded-none ${
              activeTab === 'register'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium bg-transparent hover:bg-transparent'
                : 'text-gray-500 bg-transparent hover:bg-transparent'
            }`}
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            animation={activeTab === 'register' ? 'pulse' : 'none'}
          >
            Register
          </AnimatedButton>
        </div>
        
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm shake-animation">
            {errorMsg}
          </div>
        )}
        
        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border-pulse"
                placeholder="Enter your username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </div>
            
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              animation="pulse"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </AnimatedButton>
          </form>
        )}
        
        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="register-username"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border-pulse"
                placeholder="Choose a username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border-pulse"
                placeholder="Enter your full name"
                value={registerForm.name}
                onChange={handleRegisterChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Create a password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({
                  ...registerForm,
                  password: e.target.value
                })}
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm_password"
                name="confirmPassword"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Confirm your password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({
                  ...registerForm,
                  confirmPassword: e.target.value
                })}
                required
              />
            </div>
            
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              animation="pulse"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </AnimatedButton>
          </form>
        )}
      </AnimatedCard>
      
      {/* Notification container */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
        position="top-right"
      />
    </div>
  );
}

// Link type is now imported from './types'

// Add Link Dialog Component
function AddLinkDialog({ 
  isOpen, 
  onClose,
  onSave,
  editingLink = null
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSave: (link: {platform: string; title: string; url: string;}) => void;
  editingLink?: Link | null;
}) {
  // Initialize with empty values
  const [formData, setFormData] = useState({
    platform: 'other',
    title: '',
    url: '',
  });

  // Reset form data when the dialog opens or the editingLink changes
  useEffect(() => {
    if (isOpen) {
      if (editingLink) {
        // Populate form with editing link data
        setFormData({
          platform: editingLink.platform,
          title: editingLink.title,
          url: editingLink.url,
        });
      } else {
        // Reset form for new link
        setFormData({
          platform: 'other',
          title: '',
          url: '',
        });
      }
    }
  }, [isOpen, editingLink]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 fade-in">
      <AnimatedCard
        animation="pop"
        elevation="lg"
        padding="lg"
        className="bg-white w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold success-animation">
            {editingLink ? 'Edit Link' : 'Add New Link'}
          </h3>
          <AnimatedButton 
            onClick={onClose}
            variant="secondary"
            size="sm"
            animation="wiggle"
            className="text-gray-500 hover:text-gray-700 h-8 w-8 flex items-center justify-center rounded-full"
          >
            &times;
          </AnimatedButton>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                id="platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-md border-pulse"
                value={formData.platform}
                onChange={handleChange}
                required
              >
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="github">GitHub</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md border-pulse"
                placeholder="e.g. My Instagram Profile"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                id="url"
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md border-pulse"
                placeholder="https://..."
                value={formData.url}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <AnimatedButton 
                type="button"
                onClick={onClose}
                variant="secondary"
                size="md"
                animation="wiggle"
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                variant="primary"
                size="md"
                animation="pulse"
              >
                {editingLink ? 'Save Changes' : 'Add Link'}
              </AnimatedButton>
            </div>
          </div>
        </form>
      </AnimatedCard>
    </div>
  );
}

// Platform Icons Component
function PlatformIcon({ platform }: { platform: string }) {
  // Define an SVG icon wrapper component with animation
  const AnimatedSvgIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="animate-pulse-slow">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </div>
  );

  const getIcon = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return (
          <AnimatedSvgIcon>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </AnimatedSvgIcon>
        );
      case 'twitter':
        return (
          <AnimatedSvgIcon>
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
          </AnimatedSvgIcon>
        );
      case 'facebook':
        return (
          <AnimatedSvgIcon>
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
          </AnimatedSvgIcon>
        );
      case 'linkedin':
        return (
          <AnimatedSvgIcon>
            <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
          </AnimatedSvgIcon>
        );
      case 'youtube':
        return (
          <AnimatedSvgIcon>
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
          </AnimatedSvgIcon>
        );
      case 'github':
        return (
          <AnimatedSvgIcon>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </AnimatedSvgIcon>
        );
      default:
        return (
          <AnimatedSvgIcon>
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
          </AnimatedSvgIcon>
        );
    }
  };

  const getColor = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'text-pink-600';
      case 'twitter':
        return 'text-blue-400';
      case 'facebook':
        return 'text-blue-600';
      case 'linkedin':
        return 'text-blue-700';
      case 'youtube':
        return 'text-red-600';
      case 'github':
        return 'text-gray-800';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <AnimatedCard
      animation="pop"
      padding="none"
      elevation="sm"
      className={`${getColor()} flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:scale-110 transition-transform duration-200`}
    >
      {getIcon()}
    </AnimatedCard>
  );
}

// Dashboard Page Component
function DashboardPage({ onLogout }: { onLogout: () => void }) {
  // Notification system
  const { notifications, success, error, removeNotification } = useNotification();
  
  const [username] = useState('User'); // This would typically come from the backend
  const [links, setLinks] = useState<Link[]>([
    { id: 1, platform: 'github', title: 'My GitHub Profile', url: 'https://github.com', clicks: 12 },
    { id: 2, platform: 'linkedin', title: 'LinkedIn', url: 'https://linkedin.com', clicks: 8 },
    { id: 3, platform: 'twitter', title: 'Twitter', url: 'https://twitter.com', clicks: 5 },
    { id: 4, platform: 'instagram', title: 'My Instagram', url: 'https://instagram.com', clicks: 15 },
    { id: 5, platform: 'youtube', title: 'My YouTube Channel', url: 'https://youtube.com', clicks: 7 },
    { id: 6, platform: 'tiktok', title: 'TikTok', url: 'https://tiktok.com', clicks: 11 },
  ]);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [viewMode, setViewMode] = useState('list'); // View mode state for different layouts
  
  // Smart Link AI states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  // Social Feed states
  const [activeSocialPlatform, setActiveSocialPlatform] = useState<string>('instagram');
  
  // Dashboard tabs
  const [activeTab, setActiveTab] = useState<string>('links');
  
  // Show welcome notification on mount
  useEffect(() => {
    success(`Welcome back, ${username}! Manage your links here.`, 4000);
  }, []);
  
  const handleAddLink = () => {
    setEditingLink(null);
    setIsAddLinkOpen(true);
  };
  
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsAddLinkOpen(true);
  };
  
  const handleSaveLink = (linkData: Omit<Link, 'id' | 'clicks'>) => {
    if (editingLink) {
      // Edit existing link
      setLinks(links.map(link => 
        link.id === editingLink.id 
          ? { ...link, ...linkData } 
          : link
      ));
      success(`Your ${linkData.platform} link has been updated!`, 3000);
    } else {
      // Add new link
      const newLink: Link = {
        id: Math.max(0, ...links.map(l => l.id)) + 1,
        clicks: 0,
        ...linkData
      };
      setLinks([...links, newLink]);
      success(`Your ${linkData.platform} link has been added!`, 3000);
    }
  };
  
  const handleDeleteLink = (id: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      const linkToDelete = links.find(link => link.id === id);
      setLinks(links.filter(link => link.id !== id));
      if (linkToDelete) {
        success(`Your ${linkToDelete.platform} link has been deleted.`, 3000);
      }
    }
  };
  
  const handleLogout = () => {
    // Add any logout logic here
    onLogout();
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">MyLinked</h1>
          <AnimatedButton 
            onClick={handleLogout}
            variant="secondary"
            size="sm"
            className="px-3 py-1 text-sm"
          >
            Sign Out
          </AnimatedButton>
        </div>
      </header>
      
      {/* Notification container */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
        position="top-right"
      />
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Welcome, {username}!</h2>
          <p className="text-gray-600">
            This is your MyLinked dashboard. Here you can manage your social media links, 
            view analytics, and customize your profile.
          </p>
        </div>
        
        {/* Dashboard Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'links'
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              My Links
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'ai'
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Features
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('collaborations')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'collaborations'
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Collaborations
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Stats
            </div>
          </button>
        </div>
        
        {/* Tab Content */}
        {/* Links Tab */}
        {activeTab === 'links' && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Your Links</h3>
                <AnimatedButton 
                  onClick={handleAddLink}
                  variant="primary"
                  size="sm"
                  className="flex items-center"
                >
                  <span className="mr-1">+</span> Add New Link
                </AnimatedButton>
              </div>
              
              {/* Simple View Mode Selector */}
              {links.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-2 mb-4">
                  <div className="flex flex-wrap justify-center gap-1">
                    <button
                      onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="text-sm">List</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4zm-10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span className="text-sm">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('story')}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${
                    viewMode === 'story' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-sm">Story</span>
                </button>
                <button
                  onClick={() => setViewMode('portfolio')}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${
                    viewMode === 'portfolio' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span className="text-sm">Portfolio</span>
                </button>
              </div>
            </div>
          )}
          
          {links.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Ready to add your first link?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start building your personalized profile by adding links to your social media accounts and websites.
              </p>
              <button 
                onClick={handleAddLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Your First Link
              </button>
            </div>
          ) : (
            <>
              {/* List View - Default view */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {links.map((link) => (
                    <div 
                      key={link.id} 
                      className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      {/* Left side: Platform icon, title, and URL */}
                      <div className="flex items-start overflow-hidden">
                        <div className="flex-shrink-0">
                          <PlatformIcon platform={link.platform} />
                        </div>
                        <div className="ml-4 min-w-0 overflow-hidden max-w-full">
                          <h4 className="font-medium truncate">{link.title}</h4>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-600 hover:underline truncate block"
                            title={link.url}
                          >
                            {link.url}
                          </a>
                        </div>
                      </div>
                      
                      {/* Right side: Clicks counter and action buttons */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                        <div className="text-sm text-gray-500 mr-2">
                          {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                        </div>
                        <div className="flex shrink-0 space-x-2">
                          <button 
                            onClick={() => handleEditLink(link)}
                            className="p-1 text-gray-500 hover:text-blue-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 text-gray-500 hover:text-red-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {links.map((link) => (
                    <div 
                      key={link.id} 
                      className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <PlatformIcon platform={link.platform} />
                        
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleEditLink(link)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-medium text-lg mb-1 truncate">{link.title}</h4>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline truncate block mb-4"
                          title={link.url}
                        >
                          {link.url}
                        </a>
                      </div>
                      
                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                        </div>
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Visit Link →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Story View */}
              {viewMode === 'story' && (
                <div className="flex overflow-x-auto gap-4 py-2 pb-4 -mx-4 px-4 snap-x">
                  {links.map((link) => (
                    <div 
                      key={link.id} 
                      className="flex-shrink-0 w-64 h-96 snap-start rounded-2xl shadow-md border overflow-hidden flex flex-col bg-gradient-to-b from-gray-50 to-white"
                    >
                      {/* Header with icon and buttons */}
                      <div className="flex items-center justify-between p-4 border-b">
                        <PlatformIcon platform={link.platform} />
                        
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleEditLink(link)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Card content */}
                      <div className="flex-1 p-4 flex flex-col">
                        <h4 className="font-bold text-xl mb-2">{link.title}</h4>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline mb-4 break-all"
                          title={link.url}
                        >
                          {link.url}
                        </a>
                        
                        <div className="text-sm text-gray-500 mt-auto mb-2">
                          {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                        </div>
                      </div>
                      
                      {/* Card footer */}
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-2 text-center bg-white rounded-md font-medium text-blue-600 hover:bg-gray-50 transition-colors"
                        >
                          Visit Link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Portfolio View */}
              {viewMode === 'portfolio' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {links.map((link) => (
                      <div 
                        key={link.id} 
                        className="relative group"
                      >
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg aspect-square flex items-center justify-center shadow-sm overflow-hidden">
                          <div className="transform transition-transform group-hover:scale-110">
                            <PlatformIcon platform={link.platform} />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <div className="flex flex-col gap-2">
                            <a 
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-white rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
                            >
                              Visit
                            </a>
                            <div className="flex gap-1 justify-center">
                              <button 
                                onClick={() => handleEditLink(link)}
                                className="p-1 text-white hover:text-blue-300 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteLink(link.id)}
                                className="p-1 text-white hover:text-red-300 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <h4 className="font-medium text-sm truncate">{link.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{link.clicks} clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-3">Link Details</h3>
                    <div className="space-y-4">
                      {links.map((link) => (
                        <div key={link.id} className="flex justify-between items-center p-2 hover:bg-white rounded transition-colors">
                          <div className="flex items-center">
                            <div className="mr-3">
                              <PlatformIcon platform={link.platform} />
                            </div>
                            <div>
                              <h4 className="font-medium">{link.title}</h4>
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-blue-600 hover:underline truncate block max-w-[200px] sm:max-w-[300px]"
                              >
                                {link.url}
                              </a>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Analytics Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-700 mb-1">Total Links</div>
              <div className="text-2xl font-bold">{links.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm text-green-700 mb-1">Total Clicks</div>
              <div className="text-2xl font-bold">{links.reduce((sum, link) => sum + link.clicks, 0)}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-purple-700 mb-1">Social Score</div>
              <div className="text-2xl font-bold">72</div>
            </div>
          </div>
        </div>
        
        {/* Live Social Feed */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-6 border-2 border-blue-300 relative animate-fade-in">
          
          <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Live Social Feed
          </h2>
          
          <p className="mb-4 text-blue-600">View your latest posts from Instagram, TikTok, and YouTube directly in your profile.</p>
          
          {/* Platform tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {['instagram', 'tiktok', 'youtube'].map(platform => (
              <button
                key={platform}
                onClick={() => setActiveSocialPlatform(platform)}
                className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                  activeSocialPlatform === platform 
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Instagram content */}
          {activeSocialPlatform === 'instagram' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative pb-[100%]">
                  <img 
                    src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3"
                    alt="Instagram post"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-500">2h ago • 132 likes</p>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative pb-[100%]">
                  <img 
                    src="https://images.unsplash.com/photo-1516575150278-77136aed6920"
                    alt="Instagram post"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-500">1d ago • 254 likes</p>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative pb-[100%]">
                  <img 
                    src="https://images.unsplash.com/photo-1604537372111-13b1899b4044"
                    alt="Instagram post"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-500">3d ago • 432 likes</p>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative pb-[100%]">
                  <img 
                    src="https://images.unsplash.com/photo-1514222134-b57cbb8ce073"
                    alt="Instagram post"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-500">1w ago • 189 likes</p>
                </div>
              </div>
            </div>
          )}
          
          {/* TikTok content */}
          {activeSocialPlatform === 'tiktok' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-black">
                <div className="relative pb-[177%]">
                  <img 
                    src="https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b"
                    alt="TikTok video"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <p className="text-xs text-white font-medium">Dance tutorial #viral</p>
                    <p className="text-xs text-gray-300">5.4K likes</p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-black">
                <div className="relative pb-[177%]">
                  <img 
                    src="https://images.unsplash.com/photo-1601532668944-8e483d448e20"
                    alt="TikTok video"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <p className="text-xs text-white font-medium">Day in my life #dayinmylife</p>
                    <p className="text-xs text-gray-300">3.2K likes</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* YouTube content */}
          {activeSocialPlatform === 'youtube' && (
            <div>
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                <div className="relative pb-[56.25%]">
                  <img 
                    src="https://images.unsplash.com/photo-1580985927276-33a482205b4a"
                    alt="YouTube video"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-600 bg-opacity-80 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-1 py-0.5 text-white text-xs rounded">
                    12:45
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <h3 className="font-medium truncate">How I Built My Website | Tutorial</h3>
                  <p className="text-xs text-gray-500 mt-1">14K views • 1 week ago</p>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative pb-[56.25%]">
                  <img 
                    src="https://images.unsplash.com/photo-1603731595918-8f479655496b"
                    alt="YouTube video"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-600 bg-opacity-80 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-1 py-0.5 text-white text-xs rounded">
                    18:32
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <h3 className="font-medium truncate">Day In My Life as a Developer | Vlog</h3>
                  <p className="text-xs text-gray-500 mt-1">8.2K views • 2 weeks ago</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <a 
              href={`https://${activeSocialPlatform}.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              View all {activeSocialPlatform} content
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        
        {/* Collaborative Profiles */}
        <div className="mt-6">
          <CollaborativeProfileMinimal currentUser={{ id: 1, username: username }} />
        </div>
        
        {/* AI Features and Social Feed Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 relative">
          <div className="bg-white rounded-lg shadow-md p-6">
            <BrandingSuggester />
          </div>
          
          {/* Inline Smart Link AI Component */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Smart Link AI
              </h3>
              <p className="text-sm text-gray-600">
                Optimize your links based on visitor engagement patterns
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                AI will analyze your link click patterns and optimize the display order for maximum engagement.
              </p>
            </div>
            
            <button 
              onClick={() => {
                setIsOptimizing(true);
                
                // Simulate AI processing with a timeout
                setTimeout(() => {
                  // Sort by clicks (this is a simple implementation; in a real app, you'd use OpenAI API)
                  const optimizedLinks = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
                  
                  // Generate insights
                  let insights = "Here's what our AI analysis found:\n\n";
                  insights += "1. Your Instagram link gets the most engagement (15 clicks)\n";
                  insights += "2. Your GitHub profile is your second most popular link (12 clicks)\n";
                  insights += "3. LinkedIn and Twitter have lower engagement\n\n";
                  insights += "Recommendation: We've rearranged your links to prioritize high-performing ones at the top.";
                  
                  setLinks(optimizedLinks);
                  setAiInsights(insights);
                  setIsOptimizing(false);
                  setShowAiInsights(true);
                  
                  // Show success notification
                  success("Links optimized by AI based on engagement data", 4000);
                }, 1500);
              }}
              disabled={isOptimizing}
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isOptimizing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isOptimizing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : "Optimize with AI"}
            </button>
          </div>
        </div>
        
      </main>
      
      {/* Add/Edit Link Dialog */}
      <AddLinkDialog 
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        onSave={handleSaveLink}
        editingLink={editingLink}
      />
      
      {/* AI Insights Dialog */}
      {showAiInsights && aiInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Smart Link AI Insights
              </h3>
              <button 
                onClick={() => setShowAiInsights(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <div className="whitespace-pre-line text-blue-800">
                {aiInsights}
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAiInsights(false)}
                className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
}

// Main App Component with Navigation
function MinimalApp() {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'auth' | 'dashboard'>('welcome');
  
  const navigateToAuth = () => setCurrentPage('auth');
  const navigateToDashboard = () => setCurrentPage('dashboard');
  const navigateToWelcome = () => setCurrentPage('welcome');
  
  return (
    <>
      {currentPage === 'welcome' && <WelcomePage onGetStarted={navigateToAuth} />}
      {currentPage === 'auth' && <AuthPage onLogin={navigateToDashboard} />}
      {currentPage === 'dashboard' && <DashboardPage onLogout={navigateToWelcome} />}
    </>
  );
}

export default MinimalApp;