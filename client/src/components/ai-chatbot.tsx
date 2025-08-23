import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Minus, Send, Bot, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  showQuickActions: boolean;
}

const quickActions = [
  { text: "How to optimize my profile?", icon: "✨" },
  { text: "Fix connection issues", icon: "🔧" },
  { text: "Improve social score", icon: "📊" },
  { text: "Theme not working", icon: "🎨" },
  { text: "Mobile issues", icon: "📱" },
  { text: "Analytics help", icon: "📈" },
];

export function AIChatbot() {
  const [state, setState] = useState<ChatbotState>({
    isOpen: false,
    isMinimized: false,
    messages: [
      {
        id: "welcome",
        content: "Hello! I'm your intelligent MyLinked assistant. I can help you optimize your profile, troubleshoot issues, improve your social score, and much more. What would you like to work on today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ],
    inputValue: "",
    isLoading: false,
    showQuickActions: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Listen for openAIChat events from the support page
  useEffect(() => {
    const handleOpenAIChat = () => {
      setState((prev) => ({
        ...prev,
        isOpen: true,
        isMinimized: false,
      }));
    };

    window.addEventListener('openAIChat', handleOpenAIChat);
    
    return () => {
      window.removeEventListener('openAIChat', handleOpenAIChat);
    };
  }, []);

  const handleToggleOpen = () => {
    setState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false,
    }));
  };

  const handleMinimize = () => {
    setState((prev) => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  };

  const handleClose = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
    }));
  };

  const handleSendMessage = async () => {
    if (!state.inputValue.trim() || state.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: state.inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputValue: "",
      isLoading: true,
    }));

    try {
      // Get AI response
      const aiResponse = await getAIResponse(userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing some technical difficulties. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  };

  const getAIResponse = async (userInput: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai-support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          context: "social_media_platform",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      return data.response || "I'm having trouble processing your request right now. Please try again.";
    } catch (error) {
      console.error("AI Response Error:", error);
      // Fallback to intelligent local responses
      return getIntelligentFallback(userInput);
    }
  };

  const getIntelligentFallback = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Social media management queries
    if (input.includes("analytics") || input.includes("engagement") || input.includes("metrics")) {
      return "📊 For analytics insights, visit your Analytics page where you can view engagement trends, click-through rates, and performance metrics. I can also help optimize your content strategy based on your data.";
    }
    
    if (input.includes("profile") || input.includes("optimize") || input.includes("bio")) {
      return "✨ To optimize your profile: 1) Add a compelling bio under 160 characters, 2) Use a professional profile image, 3) Connect all your social platforms, 4) Enable pitch mode for better presentation. Need help with any specific area?";
    }
    
    if (input.includes("social score") || input.includes("score")) {
      return "🎯 Your Social Score is calculated based on profile completeness, link engagement, social connections, and content quality. To improve it: complete your profile, add more social links, and encourage clicks on your content.";
    }
    
    if (input.includes("links") || input.includes("add link") || input.includes("social media")) {
      return "🔗 To manage your links: Go to 'My Links' section where you can add social media profiles, custom links, and referral links. I recommend organizing them by priority and using compelling descriptions.";
    }
    
    if (input.includes("collaboration") || input.includes("networking")) {
      return "🤝 Use the Collaboration section to connect with other creators, showcase spotlight projects, and manage partnership requests. This helps expand your network and create meaningful professional relationships.";
    }
    
    if (input.includes("theme") || input.includes("design") || input.includes("appearance")) {
      return "🎨 Customize your appearance in Themes where you can choose colors, fonts, and layout styles. Pick themes that match your brand identity and professional image.";
    }
    
    if (input.includes("pitch mode") || input.includes("presentation")) {
      return "🎤 Pitch Mode creates a professional presentation of your profile. Configure it in Settings to highlight your expertise, focus areas, and key achievements for potential clients or collaborators.";
    }
    
    if (input.includes("problem") || input.includes("issue") || input.includes("not working")) {
      return "🔧 I can help troubleshoot issues! Common solutions: 1) Refresh the page, 2) Clear browser cache, 3) Check your internet connection, 4) Try a different browser. What specific problem are you experiencing?";
    }
    
    if (input.includes("how to") || input.includes("tutorial") || input.includes("guide")) {
      return "📚 I can provide step-by-step guidance for any MyLinked feature. What would you like to learn? Popular topics: setting up profiles, optimizing for engagement, using analytics, or managing collaborations.";
    }
    
    // Greeting responses
    if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
      return "Hello! I'm your intelligent MyLinked assistant. I can help you optimize your profile, understand analytics, manage social links, troubleshoot issues, and boost your social presence. What would you like to work on today?";
    }
    
    // General help
    if (input.includes("help") || input.includes("what can you do")) {
      return "🚀 I can assist with: Profile optimization, Analytics insights, Social Score improvement, Link management, Collaboration networking, Theme customization, Pitch Mode setup, Troubleshooting, and Strategic advice. What specific area interests you?";
    }
    
    // Default intelligent response
    return `I understand you're asking about "${userInput}". I can provide specific guidance on MyLinked features, optimization strategies, or troubleshooting. Could you tell me more about what you're trying to accomplish or what specific help you need?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (actionText: string) => {
    setState((prev) => ({ ...prev, showQuickActions: false }));
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: actionText,
      sender: "user",
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const aiResponse = await getAIResponse(actionText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error with quick action:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (!state.isOpen) {
    return (
      <Button
        onClick={handleToggleOpen}
        className="fixed bottom-14 right-4 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-14 right-4 w-80 h-96 shadow-xl z-50 transition-all duration-200",
        state.isMinimized && "h-12"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMinimize}
            className="h-6 w-6 text-white hover:bg-blue-700"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 text-white hover:bg-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!state.isMinimized && (
        <CardContent className="flex flex-col h-full p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {state.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2",
                  message.sender === "user" && "flex-row-reverse space-x-reverse"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    message.sender === "user"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {message.sender === "user" ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[70%] p-2 rounded-lg text-sm",
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {state.isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-gray-100 text-gray-800 p-2 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {state.showQuickActions && state.messages.length === 1 && (
            <div className="border-t px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Quick Actions</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickAction(action.text)}
                    className="justify-start text-left h-auto py-2 px-3 text-xs"
                    disabled={state.isLoading}
                  >
                    <span className="mr-2">{action.icon}</span>
                    {action.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={state.inputValue}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, inputValue: e.target.value }))
                }
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={state.isLoading}
                className="flex-1"
              />
              {!state.showQuickActions && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setState((prev) => ({ ...prev, showQuickActions: true }))}
                  disabled={state.isLoading}
                  title="Show quick actions"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleSendMessage}
                disabled={state.isLoading || !state.inputValue.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}