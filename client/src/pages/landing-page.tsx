import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { 
  ArrowRight, 
  BarChart2, 
  Award, 
  Link as LinkIcon,
  Share2,
  Smartphone,
  Sparkles,
  Users,
  Zap,
  Star,
  Globe,
  TrendingUp
} from "lucide-react";
const logoPath = "/assets/logo-horizontal.png";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg relative z-10">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={logoPath} 
              alt="MyLinked" 
              className="h-10 w-auto"
              style={{ imageRendering: 'crisp-edges' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.removeAttribute('style');
              }}
            />
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600" style={{ display: 'none' }}>
              MyLinked
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 backdrop-blur-sm border border-transparent hover:border-blue-200 transition-all duration-300"
              onClick={() => navigate("/auth?tab=login")}
            >
              Log in
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl border-0 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              onClick={() => navigate("/auth?tab=register")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 py-4 md:py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-6 py-3 text-sm font-medium text-blue-800 shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Link Management
              </div>
              
              {/* Main Heading */}
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                <span className="block text-gray-900">Create Your</span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-2">
                  Digital Identity
                </span>
                <span className="block text-gray-900">In Minutes</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Build a stunning link-in-bio page that unifies all your social profiles, tracks engagement with AI insights, and grows your audience.
              </p>
              
              {/* Key Features */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center bg-white/80 backdrop-blur-sm border border-white/40 rounded-full px-4 py-2 shadow-sm">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-gray-700">10K+ Creators</span>
                </div>
                <div className="flex items-center bg-white/80 backdrop-blur-sm border border-white/40 rounded-full px-4 py-2 shadow-sm">
                  <BarChart2 className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-gray-700">Real-time Analytics</span>
                </div>
                <div className="flex items-center bg-white/80 backdrop-blur-sm border border-white/40 rounded-full px-4 py-2 shadow-sm">
                  <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-gray-700">AI Optimization</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth?tab=register")}
                  className="group px-8 py-4 text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 rounded-2xl border-0"
                >
                  <Sparkles className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Get Started Free
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              {/* Social Proof */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">B</div>
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">C</div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">D</div>
                </div>
                <span>Join thousands of creators already using MyLinked</span>
              </div>
            </div>
            
            {/* Enhanced Mobile Preview */}
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative mx-auto w-80 h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                {/* Screen */}
                <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 bg-white/90 backdrop-blur-sm">
                    <div className="text-sm font-semibold text-gray-900">9:41</div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                      <div className="w-6 h-2 bg-gray-300 rounded-sm"></div>
                      <div className="w-8 h-2 bg-green-500 rounded-sm"></div>
                    </div>
                  </div>
                  
                  {/* Profile Content */}
                  <div className="px-6 py-4 space-y-4">
                    {/* Profile Header */}
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl mb-4">
                        JD
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">John Doe</h3>
                      <p className="text-sm text-gray-600 mb-2">Digital Creator & Developer</p>
                      <div className="flex items-center justify-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">5.0</span>
                      </div>
                    </div>
                    
                    {/* Social Links */}
                    <div className="space-y-3">
                      {[
                        { name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-600', clicks: '2.4K' },
                        { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600', clicks: '1.8K' },
                        { name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-800', clicks: '892' },
                        { name: 'GitHub', icon: '💻', color: 'from-gray-700 to-gray-900', clicks: '1.2K' },
                        { name: 'Portfolio', icon: '🌐', color: 'from-green-500 to-teal-600', clicks: '756' }
                      ].map((platform, i) => (
                        <div key={platform.name} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105" style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-lg mr-3`}>
                                <span className="text-lg">{platform.icon}</span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{platform.name}</div>
                                <div className="text-xs text-gray-500">{platform.clicks} clicks</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Score Badge */}
                  <div className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-xl">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      <span className="text-sm font-bold">95 Score</span>
                    </div>
                  </div>
                </div>
                
                {/* Phone Details */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full"></div>
              </div>
              

            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">MyLinked provides everything you need to create a powerful link-in-bio page with advanced features.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Social Score</h3>
              <p className="text-gray-600 leading-relaxed">Track your social profile's performance with our AI-powered scoring system. Get personalized tips to improve.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <BarChart2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Analytics</h3>
              <p className="text-gray-600 leading-relaxed">Get detailed insights on profile views, link clicks, and engagement metrics to optimize your online presence.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Multiple View Modes</h3>
              <p className="text-gray-600 leading-relaxed">Choose from different display modes: List, Grid, Story, and Portfolio to showcase your content the way you want.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <LinkIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Smart Link AI</h3>
              <p className="text-gray-600 leading-relaxed">Our AI automatically prioritizes your links based on engagement to maximize clicks and conversions.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <Share2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Collaborative Profiles</h3>
              <p className="text-gray-600">Work together with team members on shared profiles for businesses, groups, or projects.</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Pitch Mode</h3>
              <p className="text-gray-600 leading-relaxed">One-click toggle to transform your profile into a professional pitch deck for potential clients or employers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-700 via-purple-700 to-pink-700 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-300/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">

            
            <h2 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
              Ready to Build Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Digital Empire?
              </span>
            </h2>
            
            <p className="max-w-3xl mx-auto mb-12 text-2xl text-white/90 leading-relaxed font-light">
              Transform your online presence today. Create stunning profiles, track performance, and connect with your audience like never before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?tab=register")}
                className="group px-12 py-6 text-xl bg-white text-gray-800 hover:bg-gray-50 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 rounded-2xl border-0 font-bold"
              >
                <Sparkles className="mr-3 h-6 w-6 text-purple-600 group-hover:rotate-12 transition-transform" />
                Start Free Today
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
              
              <div className="flex items-center text-white/80">
                <div className="flex -space-x-2 mr-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-lg">No credit card required</span>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex justify-center items-center space-x-8 text-white/70">
              <div className="flex items-center">
                <Award className="h-6 w-6 mr-2" />
                <span className="text-lg">Award Winning</span>
              </div>
              <div className="flex items-center">
                <Globe className="h-6 w-6 mr-2" />
                <span className="text-lg">Global Community</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-6 w-6 mr-2" />
                <span className="text-lg">Lightning Fast</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <img 
                  src={logoPath} 
                  alt="MyLinked" 
                  className="h-12 w-auto"
                  style={{ imageRendering: 'crisp-edges' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.removeAttribute('style');
                  }}
                />
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ml-4" style={{ display: 'none' }}>
                  MyLinked
                </div>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-md">
                Empowering creators, professionals, and businesses to build their digital identity and connect with their audience.
              </p>
              <div className="flex space-x-4">
                {['🌟', '💡', '🚀', '❤️'].map((emoji, i) => (
                  <div key={i} className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-white">Quick Links</h3>
              <div className="space-y-4">
                {[
                  { name: 'About Us', href: '/about' },
                  { name: 'Help Center', href: '/support' },
                  { name: 'Contact', href: '/contact' },
                  { name: 'Blog', href: '/blog' }
                ].map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className="block text-lg text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-white">Legal</h3>
              <div className="space-y-4">
                {[
                  { name: 'Privacy Policy', href: '/privacy-policy' },
                  { name: 'Terms of Service', href: '/terms-of-service' },
                  { name: 'Cookie Policy', href: '/cookies' },
                  { name: 'GDPR', href: '/gdpr' }
                ].map((link) => (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className="block text-lg text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t border-white/20 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-lg mb-4 md:mb-0">
              © {new Date().getFullYear()} MyLinked. Crafted with ❤️ for creators worldwide.
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span>All systems operational</span>
              </div>
              <div className="text-sm">
                Made with 🚀 by MyLinked Team
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}