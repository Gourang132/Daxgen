const Groq = require("groq-sdk");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    if (!body) return res.status(400).json({ error: "No body provided" });

    const { prompt, advanced } = body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    if (!advanced) {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a DAX formula expert for Power BI. Generate only clean, production-ready DAX formula with brief inline comments. No extra explanation outside the formula." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500
      });
      return res.status(200).json({ result: response.choices[0].message.content });
    }

    const agent1 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a Power BI Business Analyst. Analyze the user requirement in 3 bullet points: what metric they want, what filters needed, what time intelligence needed. Be brief." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300
    });

    const agent2 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a Power BI Data Model Expert. Suggest required table names, column names, and relationships needed. Be brief and specific." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300
    });

    const agent3 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a DAX Developer. Write a production-ready DAX formula. Output only the DAX code with comments." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    });

    const agent4 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a senior DAX performance expert. Optimize this DAX formula. Output only the optimized DAX code." },
        { role: "user", content: agent3.choices[0].message.content }
      ],
      max_tokens: 500
    });

    const agent5 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Explain this DAX formula in 3-4 simple plain English sentences. No technical jargon." },
        { role: "user", content: agent4.choices[0].message.content }
      ],
      max_tokens: 200
    });

    return res.status(200).json({
      result: agent4.choices[0].message.content,
      advanced: true,
      analysis: agent1.choices[0].message.content,
      modelSuggestion: agent2.choices[0].message.content,
      explanation: agent5.choices[0].message.content
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
