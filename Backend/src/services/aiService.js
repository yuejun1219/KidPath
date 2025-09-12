// Backend/src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ 系统提示：定义模型角色与风格（你想“微调”的核心）
const systemInstruction = `
You are KidPath's AI guide for parents. Keep answers concise, practical, and action-oriented.

⚠️ Always assume the user is asking about Melbourne city centre (CBD) and nearby suburbs only. 
Do NOT give suggestions for other cities or countries.

When asked about Melbourne outdoor comfort: mention shade (summer), sun exposure (winter), UV safety, water refill spots, and child-friendly places in Melbourne CBD.

Tone: warm, reassuring, and clear. Use short paragraphs and bullets when helpful.
`;


// ✅ 生成参数：温度、长度等
const generationConfig = {
  temperature: 0.4,          // 更稳重
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 512
};

// 选用较快的模型
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction,          // ← 挂上你的系统提示
  generationConfig            // ← 默认生成参数
});

// 可选：简单的用户模板，确保上下文稳定
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
  // Wrap user questions in a unified template 
  const userPrompt = buildUserPrompt(message);
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

module.exports = { chatWithGemini };
