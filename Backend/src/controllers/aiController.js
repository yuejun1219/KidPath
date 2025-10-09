const { chatWithText, chatWithVoice, chatWithPhoto } = require("../services/aiService");

// 文本
async function chatText(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const reply = await chatWithText(message);
    res.json(reply);
  } catch (err) {
    console.error("GPT text error:", err);
    res.status(500).json({ error: "GPT text API error" });
  }
}

// 语音
async function chatVoice(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "audio file is required" });
    }

    const reply = await chatWithVoice(req.file.buffer, req.file.originalname);
    res.json({ reply });
  } catch (err) {
    console.error("GPT voice error:", err);
    res.status(500).json({ error: "GPT voice API error" });
  }
}

// 图片
async function chatPhoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "image file is required" });

    const reply = await chatWithPhoto(req.file.buffer);
    res.json(reply);
  } catch (err) {
    console.error("GPT photo error:", err);
    res.status(500).json({ error: "GPT photo API error" });
  }
}

module.exports = { chatText, chatVoice, chatPhoto };
