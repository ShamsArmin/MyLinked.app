export interface KnowledgeBaseEntry {
  keywords: string[];
  response: string;
}

const knowledgeBase: KnowledgeBaseEntry[] = [
  {
    keywords: ["analytics", "engagement", "metrics"],
    response:
      "\uD83D\uDCCA For analytics insights, visit your Analytics page where you can view engagement trends, click-through rates, and performance metrics. I can also help optimize your content strategy based on your data.",
  },
  {
    keywords: ["profile", "optimize", "bio"],
    response:
      "\u2728 To optimize your profile: 1) Add a compelling bio under 160 characters, 2) Use a professional profile image, 3) Connect all your social platforms, 4) Enable pitch mode for better presentation. Need help with any specific area?",
  },
  {
    keywords: ["social score", "score"],
    response:
      "\uD83C\uDFAF Your Social Score is calculated based on profile completeness, link engagement, social connections, and content quality. To improve it: complete your profile, add more social links, and encourage clicks on your content.",
  },
  {
    keywords: ["links", "add link", "social media"],
    response:
      "\uD83D\uDD17 To manage your links: Go to 'My Links' section where you can add social media profiles, custom links, and referral links. I recommend organizing them by priority and using compelling descriptions.",
  },
  {
    keywords: ["collaboration", "networking"],
    response:
      "\uD83E\uDD1D Use the Collaboration section to connect with other creators, showcase spotlight projects, and manage partnership requests. This helps expand your network and create meaningful professional relationships.",
  },
  {
    keywords: ["theme", "design", "appearance"],
    response:
      "\uD83C\uDFA8 Customize your appearance in Themes where you can choose colors, fonts, and layout styles. Pick themes that match your brand identity and professional image.",
  },
  {
    keywords: ["pitch mode", "presentation"],
    response:
      "\uD83C\uDFA4 Pitch Mode creates a professional presentation of your profile. Configure it in Settings to highlight your expertise, focus areas, and key achievements for potential clients or collaborators.",
  },
  {
    keywords: ["oauth", "connection", "connect", "disconnect"],
    response:
      "\uD83D\uDD10 OAuth connections let MyLinked securely access social platforms. Visit Settings > Social Connections to connect or disconnect accounts. Ensure proper permissions are granted and check platform-specific requirements.",
  },
  {
    keywords: ["api", "developer"],
    response:
      "\uD83D\uDEE0\uFE0F Our platform uses several APIs for social media integration. If you're experiencing API issues, verify your credentials, rate limits, and ensure the platform's API status is operational.",
  },
  {
    keywords: ["privacy", "data", "security"],
    response:
      "\uD83D\uDD12 We protect your data with industry-standard security including encrypted storage and secure OAuth flows. Control what you share by managing connected accounts and links in Settings.",
  },
  {
    keywords: ["account", "delete", "username", "email"],
    response:
      "\uD83D\uDC64 Account settings allow updating username, email, or requesting account deletion via Support. Navigate to Settings to manage these options.",
  },
  {
    keywords: ["problem", "issue", "not working"],
    response:
      "\uD83D\uDD27 I can help troubleshoot issues! Common solutions: 1) Refresh the page, 2) Clear browser cache, 3) Check your internet connection, 4) Try a different browser. What specific problem are you experiencing?",
  },
  {
    keywords: ["how to", "tutorial", "guide"],
    response:
      "\uD83D\uDCD6 I can provide step-by-step guidance for any MyLinked feature. What would you like to learn? Popular topics: setting up profiles, optimizing for engagement, using analytics, or managing collaborations.",
  },
  {
    keywords: ["hello", "hi", "hey"],
    response:
      "Hello! I'm your intelligent MyLinked assistant. I can help you optimize your profile, understand analytics, manage social links, troubleshoot issues, and boost your social presence. What would you like to work on today?",
  },
  {
    keywords: ["help", "what can you do"],
    response:
      "\uD83D\uDE80 I can assist with: Profile optimization, Analytics insights, Social Score improvement, Link management, Collaboration networking, Theme customization, Pitch Mode setup, OAuth connections, and troubleshooting. What specific area interests you?",
  },
];

export function searchKnowledgeBase(userInput: string): string | undefined {
  const input = userInput.toLowerCase();
  const match = knowledgeBase.find((entry) =>
    entry.keywords.some((keyword) => input.includes(keyword))
  );
  return match?.response;
}

export function getGenericFallback(userInput: string): string {
  return `I understand you're asking about "${userInput}". I can provide specific guidance on MyLinked features, optimization strategies, or troubleshooting. Could you tell me more about what you're trying to accomplish or what specific help you need?`;
}

