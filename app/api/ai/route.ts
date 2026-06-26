import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, occasion, budget, interests, tone, prompt } = body;

    let userPrompt = "";

    if (prompt && !recipient) {
      // Backwards compatibility for single text prompts
      userPrompt = `Please recommend 3 structured gifts in JSON format for: ${prompt}`;
    } else {
      userPrompt = `Suggest gifts for the following profile:
- Recipient Profile: ${recipient || "General"}
- Occasion: ${occasion || "Any Occasion"}
- Budget limit: ${budget ? budget : "No strict budget limit"}
- Key interests/hobbies: ${interests || "General interest"}
- Gift Tone style: ${tone || "Practical"}`;
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

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const responseJson = JSON.parse(content);

    return NextResponse.json(responseJson);
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate structured AI recommendations: " + (error.message || "") },
      { status: 500 }
    );
  }
}