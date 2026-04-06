import Groq from "groq-sdk";
import { Pool } from "pg";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, userId } = req.body;

  try {
    let systemContext = `
You are SymCheck, an AI medical assistant.

INSTRUCTIONS:
- Keep responses under 100 words
- Be clear, practical, and easy to understand
- Provide:
  1. Likely cause
  2. Immediate remedies
  3. Suggested medicines (with side effects briefly)
- Do NOT use special characters or markdown
- Keep formatting clean and readable
`;

    let latestSummary = "";

    // 🔹 Fetch patient history (if logged in)
    if (userId) {
      const result = await pool.query(
        "SELECT summary FROM history WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
        [userId]
      );

      if (result.rows.length > 0) {
        latestSummary = result.rows[0].summary;

        systemContext += `
        
PATIENT FILE:
${latestSummary}

Use this to personalize the response.
`;
      }
    }

    // 🔹 AI RESPONSE
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const aiText =
      completion.choices[0]?.message?.content || "No response";

    res.json({ reply: aiText });

    // 🔹 SAVE UPDATED SUMMARY (async, no blocking)
    if (userId) {
      updateSummary(userId, latestSummary, message, aiText);
    }

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "Error connecting to AI." });
  }
}

// ==============================
// 🔹 SUMMARY UPDATE FUNCTION
// ==============================
async function updateSummary(userId, oldSummary, userMsg, aiMsg) {
  const prompt = `
Previous Summary: "${oldSummary || "None"}"

New Interaction:
Patient: "${userMsg}"
Doctor: "${aiMsg}"

TASK:
Update patient medical summary.

RULES:
- Remove symptoms if patient says they are cured
- Keep allergies, chronic diseases, medications
- Add new issues
- Keep under 50 words
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const newSummary =
      completion.choices[0]?.message?.content || "";

    await pool.query(
      "INSERT INTO history (user_id, summary) VALUES ($1, $2)",
      [userId, newSummary]
    );

  } catch (err) {
    console.error("Summary update failed:", err);
  }
}