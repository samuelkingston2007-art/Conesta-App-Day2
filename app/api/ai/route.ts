import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// A list of simple inappropriate/offensive words for content filtering
const BANNED_KEYWORDS = [
  "abuse", "kill", "die", "bomb", "weapon", "terror", "hack", 
  "exploit", "hate", "slur", "porn", "naked", "sex", "drugs", "illegal"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, occasion, budget, interests, tone, prompt } = body;

    // 1. Payload validation & Guardrails
    const recipientStr = String(recipient || "").trim();
    const occasionStr = String(occasion || "").trim();
    const interestsStr = String(interests || "").trim();
    const toneStr = String(tone || "").trim();

    // Guard against excessively long strings (prevents prompt injections and abuse)
    if (
      recipientStr.length > 150 ||
      occasionStr.length > 100 ||
      interestsStr.length > 200 ||
      toneStr.length > 50
    ) {
      return NextResponse.json(
        { error: "Content guardrail: Input fields exceed maximum allowed character limits." },
        { status: 400 }
      );
    }

    // 2. Simple content filtering checks
    const joinedInputs = `${recipientStr} ${occasionStr} ${interestsStr} ${toneStr} ${prompt || ""}`.toLowerCase();
    const containsInappropriate = BANNED_KEYWORDS.some(word => joinedInputs.includes(word));
    
    if (containsInappropriate) {
      return NextResponse.json(
        { error: "Content guardrail: Your prompt contains keywords that violate our community safety filters. Please try another request." },
        { status: 400 }
      );
    }

    let userPrompt = "";
    if (prompt && !recipient) {
      userPrompt = `Please recommend 3 structured gifts in JSON format for: ${prompt}`;
    } else {
      userPrompt = `Suggest gifts for the following profile:
- Recipient Profile: ${recipientStr || "General"}
- Occasion: ${occasionStr || "Any Occasion"}
- Budget limit: ${budget ? Number(budget) : "No strict budget limit"}
- Key interests/hobbies: ${interestsStr || "General interest"}
- Gift Tone style: ${toneStr || "Practical"}`;
    }

    const systemPrompt = `You are a premium AI Gift Concierge. Recommend exactly 3 creative, high-affinity gift options based on the user criteria.
You MUST respond with a JSON object containing a "recommendations" array.
Each item in the "recommendations" array must be an object containing EXACTLY the following keys:
- "name": string (the exact specific name of the product or item)
- "reason": string (1-2 sentences explaining why this fits the recipient's interests, profile, and the occasion)
- "estimatedPrice": number (the approximate cost as a number, staying under the user's budget if specified)
- "whereToBuy": string (the suggested buying source like "Amazon", "Etsy", "Steam Store", "Local Florist", etc.)
- "matchPercentage": number (integer between 75 and 99 reflecting how closely it fits the criteria)
- "giftType": string (must be one of: "Physical", "Experience", "DIY")

Ensure the JSON is perfectly valid and matches this structure. Do not output any explanations outside of the JSON structure.`;

    let content = "";
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      content = completion.choices[0]?.message?.content || "";
    } catch (apiError: any) {
      console.warn("Groq API Call failed. Triggering structured mock fallback:", apiError.message);
      return NextResponse.json(getFallbackRecommendations(recipientStr, occasionStr));
    }

    // 3. Robust JSON cleaning & parsing fallback
    let responseJson;
    try {
      let jsonString = content.trim();
      
      // Clean up potential markdown wrappers
      if (jsonString.includes("```")) {
        const match = jsonString.match(/```(?:json)?([\s\S]*?)```/);
        if (match) {
          jsonString = match[1].trim();
        }
      }
      
      responseJson = JSON.parse(jsonString);
      
      // Validate schema format is present
      if (!responseJson.recommendations || !Array.isArray(responseJson.recommendations)) {
        throw new Error("Invalid schema structure returned from LLM");
      }
    } catch (parseError) {
      console.warn("Failed to parse LLM response JSON. Using cleaned fallback suggestions.", parseError);
      return NextResponse.json(getFallbackRecommendations(recipientStr, occasionStr));
    }

    return NextResponse.json(responseJson);
  } catch (error: any) {
    console.error("General AI endpoint error:", error);
    return NextResponse.json(
      { error: "AI advisor encountered a system error: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}

// Fallback recommendations generator to ensure the app never crashes
function getFallbackRecommendations(recipient: string, occasion: string) {
  return {
    recommendations: [
      {
        name: "Custom Gift Basket",
        reason: `A personalized collection of fine items curated especially for your ${recipient || "recipient"} to celebrate this ${occasion || "occasion"}.`,
        estimatedPrice: 2000,
        whereToBuy: "Local Boutique / Etsy",
        matchPercentage: 88,
        giftType: "Physical"
      },
      {
        name: "Interactive Experience Voucher",
        reason: `An engaging workshop or class voucher matching hobbies and providing a memorable experience for the ${occasion || "occasion"}.`,
        estimatedPrice: 3500,
        whereToBuy: "BookMyShow / TripAdvisor",
        matchPercentage: 85,
        giftType: "Experience"
      },
      {
        name: "Handmade Scrapbook or Photo Album",
        reason: `A beautifully crafted, sentimental layout documenting your favorite memories with your ${recipient || "recipient"}.`,
        estimatedPrice: 800,
        whereToBuy: "DIY Craft Store",
        matchPercentage: 90,
        giftType: "DIY"
      }
    ]
  };
}