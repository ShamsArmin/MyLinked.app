import OpenAI from "openai";
import { User, Link, ProfileStats, UserSkill } from "../shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user.
const OPENAI_MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze link click data and suggest optimal ordering with insights
 */
export async function suggestLinkPriority(
  links: { id: number; platform: string; title: string; url: string; clicks: number; views: number }[],
  totalProfileViews: number
): Promise<{ linkScores: { id: number; score: number }[]; insights: string[] }> {
  try {
    if (!links || links.length === 0) {
      return { linkScores: [], insights: [] };
    }

    // Format links data for analysis
    const linksData = links.map((link) => ({
      id: link.id,
      platform: link.platform,
      title: link.title,
      url: link.url,
      clicks: link.clicks || 0,
      views: link.views || 0,
      ctr: link.views > 0 ? (link.clicks / link.views) * 100 : 0,
    }));

    const systemPrompt = `
      You are an expert analytics AI assistant for a link-in-bio profile tool similar to Linktree.
      Your task is to analyze user's social links click data and suggest the optimal ordering of links
      to maximize engagement.
      
      Please analyze:
      - Click performance (higher clicks should generally rank higher)
      - Click-through rates (higher CTR is better)
      - Platform importance (some platforms might be more valuable even with lower clicks)
      - Link freshness (newer links might need more visibility)
      
      Return your response as JSON with:
      1. "linkScores": An array of objects with "id" (number) and "score" (number from 0-100) fields.
         Higher scores should appear first on the profile.
      2. "insights": An array of 3-5 strings with actionable insights about the link performance.
    `;

    // Try OpenAI API first
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              links: linksData,
              totalProfileViews: totalProfileViews,
            }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '{}';
      const result = JSON.parse(content);

      if (!result.linkScores || !result.insights) {
        throw new Error("Invalid response format from OpenAI");
      }

      return {
        linkScores: result.linkScores,
        insights: result.insights,
      };
    } catch (apiError) {
      // If OpenAI API fails, use intelligent fallback logic
      console.log("OpenAI API unavailable, using smart fallback for link optimization");
      
      // Smart scoring algorithm based on engagement metrics
      const linkScores = linksData.map((link) => {
        let score = 50; // Base score
        
        // Click performance (0-25 points)
        if (link.clicks > 0) {
          score += Math.min(25, link.clicks * 2);
        }
        
        // Click-through rate (0-20 points)
        if (link.ctr > 0) {
          score += Math.min(20, link.ctr * 2);
        }
        
        // Platform importance (0-15 points)
        const platformBonus = {
          'linkedin': 15,
          'twitter': 12,
          'instagram': 10,
          'youtube': 12,
          'tiktok': 8,
          'facebook': 8,
          'github': 10,
          'website': 12,
          'email': 10
        };
        score += platformBonus[link.platform.toLowerCase()] || 5;
        
        // Ensure score is within bounds
        return {
          id: link.id,
          score: Math.max(30, Math.min(95, score))
        };
      });
      
      // Generate insights based on data analysis
      const insights = [];
      const sortedLinks = linksData.sort((a, b) => b.clicks - a.clicks);
      const topPerformer = sortedLinks[0];
      
      if (topPerformer && topPerformer.clicks > 0) {
        insights.push(`Your ${topPerformer.platform} link is performing best with ${topPerformer.clicks} clicks.`);
      }
      
      const highCTRLinks = linksData.filter(link => link.ctr > 3);
      if (highCTRLinks.length > 0) {
        insights.push(`${highCTRLinks.length} of your links have great engagement rates above 3%.`);
      }
      
      const professionalLinks = linksData.filter(link => 
        ['linkedin', 'github', 'website'].includes(link.platform.toLowerCase())
      );
      if (professionalLinks.length > 0) {
        insights.push("Your professional links (LinkedIn, GitHub, Website) help build credibility.");
      }
      
      const socialLinks = linksData.filter(link => 
        ['instagram', 'twitter', 'tiktok', 'youtube'].includes(link.platform.toLowerCase())
      );
      if (socialLinks.length > 0) {
        insights.push("Social media links are great for building personal connections.");
      }
      
      insights.push("Consider featuring your most-clicked links at the top of your profile.");
      
      return {
        linkScores,
        insights: insights.slice(0, 4) // Return max 4 insights
      };
    }
  } catch (error) {
    console.error("Error suggesting link priority:", error);
    throw error;
  }
}

/**
 * Generate AI suggestions to improve a single link's title and description
 */
export async function generateLinkContentSuggestions(
  link: Link
): Promise<{ title: string; description: string; aiScore: number }> {
  try {
    const systemPrompt = `You are an AI copywriter for a link-in-bio tool.
Generate a more compelling and unique title and description for the provided link.
Return JSON with { "title": string, "description": string, "aiScore": number }.
Title must be different from the original and 5 words or fewer.
Description must be under 20 words and not repeat the title.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            title: link.title,
            description: link.description || "",
            platform: link.platform,
            url: link.url,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content || "{}";
    const data = JSON.parse(content);

    if (!data.title || !data.description) {
      throw new Error("Invalid response format from OpenAI");
    }

    return {
      title: data.title,
      description: data.description,
      aiScore: typeof data.aiScore === "number" ? data.aiScore : 80,
    };
  } catch (error) {
    console.error("generateLinkContentSuggestions error:", error);
    const fallbackTitle = `Improved ${link.title}`;
    const fallbackDescription = link.description
      ? `${link.description} (updated)`
      : `Learn more about ${link.platform}`;
    return { title: fallbackTitle, description: fallbackDescription, aiScore: 70 };
  }
}

/**
 * Generate personalized branding suggestions based on user profile and links
 */
export async function generateBrandingSuggestions(
  profile: {
    username: string;
    name: string;
    bio: string;
    profession: string;
    interests: string[];
    socialAccounts: string[];
  },
  links: Link[]
): Promise<{
  colorPalette: { primary: string; secondary: string; accent: string };
  tagline: string;
  profileBio: string;
  imageryThemes: string[];
  fontRecommendations: string[];
}> {
  try {
    const systemPrompt = `
      You are a personal branding expert AI for a link-in-bio profile tool similar to Linktree.
      Your task is to analyze a user's profile and social links to provide personalized branding suggestions.
      
      Provide branding suggestions that are:
      - Consistent with the user's existing online presence
      - Professional yet distinctive
      - Tailored to their industry and audience
      - Actionable and specific
      
      Return your recommendations as JSON with the following format:
      {
        "colorPalette": {
          "primary": "#hex color",
          "secondary": "#hex color",
          "accent": "#hex color"
        },
        "tagline": "A concise professional tagline",
        "profileBio": "Suggested bio (max 160 characters)",
        "imageryThemes": ["theme1", "theme2", "theme3"],
        "fontRecommendations": ["font1", "font2"]
      }
    `;

    const profileData = {
      username: profile.username,
      name: profile.name,
      bio: profile.bio || "",
      profession: profile.profession || "",
      interests: profile.interests || [],
      socialAccounts: links.map((link) => link.platform) || [],
    };

    // Try OpenAI API first
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(profileData),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (apiError) {
      // If OpenAI API fails, use intelligent fallback logic
      console.log("OpenAI API unavailable, using smart fallback for branding suggestions");
      
      // Smart branding suggestions based on profession and social accounts
      const profession = profile.profession.toLowerCase();
      const socialAccounts = profile.socialAccounts;
      
      // Profession-based color palettes
      let colorPalette = { primary: "#4361ee", secondary: "#3a0ca3", accent: "#f72585" }; // Default
      
      if (profession.includes('developer') || profession.includes('engineer') || profession.includes('tech')) {
        colorPalette = { primary: "#00d4aa", secondary: "#0077be", accent: "#ff6b6b" };
      } else if (profession.includes('designer') || profession.includes('creative')) {
        colorPalette = { primary: "#ff6b6b", secondary: "#4ecdc4", accent: "#45b7d1" };
      } else if (profession.includes('marketing') || profession.includes('business')) {
        colorPalette = { primary: "#6c5ce7", secondary: "#a29bfe", accent: "#fd79a8" };
      } else if (profession.includes('content') || profession.includes('writer')) {
        colorPalette = { primary: "#e17055", secondary: "#fdcb6e", accent: "#6c5ce7" };
      } else if (profession.includes('photographer') || profession.includes('artist')) {
        colorPalette = { primary: "#fd79a8", secondary: "#fdcb6e", accent: "#e17055" };
      }
      
      // Professional taglines based on profession
      let tagline = "Connecting ideas and opportunities";
      if (profession.includes('developer')) {
        tagline = "Building digital solutions that matter";
      } else if (profession.includes('designer')) {
        tagline = "Creating beautiful and functional designs";
      } else if (profession.includes('marketing')) {
        tagline = "Driving growth through strategic marketing";
      } else if (profession.includes('content')) {
        tagline = "Crafting compelling stories and content";
      } else if (profession.includes('entrepreneur')) {
        tagline = "Innovating and building the future";
      }
      
      // Bio suggestions based on profile data
      const name = profile.name || profile.username;
      const bioPrefix = profession ? `${profession} |` : '';
      let profileBio = `${bioPrefix} ${name} - ${tagline}`;
      
      if (socialAccounts.length > 0) {
        const platforms = socialAccounts.slice(0, 3).join(', ');
        profileBio = `${bioPrefix} ${tagline} | Follow me on ${platforms}`;
      }
      
      // Keep bio under 160 characters
      if (profileBio.length > 160) {
        profileBio = `${name} - ${tagline}`;
      }
      
      // Industry-specific imagery themes
      let imageryThemes = ["Professional", "Modern", "Clean", "Minimalist"];
      if (profession.includes('creative') || profession.includes('designer')) {
        imageryThemes = ["Artistic", "Vibrant", "Creative", "Inspirational"];
      } else if (profession.includes('tech') || profession.includes('developer')) {
        imageryThemes = ["Tech", "Innovation", "Digital", "Future"];
      } else if (profession.includes('fitness') || profession.includes('wellness')) {
        imageryThemes = ["Health", "Active", "Wellness", "Motivational"];
      }
      
      // Font recommendations based on profession
      let fontRecommendations = ["Inter", "Poppins"];
      if (profession.includes('creative') || profession.includes('designer')) {
        fontRecommendations = ["Poppins", "Montserrat"];
      } else if (profession.includes('tech') || profession.includes('developer')) {
        fontRecommendations = ["Inter", "Roboto"];
      } else if (profession.includes('business') || profession.includes('finance')) {
        fontRecommendations = ["Lato", "Source Sans Pro"];
      }
      
      return {
        colorPalette,
        tagline,
        profileBio,
        imageryThemes,
        fontRecommendations
      };
    }
  } catch (error) {
    console.error("Error generating branding suggestions:", error);
    throw error;
  }
}

/**
 * Generate a Social Score based on profile activity and optimization
 */
export async function generateSocialScore(
  user: User,
  links: Link[],
  stats: ProfileStats
): Promise<{
  score: number;
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}> {
  try {
    const systemPrompt = `
      You are a social media optimization AI for a link-in-bio profile tool similar to Linktree.
      Your task is to analyze a user's profile and generate a "Social Score" from 0-100 
      that reflects how optimized their profile is.
      
      Consider the following factors when generating a score:
      - Profile completeness (name, bio, image, etc.)
      - Number and diversity of social links
      - Engagement metrics (views, clicks, CTR)
      - Overall profile cohesion and professional appearance
      
      Return your analysis as JSON with:
      {
        "score": a number from 0-100,
        "insights": {
          "strengths": ["strength1", "strength2", ...],
          "weaknesses": ["weakness1", "weakness2", ...],
          "recommendations": ["recommendation1", "recommendation2", ...]
        }
      }
      
      Provide 2-4 points for each of strengths, weaknesses and recommendations.
    `;

    // Prepare user data for analysis (exclude sensitive info)
    const userData = {
      username: user.username,
      name: user.name,
      bio: user.bio || null,
      profession: user.profession || null,
      hasProfileImage: !!user.profileImage,
      hasProfileBackground: !!user.profileBackground,
      hasWelcomeMessage: !!user.welcomeMessage,

      hasPitchMode: !!user.pitchMode,
      theme: user.theme,
      viewMode: user.viewMode,
      font: user.font,
      createdAt: user.createdAt,
    };

    // Prepare links data for analysis
    const linksData = links.map((link) => ({
      platform: link.platform,
      title: link.title,
      clicks: link.clicks || 0,
      views: link.views || 0,
      featured: link.featured || false,
    }));

    // Try OpenAI API first
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              user: userData,
              links: linksData,
              stats: stats,
            }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '{}';
      const result = JSON.parse(content);

      if (!result.score || !result.insights) {
        throw new Error("Invalid response format from OpenAI");
      }

      // Ensure score is within range
      const score = Math.min(100, Math.max(0, Math.round(result.score)));

      return {
        score,
        insights: {
          strengths: result.insights.strengths || [],
          weaknesses: result.insights.weaknesses || [],
          recommendations: result.insights.recommendations || [],
        },
      };
    } catch (apiError) {
      // If OpenAI API fails, use intelligent fallback logic
      console.log("OpenAI API unavailable, using smart fallback for social score");
      
      let score = 0;
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];
      
      // Profile completeness scoring (40 points max)
      if (userData.name) {
        score += 8;
        strengths.push("Complete name field enhances credibility");
      } else {
        weaknesses.push("Missing name reduces professional appearance");
        recommendations.push("Add your full name to increase trust");
      }
      
      if (userData.bio) {
        score += 10;
        strengths.push("Bio provides clear value proposition");
      } else {
        weaknesses.push("Missing bio leaves visitors unclear about your purpose");
        recommendations.push("Write a compelling bio describing what you do");
      }
      
      if (userData.profession) {
        score += 8;
        strengths.push("Professional title helps visitors understand your expertise");
      } else {
        weaknesses.push("Missing profession makes it harder to understand your role");
        recommendations.push("Add your professional title or industry");
      }
      
      if (userData.hasProfileImage) {
        score += 10;
        strengths.push("Profile image creates personal connection");
      } else {
        weaknesses.push("Missing profile image reduces personal connection");
        recommendations.push("Upload a professional profile photo");
      }
      
      if (userData.hasProfileBackground) {
        score += 4;
      } else {
        recommendations.push("Consider adding a background image for visual appeal");
      }
      
      // Link diversity and engagement (35 points max)
      const totalLinks = linksData.length;
      if (totalLinks > 0) {
        score += Math.min(15, totalLinks * 3);
        
        if (totalLinks >= 5) {
          strengths.push(`Good link diversity with ${totalLinks} connections`);
        } else if (totalLinks >= 3) {
          strengths.push(`Decent link collection with ${totalLinks} platforms`);
        } else {
          weaknesses.push(`Limited links - only ${totalLinks} connections`);
          recommendations.push("Add more social media and website links");
        }
      } else {
        weaknesses.push("No links added yet");
        recommendations.push("Start adding your social media and website links");
      }
      
      // Engagement metrics (20 points max)
      const totalClicks = linksData.reduce((sum, link) => sum + link.clicks, 0);
      const totalViews = linksData.reduce((sum, link) => sum + link.views, 0);
      
      if (totalClicks > 0) {
        score += Math.min(10, totalClicks / 2);
        strengths.push(`Active engagement with ${totalClicks} total clicks`);
      } else if (totalLinks > 0) {
        weaknesses.push("Links aren't generating clicks yet");
        recommendations.push("Share your profile more to drive traffic");
      }
      
      if (totalViews > 0) {
        score += Math.min(10, totalViews / 5);
      }
      
      // Additional features (5 points max)
      if (userData.hasWelcomeMessage) {
        score += 3;
        strengths.push("Welcome message creates engaging first impression");
      }
      
      if (userData.hasPitchMode) {
        score += 2;
        strengths.push("Pitch mode showcases your key value proposition");
      }
      
      // Ensure score is within bounds
      score = Math.max(15, Math.min(100, Math.round(score)));
      
      // Add general recommendations if score is low
      if (score < 50) {
        recommendations.push("Focus on completing your profile basics first");
      } else if (score < 75) {
        recommendations.push("Consider adding more engagement features");
      } else {
        recommendations.push("Great profile! Keep sharing to increase engagement");
      }
      
      return {
        score,
        insights: {
          strengths: strengths.slice(0, 4),
          weaknesses: weaknesses.slice(0, 3),
          recommendations: recommendations.slice(0, 4)
        }
      };
    }
  } catch (error) {
    console.error("Error generating social score:", error);
    throw error;
  }
}

/**
 * Uses AI to recommend the best collaborators based on user data and skills
 */
export async function recommendCollaborators(
  userData: Partial<User>, 
  userSkills: UserSkill[], 
  potentialCollaborators: any[]
): Promise<any[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    // Only use non-sensitive data about the user
    const userDataSafe = {
      id: userData.id,
      name: userData.name,
      bio: userData.bio || "",
      profession: userData.profession || "",
      industry: userData.industryId,
      interests: userData.interests || [],
      skills: userSkills.map(s => ({ name: s.skill, level: s.level }))
    };

    // Filter collaborator data to remove sensitive information
    const collaboratorsData = potentialCollaborators.map(collab => ({
      id: collab.user.id,
      name: collab.user.name,
      bio: collab.user.bio || "",
      profession: collab.user.profession || "",
      industry: collab.user.industry?.name || "",
      similarityScore: collab.similarityScore,
      industryMatch: collab.industryMatch,
      skillsMatch: collab.skillsMatch,
      projectsMatch: collab.projectsMatch,
      linksMatch: collab.linksMatch
    }));

    const systemPrompt = `
      You are an expert AI collaboration matchmaker for a professional networking platform.
      Your task is to analyze a user's profile and skills, then recommend the best potential collaborators
      from a list of candidates.
      
      For each recommendation, provide:
      1. A personalized explanation of why this person would be a good collaborator
      2. Highlight specific complementary skills or shared interests
      3. Suggest possible project ideas they could work on together
      
      Return your response as JSON with:
      {
        "recommendations": [
          {
            "id": number,
            "matchScore": number (0-100),
            "explanation": string,
            "complementarySkills": string[],
            "projectIdeas": string[]
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            user: userDataSafe,
            potentialCollaborators: collaboratorsData
          })
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    if (!result.recommendations) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result.recommendations;
  } catch (error) {
    console.error("Error recommending collaborators:", error);
    throw error;
  }
}

/**
 * Generate advanced analytics insights based on user data and engagement metrics
 */
export async function generateAnalyticsInsights(
  user: User,
  links: Link[],
  stats: ProfileStats
): Promise<{
  performanceInsights: string[];
  audienceInsights: string[];
  growthOpportunities: string[];
  contentRecommendations: string[];
  platformSpecificTips: Record<string, string[]>;
}> {
  try {
    const systemPrompt = `
      You are an expert analytics AI consultant for a professional link-in-bio profile platform.
      Your task is to analyze user profile data, links performance, and engagement metrics 
      to provide actionable insights and recommendations.
      
      Consider:
      - Profile views and engagement trends
      - Link click-through rates across different platforms
      - Audience demographics and behavior patterns
      - Industry benchmarks and best practices
      - Content optimization opportunities
      
      Return your analysis as JSON with:
      {
        "performanceInsights": [string, string, ...],
        "audienceInsights": [string, string, ...],
        "growthOpportunities": [string, string, ...],
        "contentRecommendations": [string, string, ...],
        "platformSpecificTips": {
          "platform1": [string, string, ...],
          "platform2": [string, string, ...]
        }
      }
      
      Provide 2-4 actionable insights for each category.
      For platformSpecificTips, only include platforms that appear in the user's links.
    `;

    // Prepare user data for analysis (exclude sensitive info)
    const userData = {
      username: user.username,
      name: user.name,
      bio: user.bio || null,
      profession: user.profession || null,
      industry: user.industryId,
      viewMode: user.viewMode,
      createdAt: user.createdAt,
    };

    // Prepare links data for analysis
    const linksData = links.map((link) => ({
      platform: link.platform,
      title: link.title,
      clicks: link.clicks ?? 0,
      views: link.views ?? 0,
      ctr: (link.views ?? 0) > 0 ? ((link.clicks ?? 0) / (link.views ?? 0)) * 100 : 0,
      featured: link.featured || false,
    }));

    // Get unique platforms
    const platforms = Array.from(new Set(links.map(link => link.platform)));

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            user: userData,
            links: linksData,
            stats: stats,
            platforms: platforms
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    return {
      performanceInsights: result.performanceInsights || [],
      audienceInsights: result.audienceInsights || [],
      growthOpportunities: result.growthOpportunities || [],
      contentRecommendations: result.contentRecommendations || [],
      platformSpecificTips: result.platformSpecificTips || {},
    };
  } catch (error) {
    console.error("Error generating analytics insights:", error);
    throw error;
  }
}