const { File } = require("node:buffer");
globalThis.File = File;

const OpenAI = require("openai");
const { findPlaygroundsByKeyword } = require("../queries/playgr");
const { toFile } = require('openai');
console.log("OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);

// initialize OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === System instruction ===
const systemInstruction = `
You are KidPath's AI guide for parents. 
Keep answers concise, practical, and action-oriented.

⚠️ Always assume the user is asking about Melbourne city centre (CBD) and nearby suburbs only. 
Do NOT give suggestions for other cities or countries.

When asked about Melbourne outdoor comfort: mention shade (summer), sun exposure (winter), UV safety, water refill spots, and child-friendly places in Melbourne CBD.

Tone: warm, reassuring, and clear. Use short paragraphs and bullets when helpful.
`;

// === Text Chat ===
async function chatWithText(message) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: buildUserPrompt(message) },
      ],
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 256,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("chatWithText error:", error.message);
    throw error;
  }
}

// === Voice Chat === (voice -> text -> GPT)



async function chatWithVoice(audioBuffer, originalName = "audio.wav") {
  try {
    // 1. toFile function
    const file = await toFile(audioBuffer, originalName, {
      type: 'audio/wav',
    });

    // 2. voice -> text
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    const transcript = transcription.text;

    // 3. text -> GPT
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: transcript }
      ],
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 256,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("chatWithVoice error:", error);
    throw error;
  }
}





// === Photo Chat === (photo check -> DB query)
async function chatWithPhoto(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString("base64");

    // Step 1: use GPT to find playground keyword
    const visionResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an image analysis assistant." },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the main playground equipment in this photo. Answer with ONE keyword only (e.g., slide, swing, climbing).",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const keyword = visionResponse.choices[0].message.content.trim().split(/\s+/)[0].toLowerCase();
    console.log("Extracted keyword:", keyword);

    // Step 2: query DB for playgrounds with this keyword
    const results = await findPlaygroundsByKeyword(keyword, 5);

    // Step 3: return structured response
    return {
      keyword,
      summary: `I found ${results.length} playgrounds with a ${keyword} in Melbourne CBD area.`,
      recommendations: results.map((r) => ({
        name: r.name,
        features: r.features,
        shade: r.shade_coverage,
      })),
    };
  } catch (error) {
    console.error("chatWithPhoto error:", error.message);
    throw error;
  }
}

// === Helper: buildUserPrompt ===
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

[Answer format]
Your answer MUST follow this template:

Summary:
<1 short sentence summary of the answer>

Tips:
- <tip 1, one sentence>
- <tip 2, one sentence>
- <tip 3, one sentence>
(Only 3–5 bullets, keep it under 6 sentences total)
`;
}

module.exports = {
  chatWithText,
  chatWithVoice,
  chatWithPhoto,
};
