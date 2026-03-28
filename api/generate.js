const Groq = require("groq-sdk");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { prompt, advanced } = req.body;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // =========================
    // SIMPLE MODE
    // =========================
    if (!advanced) {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a DAX expert. Generate clean production-ready DAX only."
          },
          { role: "user", content: prompt }
        ]
      });

      return res.json({
        result: response.choices[0].message.content
      });
    }

    // =========================
    // 🔥 5 AGENT PIPELINE
    // =========================

    // 🧠 AGENT 1: Business Analyst
    const agent1 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Act as a Business Analyst. Explain what the user wants."
        },
        { role: "user", content: prompt }
      ]
    });

    // 🏗️ AGENT 2: Data Model Expert
    const agent2 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Suggest required tables, columns and relationships."
        },
        { role: "user", content: prompt }
      ]
    });

    // ✍️ AGENT 3: DAX Developer
    const agent3 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Generate correct DAX formula."
        },
        { role: "user", content: prompt }
      ]
    });

    // 🔍 AGENT 4: DAX Reviewer (Optimization)
    const agent4 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Optimize this DAX for performance and best practices."
        },
        { role: "user", content: agent3.choices[0].message.content }
      ]
    });

    // 📖 AGENT 5: Explainer
    const agent5 = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Explain this DAX in simple English."
        },
        { role: "user", content: agent4.choices[0].message.content }
      ]
    });

    return res.json({
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
