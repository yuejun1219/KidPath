const { chatWithGemini } = require("../services/aiService");

async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const reply = await chatWithGemini(message);
    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini API error" });
  }
}

module.exports = { chat };
