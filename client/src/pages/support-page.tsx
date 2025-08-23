import { useState } from "react";
import { Link as RouterLink } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MessageCircle,
  HelpCircle,
  Book,
  Video,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  Link,
  Shield,
  CreditCard,
  Smartphone,
  Globe,
  Zap,
  ArrowLeft
} from "lucide-react";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
}

const faqData = [
  {
    category: "Getting Started",
    icon: <Book className="h-5 w-5" />,
    questions: [
      {
        question: "How do I create my MyLinked profile?",
        answer: "After signing up, go to your Dashboard and click 'Profile' to customize your public profile. Add your bio, profile picture, and start adding your social media links."
      },
      {
        question: "How do I add social media links?",
        answer: "Navigate to your Dashboard and use the 'Add Link' button. You can add custom links or connect your social media accounts directly for automatic content preview."
      },
      {
        question: "Can I customize my profile appearance?",
        answer: "Yes! Go to Themes in your menu to choose from preset themes like Ocean Blue, Sunset Glow, Forest Green, Midnight Dark, Royal Purple, and Passion Red. Each theme changes your profile's colors and styling."
      }
    ]
  },
  {
    category: "Account & Profile",
    icon: <Users className="h-5 w-5" />,
    questions: [
      {
        question: "How do I change my username or email?",
        answer: "Go to Settings from your profile menu. You can update your username, email, name, and bio from the profile settings section."
      },
      {
        question: "How do I delete my account?",
        answer: "Account deletion can be requested by contacting our support team. We'll help you through the process and ensure all your data is properly removed."
      },
      {
        question: "Can I make my profile private?",
        answer: "Currently, MyLinked profiles are public by design to maximize your networking reach. However, you can control which links and information you choose to display."
      }
    ]
  },
  {
    category: "Social Media Integration",
    icon: <Link className="h-5 w-5" />,
    questions: [
      {
        question: "Which social media platforms are supported?",
        answer: "MyLinked supports Instagram, Facebook, Twitter, TikTok, LinkedIn, and custom links. You can connect these platforms for automatic content preview and engagement tracking."
      },
      {
        question: "Why isn't my social media content showing?",
        answer: "Content preview requires proper OAuth authentication and API access. Some platforms have restrictions - for example, Twitter requires elevated API access for full content display."
      },
      {
        question: "How do I disconnect a social media account?",
        answer: "Go to your Dashboard, find the connected platform in your social connections, and use the disconnect option. This will remove the OAuth connection and stop content syncing."
      }
    ]
  },
  {
    category: "Analytics & Performance",
    icon: <Zap className="h-5 w-5" />,
    questions: [
      {
        question: "How are click-through rates calculated?",
        answer: "CTR is calculated as (total clicks / total profile views) × 100. This helps you understand how engaging your profile is to visitors."
      },
      {
        question: "What is the Social Score?",
        answer: "Your Social Score is an AI-calculated metric based on your profile completeness, engagement rates, and social media activity. It helps you understand your online presence strength."
      },
      {
        question: "Can I see who visited my profile?",
        answer: "MyLinked tracks total profile views for analytics, but individual visitor information is not available to protect user privacy."
      }
    ]
  },
  {
    category: "Themes & Customization",
    icon: <Settings className="h-5 w-5" />,
    questions: [
      {
        question: "How many themes are available?",
        answer: "MyLinked offers 6 preset themes: Ocean Blue, Sunset Glow, Forest Green, Midnight Dark, Royal Purple, and Passion Red. Each theme provides a unique color scheme and styling."
      },
      {
        question: "Can I create custom themes?",
        answer: "Currently, you can choose from our carefully designed preset themes. Custom theme creation may be available in future updates based on user feedback."
      },
      {
        question: "Do themes affect my profile performance?",
        answer: "Themes are purely visual and don't impact your profile's functionality or analytics. Choose the theme that best represents your personal brand."
      }
    ]
  },
  {
    category: "Privacy & Security",
    icon: <Shield className="h-5 w-5" />,
    questions: [
      {
        question: "How is my data protected?",
        answer: "MyLinked uses industry-standard security measures including encrypted data storage, secure OAuth flows, and protected API endpoints. Your personal information is never shared without permission."
      },
      {
        question: "What data do you collect from social media platforms?",
        answer: "We only collect publicly available profile information and recent posts for content preview. We never access private messages or personal data not intended for public display."
      },
      {
        question: "How can I control my privacy settings?",
        answer: "You control what information appears on your profile by choosing which links to add and which social accounts to connect. All connections are optional and can be removed at any time."
      }
    ]
  }
];

const supportChannels = [
  // Removed AI Assistant, Email Support, and Help Documentation cards per user request
];

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("faq");
  const [showUserGuide, setShowUserGuide] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>();

  // Enhanced keyword-based search with relevance scoring
  const getSearchRelevance = (text: string, query: string): number => {
    if (!query) return 0;
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const keywords = normalizedQuery.split(/\s+/).filter(word => word.length > 1);
    
    let score = 0;
    
    // Exact phrase match gets highest score
    if (normalizedText.includes(normalizedQuery)) {
      score += 100;
    }
    
    // Individual keyword matches
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}`, 'gi');
      const matches = normalizedText.match(regex);
      if (matches) {
        score += matches.length * 10;
        
        // Bonus for keyword at start of text
        if (normalizedText.startsWith(keyword)) {
          score += 20;
        }
        
        // Bonus for keyword in title/question
        if (text === text && normalizedText.includes(keyword)) {
          score += 15;
        }
      }
    });
    
    return score;
  };

  const searchResults = searchQuery ? (() => {
    const results: Array<{
      category: typeof faqData[0];
      question: typeof faqData[0]['questions'][0];
      relevance: number;
    }> = [];
    
    faqData.forEach(category => {
      // Check if category should be filtered out
      if (selectedCategory && category.category !== selectedCategory) return;
      
      category.questions.forEach(question => {
        const questionRelevance = getSearchRelevance(question.question, searchQuery);
        const answerRelevance = getSearchRelevance(question.answer, searchQuery);
        const categoryRelevance = getSearchRelevance(category.category, searchQuery);
        
        const totalRelevance = questionRelevance * 2 + answerRelevance + categoryRelevance * 0.5;
        
        if (totalRelevance > 0) {
          results.push({
            category,
            question,
            relevance: totalRelevance
          });
        }
      });
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  })() : [];

  const filteredFAQ = searchQuery 
    ? (() => {
        // Group results by category while maintaining relevance order
        const categoryMap = new Map();
        searchResults.forEach(result => {
          const categoryKey = result.category.category;
          if (!categoryMap.has(categoryKey)) {
            categoryMap.set(categoryKey, {
              ...result.category,
              questions: []
            });
          }
          categoryMap.get(categoryKey).questions.push(result.question);
        });
        return Array.from(categoryMap.values());
      })()
    : selectedCategory 
      ? faqData.filter(cat => cat.category === selectedCategory)
      : faqData;

  const onSubmitContact = async (data: ContactForm) => {
    try {
      console.log('Form submission data:', data);
      
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you within 24 hours.",
        });
        reset();
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error sending message",
        description: "Please try again or use our AI assistant for immediate help.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="relative">
            {/* Dynamic Back Button - Icon Only */}
            <RouterLink href={user ? "/dashboard" : "/"} className="absolute left-0 top-0">
              <Button variant="ghost" size="sm" className="flex items-center hover:bg-background/50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </RouterLink>
            
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get the help you need to make the most of your MyLinked profile
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto mt-8">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {/* Support Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {supportChannels.map((channel, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {channel.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {channel.available}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {channel.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Response: {channel.responseTime}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (channel.action === "Chat Now") {
                            // Open AI chatbot
                            window.dispatchEvent(new CustomEvent('openAIChat'));
                            toast({
                              title: "AI Assistant",
                              description: "Opening AI chatbot for instant help.",
                            });
                          } else if (channel.action === "Send Email") {
                            // Switch to contact tab
                            setActiveTab("contact");
                          } else if (channel.action === "View Docs") {
                            // Switch to resources tab
                            setActiveTab("resources");
                          }
                        }}
                      >
                        {channel.action}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {faqData.map((category) => (
                <Button
                  key={category.category}
                  variant={selectedCategory === category.category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.category)}
                >
                  {category.category}
                </Button>
              ))}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  {searchResults.length === 0 
                    ? `No results found for "${searchQuery}". Try different keywords like "profile", "social", "theme", or "settings".`
                    : `Found ${searchResults.length} relevant result${searchResults.length === 1 ? '' : 's'} for "${searchQuery}" sorted by relevance`
                  }
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                  {searchQuery && searchResults.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Showing most relevant matches first
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* FAQ Content */}
            {searchQuery && searchResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No help articles match your search terms.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try searching for: "profile", "social media", "theme", "username", "links", "settings"
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    View all help topics
                  </Button>
                </CardContent>
              </Card>
            ) : searchQuery ? (
              // Show search results as individual items sorted by relevance
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <Card key={`${result.category.category}-${index}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.category.icon}
                          <Badge variant="secondary" className="text-xs">
                            {result.category.category}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Relevance: {Math.round(result.relevance)}%
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={`search-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            {result.question.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {result.question.answer}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Show all categories when not searching
              filteredFAQ.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      {category.icon}
                      <CardTitle>{category.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`${category.category}-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Contact Support Tab */}
          <TabsContent value="contact" className="space-y-6">
            {/* Support Options Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Email Support */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Email Support</CardTitle>
                  <CardDescription>Get help via email support</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      window.location.href = "mailto:support@mylinked.app";
                      toast({
                        title: "Opening Email",
                        description: "Opening your email client to contact support@mylinked.app",
                      });
                    }}
                  >
                    support@mylinked.com
                  </Button>
                </CardContent>
              </Card>

              {/* Live Chat */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Live Chat</CardTitle>
                  <CardDescription>Chat with our support team instantly</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openAIChat'));
                      toast({
                        title: "Live Chat Started",
                        description: "Opening live chat with our AI assistant",
                      });
                    }}
                  >
                    Start Live Chat
                  </Button>
                </CardContent>
              </Card>

              {/* Phone Support */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">Phone Support</CardTitle>
                  <CardDescription>Call us during business hours</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      window.open("tel:+393792576408");
                      toast({
                        title: "Calling Support",
                        description: "Calling +39 379 257 6408",
                      });
                    }}
                  >
                    +39 379 257 6408
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>
                    We'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Your name"
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Input
                        type="email"
                        placeholder="Your email"
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email address"
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <select
                        className="w-full p-2 border border-input rounded-md bg-background"
                        {...register("priority", { required: "Priority is required" })}
                      >
                        <option value="">Select priority</option>
                        <option value="low">Low - General question</option>
                        <option value="medium">Medium - Account issue</option>
                        <option value="high">High - Technical problem</option>
                        <option value="urgent">Urgent - Account locked/security</option>
                      </select>
                      {errors.priority && (
                        <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>
                      )}
                    </div>

                    <div>
                      <Input
                        placeholder="Subject"
                        {...register("subject", { required: "Subject is required" })}
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <Textarea
                        placeholder="Describe your issue or question..."
                        rows={5}
                        {...register("message", { required: "Message is required" })}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Other ways to reach us</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Response Times</p>
                        <p className="text-sm text-muted-foreground">Usually within 24 hours</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between space-x-3">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Live Chat</p>
                          <p className="text-sm text-muted-foreground">Available 24/7 for instant help</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openAIChat'));
                          toast({
                            title: "Live Chat",
                            description: "Opening AI assistant for instant help.",
                          });
                        }}
                      >
                        Start Live Chat
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between space-x-3">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Phone Support</p>
                          <p className="text-sm text-muted-foreground">Direct phone assistance</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open("tel:+393792576408", "_self");
                          toast({
                            title: "Calling Support",
                            description: "Connecting you to +39 379 257 6408",
                          });
                        }}
                      >
                        Call Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status & Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All systems operational</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Social media integrations online</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Analytics tracking active</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Book className="h-5 w-5" />
                    <span>User Guide</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Complete guide to using MyLinked features
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowUserGuide(true)}
                  >
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="h-5 w-5" />
                    <span>Video Tutorials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Step-by-step video tutorials
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      window.open("https://www.youtube.com/@MyLinked", "_blank");
                      toast({
                        title: "Opening YouTube",
                        description: "Taking you to MyLinked's YouTube channel for video tutorials",
                      });
                    }}
                  >
                    Watch Videos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Mobile App</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Manage your profile on the go
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Mobile app is in development. Download will be available soon!",
                      });
                    }}
                  >
                    Download App
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>API Documentation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Integrate MyLinked with your tools
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "API Documentation",
                        description: "API documentation is currently being prepared. Coming soon!",
                      });
                    }}
                  >
                    View API Docs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Community</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Connect with other MyLinked users
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Community Platform",
                        description: "Community features are being developed. Stay tuned!",
                      });
                    }}
                  >
                    Join Community
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>Known Issues</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Current known issues and workarounds
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Known Issues",
                        description: "Currently no known issues. All systems operational!",
                      });
                    }}
                  >
                    View Issues
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Guide Dialog */}
      <Dialog open={showUserGuide} onOpenChange={setShowUserGuide}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Book className="h-5 w-5" />
              <span>MyLinked User Guide</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              
              {/* Getting Started */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span>Getting Started</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Creating Your Account</h4>
                    <p className="text-sm text-muted-foreground">Sign up with your email and create a unique username that will become part of your MyLinked profile URL.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Setting Up Your Profile</h4>
                    <p className="text-sm text-muted-foreground">Add your name, bio, and profile picture to make your page personal and professional.</p>
                  </div>
                </div>
              </section>

              {/* Adding Links */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span>Adding & Managing Links</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Adding Social Media Links</h4>
                    <p className="text-sm text-muted-foreground">Click "Add Link" and choose from popular platforms like Instagram, Twitter, LinkedIn, TikTok, or add custom URLs.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Link Customization</h4>
                    <p className="text-sm text-muted-foreground">Customize your link titles, descriptions, and order them by dragging and dropping.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Link Analytics</h4>
                    <p className="text-sm text-muted-foreground">Track clicks, views, and engagement rates for each link in your Analytics dashboard.</p>
                  </div>
                </div>
              </section>

              {/* Social Media Integration */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span>Social Media Integration</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Connecting Accounts</h4>
                    <p className="text-sm text-muted-foreground">Connect your Instagram, Facebook, Twitter, and TikTok accounts to display your latest content automatically.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Content Preview</h4>
                    <p className="text-sm text-muted-foreground">Show your latest posts, follower counts, and profile information from connected social platforms.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Social Score</h4>
                    <p className="text-sm text-muted-foreground">Get an AI-calculated social score based on your profile completeness and engagement metrics.</p>
                  </div>
                </div>
              </section>

              {/* Themes & Customization */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <span>Themes & Customization</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Theme Selection</h4>
                    <p className="text-sm text-muted-foreground">Choose from 6 beautiful themes: Ocean Blue, Sunset Glow, Forest Green, Midnight Dark, Royal Purple, and Passion Red.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Profile Customization</h4>
                    <p className="text-sm text-muted-foreground">Customize your profile layout, colors, and styling to match your personal brand.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">View Modes</h4>
                    <p className="text-sm text-muted-foreground">Switch between different view modes to optimize your profile for different audiences.</p>
                  </div>
                </div>
              </section>

              {/* Analytics & Insights */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <span>Analytics & Insights</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Profile Analytics</h4>
                    <p className="text-sm text-muted-foreground">Track total profile views, unique visitors, and engagement over time.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Link Performance</h4>
                    <p className="text-sm text-muted-foreground">See which links perform best with click-through rates and detailed metrics.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">AI Recommendations</h4>
                    <p className="text-sm text-muted-foreground">Get personalized suggestions for improving your profile performance and engagement.</p>
                  </div>
                </div>
              </section>

              {/* Advanced Features */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
                  <span>Advanced Features</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Spotlight Projects</h4>
                    <p className="text-sm text-muted-foreground">Showcase your best work, collaborations, and achievements with dedicated project pages.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Collaboration Tools</h4>
                    <p className="text-sm text-muted-foreground">Connect with other users, find collaboration opportunities, and build your network.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Industry Discovery</h4>
                    <p className="text-sm text-muted-foreground">Discover users in your industry and connect with like-minded professionals.</p>
                  </div>
                </div>
              </section>

              {/* Tips & Best Practices */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">7</div>
                  <span>Tips & Best Practices</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Profile Optimization</h4>
                    <p className="text-sm text-muted-foreground">Use a professional photo, write a compelling bio, and keep your links organized and up-to-date.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Content Strategy</h4>
                    <p className="text-sm text-muted-foreground">Regularly update your social media connections and showcase your best work through Spotlight Projects.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Engagement</h4>
                    <p className="text-sm text-muted-foreground">Use analytics to understand what content resonates with your audience and optimize accordingly.</p>
                  </div>
                </div>
              </section>

              {/* Troubleshooting */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold">8</div>
                  <span>Troubleshooting</span>
                </h3>
                <div className="space-y-3 ml-8">
                  <div>
                    <h4 className="font-medium">Social Media Connection Issues</h4>
                    <p className="text-sm text-muted-foreground">If you're having trouble connecting social accounts, try disconnecting and reconnecting, or check your account permissions.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Profile Not Loading</h4>
                    <p className="text-sm text-muted-foreground">Clear your browser cache or try accessing your profile in an incognito/private browsing window.</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Analytics Not Updating</h4>
                    <p className="text-sm text-muted-foreground">Analytics data may take up to 24 hours to update. If issues persist, contact support.</p>
                  </div>
                </div>
              </section>

            </div>
          </ScrollArea>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowUserGuide(false)}>
              Close Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}