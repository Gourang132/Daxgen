import Groq from "groq-sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    if (!body) return res.status(400).json({ error: "No body provided" });

    const { prompt, advanced } = body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // 🔹 BASIC MODE
    if (!advanced) {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a DAX expert. Output ONLY clean production-ready DAX formula with inline comments. No explanation outside code.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
      });

      return res.status(200).json({
        result: response.choices[0].message.content,
      });
    }

    // 🔥 ADVANCED MODE (5 agents)

    const agent1 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Act as Power BI Business Analyst. Give 3 bullet points: metric, filters, time intelligence.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    });

    const agent2 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Act as Data Model Expert. Suggest tables, columns, relationships.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    });

    const agent3 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Write production-ready DAX formula. Output only code with comments.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });

    const agent4 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Optimize this DAX formula for performance. Output only optimized code.",
        },
        { role: "user", content: agent3.choices[0].message.content },
      ],
      max_tokens: 500,
    });

    const agent5 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Explain this DAX in simple English (3-4 lines, non-technical).",
        },
        { role: "user", content: agent4.choices[0].message.content },
      ],
      max_tokens: 200,
    });

    return res.status(200).json({
      result: agent4.choices[0].message.content,
      advanced: true,
      analysis: agent1.choices[0].message.content,
      modelSuggestion: agent2.choices[0].message.content,
      explanation: agent5.choices[0].message.content,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
