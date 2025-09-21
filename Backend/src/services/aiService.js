// Backend/src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// system instruction
const systemInstruction = `
You are KidPath's AI guide for parents. Keep answers concise, practical, and action-oriented.

⚠️ Always assume the user is asking about Melbourne city centre (CBD) and nearby suburbs only. 
Do NOT give suggestions for other cities or countries.

When asked about Melbourne outdoor comfort: mention shade (summer), sun exposure (winter), UV safety, water refill spots, and child-friendly places in Melbourne CBD.

Tone: warm, reassuring, and clear. Use short paragraphs and bullets when helpful.
`

// generation config
const generationConfig = {
  temperature: 0.4,          
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 512
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction,          
  generationConfig            
});

// simple user prompt, ensure context stability
function buildUserPrompt(userMessage) {
  return `
[User question]
${userMessage}

[Context]
- App: KidPath (parents plan safe & comfortable outdoor trips in Melbourne).
- Prioritize: shade in summer, sun exposure in winter, water/fountain, playgrounds, libraries, route safety.
- If asking for steps, give 3–5 clear steps.
- If asking for locations, mention criteria (no need to invent exact coordinates).
- If outside scope, say so briefly and suggest a relevant path.
- All answers must be about Melbourne CBD and inner suburbs.
- If the user asks outside Melbourne, politely say "I only provide tips for Melbourne city centre."

[Answer style]
- Start with a one-sentence summary.
- Then 3–5 bullet points with practical tips.
- Keep it under 8 sentences unless explicitly asked for more.
`;
}

async function chatWithGemini(message) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wrap user questions in a unified template 
      const userPrompt = buildUserPrompt(message);
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (error) {
      console.error(`Gemini API attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // If it's a 503 error (overloaded), wait and retry
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        if (attempt < maxRetries) {
          console.log(`Waiting ${attempt * 2} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
      }
      
      // For other errors or max retries reached, throw immediately
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
  
  throw new Error(`Gemini API error after ${maxRetries} attempts: ${lastError.message}`);
}

module.exports = { chatWithGemini };
