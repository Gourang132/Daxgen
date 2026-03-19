const Groq = require("groq-sdk");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const prompt = body?.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a DAX formula expert for Power BI. Generate only the DAX formula with brief comments. No extra explanation. Keep it clean and production-ready."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return res.status(200).json({
      result: response.choices[0].message.content
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
