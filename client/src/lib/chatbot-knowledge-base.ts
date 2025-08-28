export interface KnowledgeBaseEntry {
  keywords: string[];
  response: string;
}

const knowledgeBase: KnowledgeBaseEntry[] = [
  {
    keywords: ["analytics", "engagement", "metrics"],
    response:
      "\uD83D\uDCCA For analytics insights, visit your Analytics page where you can view engagement trends, click-through rates, and performance metrics by date range or platform. You can export reports, compare time periods, and use the data to refine your content strategy. Need help interpreting any metric?",
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
    keywords: ["connection issue", "can't connect", "connection problem", "connect error"],
    response:
      "\uD83D\uDCF6 Having trouble connecting? 1) Verify your internet connection, 2) Reauthenticate the social platform in Settings > Social Connections, 3) Confirm the redirect URI matches the app configuration, and 4) Check if the platform is experiencing outages.",
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
    keywords: ["theme not working", "theme issue", "appearance problem", "design bug"],
    response:
      "\uD83C\uDFA8 If your theme changes aren't applying: 1) Ensure you clicked 'Save' after selecting a theme, 2) Clear your browser cache, 3) Disable conflicting browser extensions, and 4) Try reloading on a different device to rule out local issues.",
  },
  {
    keywords: ["mobile", "phone", "responsive", "mobile issue"],
    response:
      "\uD83D\uDCF1 For mobile display issues: 1) Update to the latest app or browser version, 2) Test in incognito mode to bypass cached styles, 3) Check that your links and widgets are mobile-friendly, and 4) Report persistent problems through Support with screenshots.",
  },
  {
    keywords: ["notification", "email alert", "alerts", "push notification"],
    response:
      "\uD83D\uDD14 Manage notifications in Settings > Notifications where you can enable or disable email alerts for new followers, collaboration requests, and analytics summaries. Customize the frequency or unsubscribe anytime.",
  },
  {
    keywords: ["password", "reset password", "forgot password"],
    response:
      "\uD83D\uDD11 To reset your password, click 'Forgot Password' on the login page, enter your registered email, and follow the link sent to your inbox. If the email doesn't arrive, check spam or request another reset.",
  },
  {
    keywords: ["billing", "subscription", "plan", "payment"],
    response:
      "\uD83D\uDCB3 Billing details and subscription plans live under Settings > Billing. From there you can update payment methods, review invoices, or downgrade/upgrade your plan. Contact Support for payment failures or refunds.",
  },
  {
    keywords: ["bug", "error", "glitch"],
    response:
      "\uD83D\uDEA7 Encountered a bug? Take a screenshot, note the steps to reproduce, and send it via Support > Report a Problem so our team can investigate and fix it quickly.",
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

