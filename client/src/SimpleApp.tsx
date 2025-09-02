import React, { useState, useEffect } from 'react';

// Simple pages without complex dependencies
function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">MyLinked</h1>
          <p className="text-gray-600">All your social links in one place</p>
        </div>
        
        <div className="mb-8">
          <p className="text-gray-700 mb-2">✓ Create a personalized profile</p>
          <p className="text-gray-700 mb-2">✓ Add all your social media links</p>
          <p className="text-gray-700">✓ Track engagement with analytics</p>
        </div>

        <button 
          onClick={onLoginClick}
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

function AuthPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id.replace('reg-', '')]: e.target.value
    });
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Real API call instead of simulation
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }
      
      const userData = await response.json();
      console.log('Login successful', userData);
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      // Real API call for registration
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Registration failed');
      }
      
      const userData = await response.json();
      console.log('Registration successful', userData);
      onLoginSuccess();
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Hero Section */}
      <div className="bg-blue-600 p-8 md:w-1/2 flex flex-col justify-center text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">MyLinked</h1>
          <p className="text-xl mb-6">
            Your centralized hub for all your social links.
          </p>
          <div className="space-y-4">
            <p>✓ Simple profile customization</p>
            <p>✓ Track analytics and engagement</p>
            <p>✓ Collaborative profiles & following system</p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="p-8 md:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600 mt-2">
              {activeTab === "login"
                ? "Sign in to manage your MyLinked profile"
                : "Join MyLinked to create your personal profile"}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b">
              <button
                className={`py-2 px-4 w-1/2 text-center ${
                  activeTab === "login"
                    ? "border-b-2 border-blue-500 text-blue-500 font-medium"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                className={`py-2 px-4 w-1/2 text-center ${
                  activeTab === "register"
                    ? "border-b-2 border-blue-500 text-blue-500 font-medium"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("register")}
              >
                Register
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ onLogout }: { onLogout: () => void }) {
  const [username, setUsername] = useState<string>('');
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        setUsername(userData.username);
        
        // Fetch user's links
        const linksResponse = await fetch('/api/links', {
          credentials: 'include'
        });
        
        if (linksResponse.ok) {
          const linksData = await linksResponse.json();
          setLinks(linksData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        onLogout();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">MyLinked</h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {isLoading ? 'Loading...' : `Welcome, ${username}!`}
            </h2>
            <p className="text-gray-600 mb-6">
              You're now logged into your MyLinked account. This dashboard allows you to manage your profile and links.
            </p>
          </div>
          
          {/* Links Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Your Links</h3>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Add New Link
              </button>
            </div>
            
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Loading your links...</p>
            ) : links.length > 0 ? (
              <div className="space-y-4">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{link.title}</h4>
                      <p className="text-sm text-gray-500">{link.url}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-blue-500">
                        Edit
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Ready to add your first link?</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start building your personalized profile by adding links to your social media accounts and websites.
                </p>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Your First Link
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Check if user is already authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          // User is authenticated
          setPage('dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const showAuth = () => setPage('auth');
  const showDashboard = () => setPage('dashboard');
  const logout = () => setPage('landing');
  
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <>
      {page === 'landing' && <LandingPage onLoginClick={showAuth} />}
      {page === 'auth' && <AuthPage onLoginSuccess={showDashboard} />}
      {page === 'dashboard' && <DashboardPage onLogout={logout} />}
    </>
  );
}

export default App;