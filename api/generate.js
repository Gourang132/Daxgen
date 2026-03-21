const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function runAgent(systemPrompt, userMessage) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    max_tokens: 500
  });
  return response.choices[0].message.content;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { prompt, advanced } = body;

    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    if (!advanced) {
      // Simple mode - single agent
      const result = await runAgent(
        "You are a DAX formula expert for Power BI. Generate only the DAX formula with brief comments. No extra explanation. Keep it clean and production-ready.",
        prompt
      );
      return res.status(200).json({ result });
    }

    // ADVANCED MODE - 5 Agent Pipeline!

    // Agent 1 - Business Analyst
    const analysis = await runAgent(
      `You are a Power BI Business Analyst. 
      Analyze the user requirement and identify:
      1. What metric they want to calculate
      2. What filters or conditions are needed
      3. What time intelligence is required (YTD, MTD, YoY etc)
      Keep response to 3 bullet points only.`,
      prompt
    );

    // Agent 2 - Data Model Expert (NEW!)
    const modelSuggestion = await runAgent(
      `You are a Power BI Data Model Expert.
      Based on the requirement, suggest:
      1. Likely table names (e.g. Sales, Date, Customer, Product)
      2. Likely column names needed (e.g. Sales[Amount], Date[Date])
      3. Relationships needed for this formula to work
      Keep it brief - this helps the DAX developer write accurate formulas.`,
      `User requirement: ${prompt}\nAnalysis: ${analysis}`
    );

    // Agent 3 - DAX Developer
    const formula = await runAgent(
      `You are an expert DAX developer for Power BI.
      Write a production-ready DAX formula based on:
      - The user requirement
      - The business analysis
      - The suggested data model
      Output ONLY the DAX formula with inline comments.
      Use proper DAX best practices.`,
      `Requirement: ${prompt}
      Analysis: ${analysis}
      Data Model: ${modelSuggestion}`
    );

    // Agent 4 - DAX Reviewer
    const optimized = await runAgent(
      `You are a senior DAX performance expert.
      Review this DAX formula and:
      1. Fix any syntax errors
      2. Optimize for performance (avoid row context issues)
      3. Ensure filter context is handled correctly
      Output ONLY the optimized DAX formula with comments.`,
      `Original formula:\n${formula}\nData Model context:\n${modelSuggestion}`
    );

    // Agent 5 - Plain English Explainer
    const explanation = await runAgent(
      `You are a friendly Power BI teacher.
      Explain this DAX formula in simple plain English.
      Cover:
      1. What it calculates
      2. How it works (in simple terms)
      3. When to use it
      Maximum 4 lines. No technical jargon.`,
      `DAX Formula:\n${optimized}`
    );

    return res.status(200).json({
      result: optimized,
      analysis,
      modelSuggestion,
      explanation,
      advanced: true
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
