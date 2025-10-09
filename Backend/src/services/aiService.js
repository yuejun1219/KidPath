const OpenAI = require("openai");
const fs = require("fs");
const { findPlaygroundsByKeyword } = require("../queries/playgr");
const { toFile } = require('openai'); // 这是关键！
console.log("🔑 OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);

// 初始化 OpenAI 客户端
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
    const response = await client.responses.create({
      model: "gpt-4o-mini", // 可换成 gpt-4o / gpt-4.1
      input: [
        { role: "system", content: systemInstruction },
        { role: "user", content: buildUserPrompt(message) },
      ],
      temperature: 0.4,
      top_p: 0.9,              // ✅ 改正确
      max_output_tokens: 256,  // ✅ 限制回答简短
    });

    return response.output_text;
  } catch (error) {
    console.error("chatWithText error:", error.message);
    throw error;
  }
}

// === Voice Chat === (语音转录 → 文本 → GPT)



async function chatWithVoice(audioBuffer, originalName = "audio.wav") {
  try {
    // 1. 使用 OpenAI 官方的 toFile 函数
    const file = await toFile(audioBuffer, originalName, {
      type: 'audio/wav',
    });

    // 2. 转录语音
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    const transcript = transcription.text;

    // 3. 用文字继续 GPT 对话
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: transcript }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("chatWithVoice error:", error);
    throw error;
  }
}





// === Photo Chat === (图片识别 → DB 查询)
async function chatWithPhoto(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString("base64");

    // Step 1: 用 GPT 识别 playground 关键词
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
    });

    const keyword = visionResponse.choices[0].message.content.trim().split(/\s+/)[0].toLowerCase();
    console.log("Extracted keyword:", keyword);

    // Step 2: 查数据库
    const results = await findPlaygroundsByKeyword(keyword, 5);

    // Step 3: 返回结构化结果
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
